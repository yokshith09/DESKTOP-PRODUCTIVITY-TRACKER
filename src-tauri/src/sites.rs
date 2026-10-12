//! Website time from the browser's address bar (`tracking.sites`, needs `tracking.apps` too).
//!
//! The decisions (what counts as a site, when a session starts and ends) live in
//! `loaf_core::sites` and are tested there. This file only supplies one look at the browser in
//! front, every [`LOOK_EVERY_MS`] while both switches are on:
//!
//! * **Windows**: UI Automation. The browser window in front is matched by its executable
//!   (Chrome, Edge, Brave, Firefox, …); its address bar is the first edit box in the window. The
//!   text is reduced to the host at once and the rest is dropped. Nothing is read while you are
//!   typing in the address bar. Private windows are skipped: Edge "InPrivate" and Firefox
//!   "Private Browsing" by their title, Chrome and Brave by their "Incognito"/"Private" toolbar
//!   button (English names only for now). A window that can't be classified is skipped too.
//! * **macOS / elsewhere**: not yet; nothing is recorded. (macOS needs the foreground-app
//!   collector first.)
//!
//! Polling is the exception to ADR-009 here: no OS event fires when the address bar changes.
//!
//! Unverified on a real Windows PC.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use loaf_core::bus::{EventBus, Recv};
use loaf_core::clock::Clock;
use loaf_core::events::Event;
use loaf_core::settings_service::SettingsService;
use loaf_core::sites::{Seen, SiteTracker, LOOK_EVERY_MS};
use loaf_core::usage::UsageService;
use tokio::sync::mpsc;

/// Whether the looking thread should look at all (both switches on).
static ACTIVE: AtomicBool = AtomicBool::new(false);

#[cfg_attr(not(windows), allow(dead_code))]
/// One look from the OS thread: what it saw and how long since the last input.
struct Look {
    seen: Seen,
    idle_ms: u64,
}

pub fn start(
    usage: Arc<UsageService>,
    settings: Arc<SettingsService>,
    clock: Arc<dyn Clock>,
    bus: &EventBus,
) {
    let (tx, mut looks) = mpsc::unbounded_channel::<Look>();
    if !os::spawn(tx) {
        return; // this platform can't read address bars yet
    }
    let mut events = bus.subscribe();
    tauri::async_runtime::spawn(async move {
        let wanted = |all: std::collections::BTreeMap<String, serde_json::Value>| {
            let on = |k: &str| all.get(k).and_then(serde_json::Value::as_bool) == Some(true);
            on("tracking.apps") && on("tracking.sites")
        };
        ACTIVE.store(
            wanted(settings.get_all().await.unwrap_or_default()),
            Ordering::Relaxed,
        );
        let mut tracker = SiteTracker::default();
        let save = |session: Option<loaf_core::usage::DomainSession>| {
            let usage = usage.clone();
            async move {
                if let Some(s) = session {
                    if let Err(error) = usage
                        .record_domain_session(&s.browser, &s.domain, s.started_at, s.ended_at)
                        .await
                    {
                        tracing::warn!(code = ?error.code, "couldn't save time on a website");
                    }
                }
            }
        };
        loop {
            tokio::select! {
                Some(look) = looks.recv() => {
                    if ACTIVE.load(Ordering::Relaxed) {
                        save(tracker.look(clock.now_ms(), look.idle_ms, look.seen)).await;
                    }
                }
                event = events.recv() => match event {
                    Recv::Event(Event::SettingChanged { key, .. }) if key.starts_with("tracking.") => {
                        let on = wanted(settings.get_all().await.unwrap_or_default());
                        ACTIVE.store(on, Ordering::Relaxed);
                        if !on {
                            save(tracker.stop(clock.now_ms())).await;
                        }
                    }
                    Recv::Event(Event::AppShuttingDown { .. }) => {
                        ACTIVE.store(false, Ordering::Relaxed);
                        save(tracker.stop(clock.now_ms())).await;
                    }
                    Recv::Event(Event::AllDataDeleted { .. }) | Recv::Resync { .. } => {
                        tracker = SiteTracker::default();
                        ACTIVE.store(wanted(settings.get_all().await.unwrap_or_default()), Ordering::Relaxed);
                    }
                    Recv::Event(_) => {}
                    Recv::Closed => break,
                },
            }
        }
    });
}

#[cfg_attr(not(windows), allow(dead_code))]
fn interval() -> Duration {
    Duration::from_millis(LOOK_EVERY_MS)
}

#[cfg(windows)]
mod os {
    use std::collections::HashMap;
    use std::sync::atomic::Ordering;

