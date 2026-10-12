//! "Types along with you" (`pet.typing`, off by default; owner decision 2026-10-12).
//!
//! The pet window gets `pet://typing` = `true` when you start typing anywhere and `false` about
//! three seconds after you stop. Only a running *count* of key presses is read, never which key,
//! and nothing is stored or sent anywhere. The count is polled five times a second.
//!
//! * **Windows**: a low-level keyboard hook (`WH_KEYBOARD_LL`) on its own thread that only adds
//!   one to a counter per key-down. It is installed only while the setting is on.
//! * **macOS**: `CGEventSourceCounterForEventType(kCGEventKeyDown)`, the system's own key-down
//!   counter. macOS may ask for Input Monitoring; Loaf asks for it when the switch is turned on.
//! * Elsewhere: nothing happens.
//!
//! Unverified on a real OS: CI builds this, but nobody has typed at it yet.

use std::sync::Arc;
use std::time::{Duration, Instant};

use loaf_core::bus::{EventBus, Recv};
use loaf_core::events::Event;
use loaf_core::settings_service::SettingsService;
use tauri::{AppHandle, Emitter};

/// How long without a key press before the pet stops typing.
pub const STOP_AFTER: Duration = Duration::from_secs(3);
const POLL: Duration = Duration::from_millis(200);

/// Turns a growing key count into "started typing" / "stopped typing". Pure, so it is tested.
#[derive(Debug, Default)]
pub struct Detector {
    last_total: Option<u64>,
    last_press: Option<Instant>,
    typing: bool,
}

impl Detector {
    /// Feed the current total; returns `Some(state)` only when the state changes.
    pub fn step(&mut self, total: u64, now: Instant) -> Option<bool> {
        // The first reading is only a baseline: keys pressed before the switch went on don't count.
        let pressed = self.last_total.is_some_and(|last| total != last);
        self.last_total = Some(total);
        if pressed {
            self.last_press = Some(now);
        }
        let typing = self
            .last_press
            .is_some_and(|t| now.duration_since(t) < STOP_AFTER);
        (typing != self.typing).then(|| {
            self.typing = typing;
            typing
        })
    }
}

/// Follow `pet.typing`: count while it is on, tell the pet window when typing starts and stops.
pub fn start(app: AppHandle, settings: Arc<SettingsService>, bus: &EventBus) {
    let mut events = bus.subscribe();
    tauri::async_runtime::spawn(async move {
        let enabled = |all: std::collections::BTreeMap<String, serde_json::Value>| {
            all.get("pet.typing").and_then(serde_json::Value::as_bool) == Some(true)
        };
        let mut on = enabled(settings.get_all().await.unwrap_or_default());
        let mut detector = Detector::default();
        let mut counter = on.then(os::Counter::start).flatten();
        let mut tick = tokio::time::interval(POLL);
        loop {
            tokio::select! {
                _ = tick.tick(), if counter.is_some() => {
                    if let Some(total) = counter.as_ref().map(os::Counter::total) {
                        if let Some(typing) = detector.step(total, Instant::now()) {
                            let _ = app.emit_to(crate::pet::LABEL, "pet://typing", typing);
                        }
                    }
                    continue;
                }
                event = events.recv() => match event {
                    Recv::Event(Event::SettingChanged { key, .. }) if key == "pet.typing" => {}
                    Recv::Event(Event::AllDataDeleted { .. }) | Recv::Resync { .. } => {}
                    Recv::Event(_) => continue,
                    Recv::Closed => break,
                },
            }
            let want = enabled(settings.get_all().await.unwrap_or_default());
            if want != on {
                on = want;
                counter = None; // dropping the counter removes the hook
                detector = Detector::default();
                let _ = app.emit_to(crate::pet::LABEL, "pet://typing", false);
                if on {
                    counter = os::Counter::start();
                    if counter.is_none() {
                        tracing::warn!(
                            "couldn't start counting key presses; the pet won't type along"
                        );
                    }
                }
            }
        }
    });
}

#[cfg(windows)]
mod os {
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::mpsc;
    use std::thread::JoinHandle;
    use std::time::Duration;

