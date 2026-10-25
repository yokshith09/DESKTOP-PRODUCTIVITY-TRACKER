//! The operating-system side of app tracking (opt-in, `tracking.apps`).
//!
//! Everything that decides anything lives in `loaf-core` (`usage`, `usage_collector`) and is
//! tested there. This file only supplies the two things an OS has to: *which window is in front*
//! and *how long since the last input*.
//!
//! * **Windows**: a `SetWinEventHook(EVENT_SYSTEM_FOREGROUND)` hook on its own thread with a
//!   blocking message loop (no polling), resolving the window to its executable's file name
//!   (never the path, never the title). Processes that deny access (elevated ones) report
//!   nothing. Idle time comes from `GetLastInputInfo`.
//! * **macOS**: `NSWorkspace.frontmostApplication` (the app's name as macOS shows it, e.g.
//!   "Google Chrome"), looked at once a second on its own thread and reported only when it
//!   changes. That one-second look is an exception to ADR-009: the notification needs a run loop
//!   this thread doesn't have, and the look is a single in-process call. Idle time comes from
//!   `CGEventSourceSecondsSinceLastEventType`. No permission is needed.
//! * Elsewhere: [`start`] returns [`Unsupported`] and the UI shows tracking as unavailable.

use std::sync::Arc;

use loaf_core::bus::EventBus;
use loaf_core::clock::Clock;
use loaf_core::settings_service::SettingsService;
use loaf_core::usage::UsageService;
use loaf_core::usage_collector::Collector;

/// This operating system has no collector yet. (Never built on Windows or macOS.)
#[cfg_attr(any(windows, target_os = "macos"), allow(dead_code))]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Unsupported;

/// The running collector, if this platform has one.
pub struct Tracking {
    collector: Option<Collector>,
}

impl Tracking {
    pub fn unsupported() -> Self {
        Self { collector: None }
    }

    pub fn supported(&self) -> bool {
        self.collector.is_some()
    }

    pub fn is_running(&self) -> bool {
        self.collector.as_ref().is_some_and(Collector::is_running)
    }

    /// After `AppShuttingDown`: wait until the open session has been written.
    pub async fn finish(&self) {
        if let Some(collector) = &self.collector {
            collector.finish().await;
        }
    }
}

/// Start the collector task. It only starts watching windows while `tracking.apps` is on.
/// Must be called inside the async runtime.
#[cfg(any(windows, target_os = "macos"))]
pub fn start(
    usage: Arc<UsageService>,
    settings: Arc<SettingsService>,
    clock: Arc<dyn Clock>,
    bus: &EventBus,
) -> Result<Tracking, Unsupported> {
    #[cfg(windows)]
    let platform = Arc::new(win::Foreground::default());
    #[cfg(target_os = "macos")]
    let platform = Arc::new(mac::Foreground::default());
    Ok(Tracking {
        collector: Some(Collector::spawn(platform, usage, settings, clock, bus)),
    })
}

#[cfg(not(any(windows, target_os = "macos")))]
pub fn start(
    _usage: Arc<UsageService>,
    _settings: Arc<SettingsService>,
    _clock: Arc<dyn Clock>,
    _bus: &EventBus,
) -> Result<Tracking, Unsupported> {
    Err(Unsupported)
}

#[cfg(windows)]
pub(crate) mod win {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use std::sync::mpsc as std_mpsc;
    use std::sync::{Mutex, MutexGuard, PoisonError};
    use std::thread::JoinHandle;
    use std::time::Duration;

    use loaf_core::error::{AppError, Result};
    use loaf_core::usage_collector::Platform;
    use tokio::sync::mpsc::UnboundedSender;
    use windows_sys::Win32::Foundation::{CloseHandle, HWND};
    use windows_sys::Win32::System::SystemInformation::GetTickCount;
    use windows_sys::Win32::System::Threading::{
        GetCurrentThreadId, OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
        PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows_sys::Win32::UI::Accessibility::{SetWinEventHook, UnhookWinEvent, HWINEVENTHOOK};
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        DispatchMessageW, GetClassNameW, GetForegroundWindow, GetMessageW,
        GetWindowThreadProcessId, PeekMessageW, PostThreadMessageW, TranslateMessage,
        EVENT_SYSTEM_FOREGROUND, MSG, OBJID_WINDOW, PM_NOREMOVE, WINEVENT_OUTOFCONTEXT, WM_QUIT,
        WM_USER,
    };

    /// Where the hook callback (a plain function with no captures) sends what it sees.
    static SINK: Mutex<Option<UnboundedSender<Option<String>>>> = Mutex::new(None);