    use loaf_core::sites::{domain_from_address, Seen};
    use loaf_core::usage::{display_name, is_browser};
    use tokio::sync::mpsc::UnboundedSender;
    use windows::core::BSTR;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
    };
    use windows::Win32::System::Variant::VARIANT;
    use windows::Win32::UI::Accessibility::{
        CUIAutomation, IUIAutomation, IUIAutomationElement, IUIAutomationValuePattern,
        TreeScope_Descendants, UIA_ButtonControlTypeId, UIA_ControlTypePropertyId,
        UIA_EditControlTypeId, UIA_NamePropertyId, UIA_ValuePatternId,
    };
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

    use super::{Look, ACTIVE};

    /// What we know about one browser window: its address bar, and whether it is private.
    struct Window {
        address_bar: Option<IUIAutomationElement>,
        private: bool,
    }

    pub fn spawn(tx: UnboundedSender<Look>) -> bool {
        std::thread::Builder::new()
            .name("loaf-sites".into())
            .spawn(move || run(&tx))
            .is_ok()
    }

    fn run(tx: &UnboundedSender<Look>) {
        // SAFETY: plain COM initialisation for this thread, which owns every UIA object below.
        if unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) }.is_err() {
            tracing::warn!("couldn't start UI Automation; website time is off");
            return;
        }
        // SAFETY: creating the in-process UI Automation client, as documented.
        let uia: IUIAutomation =
            match unsafe { CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER) } {
                Ok(u) => u,
                Err(error) => {
                    tracing::warn!(%error, "couldn't start UI Automation; website time is off");
                    return;
                }
            };
        let mut windows: HashMap<isize, Window> = HashMap::new();
        loop {
            std::thread::sleep(super::interval());
            if !ACTIVE.load(Ordering::Relaxed) {
                windows.clear();
                continue;
            }
            let seen = look(&uia, &mut windows);
            let idle_ms = crate::tracking::win::idle_ms().unwrap_or(0);
            if tx.send(Look { seen, idle_ms }).is_err() {
                return;
            }
        }
    }

    fn look(uia: &IUIAutomation, windows: &mut HashMap<isize, Window>) -> Seen {
        // SAFETY: plain FFI call.
        let hwnd = unsafe { GetForegroundWindow() };
        if hwnd.is_invalid() {
            return Seen::NoBrowser;
        }
        let Some(exe) = crate::tracking::win::executable_name(hwnd.0) else {
            return Seen::NoBrowser;
        };
        if !is_browser(&exe) {
            return Seen::NoBrowser;
        }
        if windows.len() > 64 {
            windows.clear(); // closed windows; cheap to find again
        }
        let key = hwnd.0 as isize;
        let window = windows.entry(key).or_insert_with(|| inspect(uia, hwnd));
        if window.private || title_says_private(hwnd) {
            return Seen::Nothing;
        }
        let Some(bar) = &window.address_bar else {
            return Seen::Nothing;
        };
        // While you type in the address bar it holds your search, not the site: keep the last one.
        // SAFETY: COM call on the thread that created the element.
        if unsafe { bar.CurrentHasKeyboardFocus() }.is_ok_and(|f| f.as_bool()) {
            return Seen::Nothing;
        }
        // SAFETY: as above; the value pattern of an edit box is its text.
        let text = unsafe {
            bar.GetCurrentPatternAs::<IUIAutomationValuePattern>(UIA_ValuePatternId)
                .and_then(|p| p.CurrentValue())
        };
        let Ok(text) = text else {
            windows.remove(&key); // the element went stale (the window changed); find it again next time
            return Seen::Nothing;
        };
        match domain_from_address(&text.to_string()) {
            Some(domain) => Seen::Site {
                browser: display_name(&exe),
                domain,
            },
            None => Seen::Nothing,
        }
    }

    /// Find a window's address bar and whether it is a private window. Done once per window.
    fn inspect(uia: &IUIAutomation, hwnd: HWND) -> Window {
        let find = |control: i32, name: Option<&str>| -> Option<IUIAutomationElement> {
            // SAFETY: COM calls on this thread with valid arguments.
            unsafe {
                let root = uia.ElementFromHandle(hwnd).ok()?;
                let kind = uia
                    .CreatePropertyCondition(UIA_ControlTypePropertyId, &VARIANT::from(control))
                    .ok()?;
                let condition = match name {
                    Some(n) => {
                        let named = uia
                            .CreatePropertyCondition(
                                UIA_NamePropertyId,
                                &VARIANT::from(BSTR::from(n)),
                            )
                            .ok()?;
                        uia.CreateAndCondition(&kind, &named).ok()?
                    }
                    None => kind,
                };
                root.FindFirst(TreeScope_Descendants, &condition).ok()
            }
        };
        let private = ["Incognito", "Private"]
            .iter()
            .any(|n| find(UIA_ButtonControlTypeId.0, Some(n)).is_some());
        Window {
            address_bar: find(UIA_EditControlTypeId.0, None),
            private,
        }
    }

    /// Edge and Firefox name private windows in the title. The title is checked and dropped.
    fn title_says_private(hwnd: HWND) -> bool {
        let mut buf = [0u16; 512];
        // SAFETY: `buf` is writable for its length.
        let n = unsafe { GetWindowTextW(hwnd, &mut buf) };
        let title = String::from_utf16_lossy(&buf[..usize::try_from(n).unwrap_or(0)]);
        title.contains("InPrivate")
            || title.contains("Private Browsing")
            || title.contains("Incognito")
    }
}

#[cfg(not(windows))]
mod os {
    use tokio::sync::mpsc::UnboundedSender;

    pub fn spawn(_tx: UnboundedSender<super::Look>) -> bool {
        false
    }
}