    use windows_sys::Win32::Foundation::{LPARAM, LRESULT, WPARAM};
    use windows_sys::Win32::System::Threading::GetCurrentThreadId;
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        CallNextHookEx, DispatchMessageW, GetMessageW, PeekMessageW, PostThreadMessageW,
        SetWindowsHookExW, TranslateMessage, UnhookWindowsHookEx, HC_ACTION, MSG, PM_NOREMOVE,
        WH_KEYBOARD_LL, WM_KEYDOWN, WM_QUIT, WM_SYSKEYDOWN, WM_USER,
    };

    static PRESSES: AtomicU64 = AtomicU64::new(0);

    pub struct Counter {
        thread_id: u32,
        join: Option<JoinHandle<()>>,
    }

    impl Counter {
        pub fn start() -> Option<Self> {
            let (ready_tx, ready_rx) = mpsc::channel::<Option<u32>>();
            let join = std::thread::Builder::new()
                .name("loaf-keycount".into())
                .spawn(move || hook_thread(&ready_tx))
                .ok()?;
            match ready_rx.recv_timeout(Duration::from_secs(2)) {
                Ok(Some(thread_id)) => Some(Self {
                    thread_id,
                    join: Some(join),
                }),
                _ => None,
            }
        }

        pub fn total(&self) -> u64 {
            PRESSES.load(Ordering::Relaxed)
        }
    }

    impl Drop for Counter {
        fn drop(&mut self) {
            // SAFETY: plain FFI call to a thread this module started; its queue exists (forced
            // before `start` returned) and WM_QUIT ends its message loop, which unhooks.
            unsafe {
                PostThreadMessageW(self.thread_id, WM_QUIT, 0, 0);
            }
            if let Some(join) = self.join.take() {
                let _ = join.join();
            }
        }
    }

    fn hook_thread(ready: &mpsc::Sender<Option<u32>>) {
        // SAFETY: plain FFI calls on this thread with valid arguments. A low-level hook is
        // called on the installing thread from inside `GetMessageW`, and it is removed before
        // the thread ends.
        unsafe {
            let mut msg = MSG::default();
            PeekMessageW(
                &mut msg,
                std::ptr::null_mut(),
                WM_USER,
                WM_USER,
                PM_NOREMOVE,
            );
            let hook = SetWindowsHookExW(WH_KEYBOARD_LL, Some(on_key), std::ptr::null_mut(), 0);
            if hook.is_null() {
                let _ = ready.send(None);
                return;
            }
            let _ = ready.send(Some(GetCurrentThreadId()));
            while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }
            UnhookWindowsHookEx(hook);
        }
    }

    /// Counts a key-down and passes it on untouched. The key itself (`lparam`) is never read.
    unsafe extern "system" fn on_key(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
        if code == HC_ACTION as i32
            && (wparam == WM_KEYDOWN as WPARAM || wparam == WM_SYSKEYDOWN as WPARAM)
        {
            PRESSES.fetch_add(1, Ordering::Relaxed);
        }
        // SAFETY: forwarding the hook call unchanged, as Windows requires.
        unsafe { CallNextHookEx(std::ptr::null_mut(), code, wparam, lparam) }
    }
}

#[cfg(target_os = "macos")]
mod os {
    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventSourceCounterForEventType(state: i32, event_type: u32) -> u32;
    }
    #[link(name = "IOKit", kind = "framework")]
    extern "C" {
        fn IOHIDRequestAccess(request: u32) -> bool;
    }
    const HID_SYSTEM_STATE: i32 = 1;
    const KEY_DOWN: u32 = 10;
    const LISTEN_EVENT: u32 = 1;

    pub struct Counter;

    impl Counter {
        pub fn start() -> Option<Self> {
            // SAFETY: plain FFI call. Shows the Input Monitoring prompt the first time; the
            // counter below still runs either way and simply stays flat without permission.
            unsafe {
                IOHIDRequestAccess(LISTEN_EVENT);
            }
            Some(Self)
        }

        pub fn total(&self) -> u64 {
            // SAFETY: plain FFI call with constant arguments.
            u64::from(unsafe { CGEventSourceCounterForEventType(HID_SYSTEM_STATE, KEY_DOWN) })
        }
    }
}

#[cfg(not(any(windows, target_os = "macos")))]
mod os {
    pub struct Counter;

    impl Counter {
        pub fn start() -> Option<Self> {
            None
        }

        pub fn total(&self) -> u64 {
            0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_first_reading_is_only_a_baseline() {
        let mut d = Detector::default();
        assert_eq!(d.step(500, Instant::now()), None);
    }

    #[test]
    fn starts_on_a_press_and_stops_three_seconds_after_the_last() {
        let t0 = Instant::now();
        let mut d = Detector::default();
        d.step(0, t0);
        assert_eq!(d.step(2, t0 + Duration::from_millis(200)), Some(true));
        assert_eq!(
            d.step(5, t0 + Duration::from_millis(400)),
            None,
            "still typing"
        );
        assert_eq!(
            d.step(5, t0 + Duration::from_millis(3300)),
            None,
            "under 3 s since the last press"
        );
        assert_eq!(d.step(5, t0 + Duration::from_millis(3400)), Some(false));
        assert_eq!(
            d.step(6, t0 + Duration::from_millis(5000)),
            Some(true),
            "starts again"
        );
    }

    #[test]
    fn a_counter_that_wraps_still_counts_as_a_press() {
        let t0 = Instant::now();
        let mut d = Detector::default();
        d.step(u64::from(u32::MAX), t0);
        assert_eq!(d.step(0, t0 + POLL), Some(true));
    }
}