    fn lock<T>(m: &Mutex<T>) -> MutexGuard<'_, T> {
        m.lock().unwrap_or_else(PoisonError::into_inner)
    }

    struct HookThread {
        thread_id: u32,
        join: JoinHandle<()>,
    }

    #[derive(Default)]
    pub struct Foreground {
        thread: Mutex<Option<HookThread>>,
    }

    impl Platform for Foreground {
        fn start(&self, sink: UnboundedSender<Option<String>>) -> Result<()> {
            let mut slot = lock(&self.thread);
            if slot.is_some() {
                return Ok(());
            }
            *lock(&SINK) = Some(sink);
            let failed = || AppError::internal("Loaf couldn't watch which app is in front.");
            let (ready_tx, ready_rx) = std_mpsc::channel::<Option<u32>>();
            let join = std::thread::Builder::new()
                .name("loaf-winevent".into())
                .spawn(move || hook_thread(&ready_tx))
                .map_err(|_| {
                    *lock(&SINK) = None;
                    failed()
                })?;
            match ready_rx.recv_timeout(Duration::from_secs(2)) {
                Ok(Some(thread_id)) => {
                    *slot = Some(HookThread { thread_id, join });
                    Ok(())
                }
                _ => {
                    *lock(&SINK) = None;
                    Err(failed())
                }
            }
        }

        fn stop(&self) {
            let thread = lock(&self.thread).take();
            if let Some(thread) = thread {
                // SAFETY: plain FFI call; the id is that of a thread this module started. The
                // thread's message queue exists (it was forced before `start` returned), and
                // WM_QUIT ends its message loop.
                unsafe {
                    PostThreadMessageW(thread.thread_id, WM_QUIT, 0, 0);
                }
                let _ = thread.join.join();
            }
            *lock(&SINK) = None;
        }

        fn idle_ms(&self) -> Option<u64> {
            idle_ms()
        }
    }

    /// Milliseconds since the last keyboard or mouse input anywhere.
    pub(crate) fn idle_ms() -> Option<u64> {
        let mut info = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        // SAFETY: `info` is a valid LASTINPUTINFO with `cbSize` set, as the API requires.
        if unsafe { GetLastInputInfo(&mut info) } == 0 {
            return None;
        }
        // SAFETY: plain FFI call with no arguments. Both values are 32-bit tick counts that
        // wrap together, so the wrapping difference is right across the 49-day wrap.
        let now = unsafe { GetTickCount() };
        Some(u64::from(now.wrapping_sub(info.dwTime)))
    }

    /// Install the hook and pump messages until `WM_QUIT`. Sends the thread id once the hook is
    /// in place, or `None` if it could not be installed.
    fn hook_thread(ready: &std_mpsc::Sender<Option<u32>>) {
        // SAFETY: every call below is a plain FFI call on this thread with valid arguments. The
        // hook is installed out of context, so Windows delivers events to `on_foreground` on this
        // thread from inside `GetMessageW`, and it is removed before the thread ends.
        unsafe {
            let mut msg = MSG::default();
            // Looking at the queue creates it, so `PostThreadMessageW` can reach this thread.
            PeekMessageW(
                &mut msg,
                std::ptr::null_mut(),
                WM_USER,
                WM_USER,
                PM_NOREMOVE,
            );
            let hook = SetWinEventHook(
                EVENT_SYSTEM_FOREGROUND,
                EVENT_SYSTEM_FOREGROUND,
                std::ptr::null_mut(),
                Some(on_foreground),
                0,
                0,
                WINEVENT_OUTOFCONTEXT,
            );
            if hook.is_null() {
                let _ = ready.send(None);
                return;
            }
            let _ = ready.send(Some(GetCurrentThreadId()));
            // The hook reports changes only, so say what is in front right now.
            report(GetForegroundWindow());
            // Blocks until a message arrives: nothing runs while the foreground window is
            // unchanged. Returns 0 on WM_QUIT and -1 on error; both end the loop.
            while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }
            UnhookWinEvent(hook);
        }
    }

    /// Called by Windows on the hook thread. Must not panic or block.
    unsafe extern "system" fn on_foreground(
        _hook: HWINEVENTHOOK,
        event: u32,
        hwnd: HWND,
        id_object: i32,
        _id_child: i32,
        _event_thread: u32,
        _event_time: u32,
    ) {
        if event == EVENT_SYSTEM_FOREGROUND && id_object == OBJID_WINDOW {
            report(hwnd);
        }
    }

    fn report(hwnd: HWND) {
        // The desktop, taskbar and Alt+Tab belong to explorer.exe too: they record nothing.
        let app = executable_name(hwnd)
            .filter(|exe| !loaf_core::usage::is_shell_surface(exe, &class_name(hwnd)));
        if let Some(sink) = lock(&SINK).as_ref() {
            let _ = sink.send(app);
        }
    }

    /// The window's class name (e.g. `CabinetWClass` for a File Explorer folder window); empty if
    /// it can't be read.
    fn class_name(hwnd: HWND) -> String {
        let mut buf = [0u16; 256];
        // SAFETY: `buf` holds 256 UTF-16 units and the call writes at most that many; it returns
        // the number written (0 on failure).
        let len = unsafe { GetClassNameW(hwnd, buf.as_mut_ptr(), buf.len() as i32) };
        let len = usize::try_from(len).unwrap_or(0).min(buf.len());
        String::from_utf16_lossy(&buf[..len])
    }

    /// The file name (not the path) of the program that owns `hwnd`; `None` if there is no
    /// window or the process cannot be inspected (elevated or protected processes), in which
    /// case nothing is recorded for it.
    pub(crate) fn executable_name(hwnd: HWND) -> Option<String> {
        if hwnd.is_null() {
            return None;
        }
        let mut pid = 0u32;
        // SAFETY: `hwnd` came from the OS and `pid` is a valid out pointer.
        unsafe { GetWindowThreadProcessId(hwnd, &mut pid) };
        if pid == 0 {
            return None;
        }
        // SAFETY: plain FFI call. A null handle means access was denied or the process is gone.
        let process = unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid) };
        if process.is_null() {
            return None;
        }
        let mut buf = [0u16; 1024];
        let mut len = buf.len() as u32;
        // SAFETY: `buf` holds `len` UTF-16 units and `len` is updated to the number written.
        let ok = unsafe {
            QueryFullProcessImageNameW(process, PROCESS_NAME_WIN32, buf.as_mut_ptr(), &mut len)
        };
        // SAFETY: `process` is a handle we opened above and close exactly once.
        unsafe { CloseHandle(process) };
        let written = usize::try_from(len).ok()?.min(buf.len());
        if ok == 0 || written == 0 {
            return None;
        }
        let path = OsString::from_wide(&buf[..written])
            .to_string_lossy()
            .into_owned();
        path.rsplit(['\\', '/'])
            .next()
            .filter(|name| !name.is_empty())
            .map(str::to_owned)
    }
}

#[cfg(target_os = "macos")]
pub(crate) mod mac {
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::{Arc, Mutex, PoisonError};
    use std::thread::JoinHandle;
    use std::time::Duration;

    use loaf_core::error::{AppError, Result};
    use loaf_core::usage_collector::Platform;
    use objc2_app_kit::NSWorkspace;
    use tokio::sync::mpsc::UnboundedSender;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventSourceSecondsSinceLastEventType(state: i32, event_type: u32) -> f64;
    }
    const COMBINED_SESSION_STATE: i32 = 0;
    const ANY_INPUT_EVENT: u32 = !0;

    /// How often the app in front is looked at.
    const LOOK_EVERY: Duration = Duration::from_secs(1);

    /// The name of the app in front, as macOS shows it ("Google Chrome", "Code", "Finder").
    pub(crate) fn frontmost_app() -> Option<String> {
        let app = NSWorkspace::sharedWorkspace().frontmostApplication()?;
        let name = app.localizedName()?.to_string();
        (!name.trim().is_empty()).then_some(name)
    }

    struct Watcher {
        stop: Arc<AtomicBool>,
        join: JoinHandle<()>,
    }

    #[derive(Default)]
    pub struct Foreground {
        watcher: Mutex<Option<Watcher>>,
    }

    impl Platform for Foreground {
        fn start(&self, sink: UnboundedSender<Option<String>>) -> Result<()> {
            let mut slot = self.watcher.lock().unwrap_or_else(PoisonError::into_inner);
            if slot.is_some() {
                return Ok(());
            }
            let stop = Arc::new(AtomicBool::new(false));
            let flag = stop.clone();
            let join = std::thread::Builder::new()
                .name("loaf-frontmost".into())
                .spawn(move || {
                    let mut last: Option<Option<String>> = None;
                    while !flag.load(Ordering::Relaxed) {
                        let now = frontmost_app();
                        if last.as_ref() != Some(&now) {
                            if sink.send(now.clone()).is_err() {
                                return;
                            }
                            last = Some(now);
                        }
                        std::thread::sleep(LOOK_EVERY);
                    }
                })
                .map_err(|_| AppError::internal("Loaf couldn't watch which app is in front."))?;
            *slot = Some(Watcher { stop, join });
            Ok(())
        }

        fn stop(&self) {
            let watcher = self
                .watcher
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .take();
            if let Some(w) = watcher {
                w.stop.store(true, Ordering::Relaxed);
                let _ = w.join.join();
            }
        }

        fn idle_ms(&self) -> Option<u64> {
            idle_ms()
        }
    }

    /// Milliseconds since the last keyboard or mouse input anywhere.
    pub(crate) fn idle_ms() -> Option<u64> {
        // SAFETY: plain FFI call with constant arguments; it returns seconds as a double.
        let secs = unsafe {
            CGEventSourceSecondsSinceLastEventType(COMBINED_SESSION_STATE, ANY_INPUT_EVENT)
        };
        (secs.is_finite() && secs >= 0.0).then_some((secs * 1000.0) as u64)
    }
}
