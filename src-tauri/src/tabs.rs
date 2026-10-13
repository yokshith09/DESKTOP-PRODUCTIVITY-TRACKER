//! Open tabs, read on request — no browser extension (owner decision 2026-10-13: "we will allow
//! users to give permissions to our pet and it does it all").
//!
//! This reuses the same permission as `tracking.sites` (both switches on): if the person hasn't
//! allowed Loaf to read their browser for site *time*, it won't read their open tabs either. The
//! list is never stored — it's read fresh each time the panel opens, like a task switcher, not
//! usage data.
//!
//! * **Windows**: UI Automation on the single browser window in front. Every tab's title comes
//!   from the tab strip, which is always rendered. The domain is only readable for the tab that
//!   is actually showing — a background tab's page isn't rendered, so there is nothing for UI
//!   Automation to read from it. Closing a tab invokes its own "Close" button in the tab strip
//!   (Chromium exposes one per tab for accessibility tools), found fresh each time — nothing is
//!   cached across calls.
//! * **macOS**: AppleScript, for the same Chrome-family browsers as `sites.rs`. Unlike Windows,
//!   the browser's own scripting dictionary lists every tab's URL directly, across every window,
//!   without switching to any of them — so every tab gets a domain, not just the active one.
//!   Incognito windows are skipped entirely, same rule as `sites.rs`. Safari and Firefox aren't
//!   scriptable this way and are skipped, same as `sites.rs`.
//! * Elsewhere: an empty list.
//!
//! Unverified on a real Windows or Mac PC.

use std::sync::Arc;

use loaf_core::error::Result;
use loaf_core::settings_service::SettingsService;
use loaf_core::sites::OpenTab;
use serde_json::Value;
use tauri::State;

/// Both switches on, the same gate `sites.rs` uses for the time it records.
async fn allowed(settings: &SettingsService) -> bool {
    let all = settings.get_all().await.unwrap_or_default();
    let on = |k: &str| all.get(k).and_then(Value::as_bool) == Some(true);
    on("tracking.apps") && on("tracking.sites")
}

/// Every open tab in the browser Loaf can currently read. Empty, not an error, while the
/// switches are off or on a platform with no reader.
#[tauri::command]
pub async fn pet_open_tabs(settings: State<'_, Arc<SettingsService>>) -> Result<Vec<OpenTab>> {
    if !allowed(&settings).await {
        return Ok(vec![]);
    }
    Ok(tauri::async_runtime::spawn_blocking(os::list)
        .await
        .unwrap_or_default())
}

/// Close one tab. `false` if it couldn't be found or closed (it may have changed since the list
/// was read) or the switches are off; never an error for that — the panel just re-reads the list.
#[tauri::command]
pub async fn pet_close_tab(
    browser: String,
    window_index: u32,
    tab_index: u32,
    settings: State<'_, Arc<SettingsService>>,
) -> Result<bool> {
    if !allowed(&settings).await {
        return Ok(false);
    }
    Ok(
        tauri::async_runtime::spawn_blocking(move || os::close(&browser, window_index, tab_index))
            .await
            .unwrap_or(false),
    )
}

#[cfg(windows)]
mod os {
    use loaf_core::sites::{domain_from_address, OpenTab};
    use loaf_core::usage::{display_name, is_browser};
    use windows::core::BSTR;
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
    };
    use windows::Win32::System::Variant::VARIANT;
    use windows::Win32::UI::Accessibility::{
        CUIAutomation, IUIAutomation, IUIAutomationElement, IUIAutomationInvokePattern,
        IUIAutomationSelectionItemPattern, TreeScope_Children, TreeScope_Descendants,
        UIA_ButtonControlTypeId, UIA_ControlTypePropertyId, UIA_InvokePatternId,
        UIA_NamePropertyId, UIA_SelectionItemPatternId, UIA_TabItemControlTypeId,
        UIA_ValuePatternId,
    };
    use windows::Win32::UI::Accessibility::{IUIAutomationValuePattern, UIA_EditControlTypeId};
    use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;

    /// A fresh, one-off UI Automation client. Never shared across calls: each call is its own
    /// COM thread by way of `spawn_blocking`.
    fn client() -> Option<IUIAutomation> {
        // SAFETY: plain COM initialisation, scoped to this blocking task's own thread.
        if unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) }.is_err() {
            return None;
        }
        // SAFETY: creating the in-process UI Automation client, as documented.
        unsafe { CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER) }.ok()
    }

    fn find_all(
        uia: &IUIAutomation,
        root: &IUIAutomationElement,
        control: i32,
    ) -> Vec<IUIAutomationElement> {
        // SAFETY: COM calls on this thread with valid arguments.
        unsafe {
            let Ok(kind) =
                uia.CreatePropertyCondition(UIA_ControlTypePropertyId, &VARIANT::from(control))
            else {
                return vec![];
            };
            let Ok(found) = root.FindAll(TreeScope_Descendants, &kind) else {
                return vec![];
            };
            let len = found.Length().unwrap_or(0);
            (0..len).filter_map(|i| found.GetElement(i).ok()).collect()
        }
    }

    fn find_child(
        uia: &IUIAutomation,
        root: &IUIAutomationElement,
        control: i32,
        name: Option<&str>,
    ) -> Option<IUIAutomationElement> {
        // SAFETY: COM calls on this thread with valid arguments.
        unsafe {
            let kind = uia
                .CreatePropertyCondition(UIA_ControlTypePropertyId, &VARIANT::from(control))
                .ok()?;
            let condition = match name {
                Some(n) => {
                    let named = uia
                        .CreatePropertyCondition(UIA_NamePropertyId, &VARIANT::from(BSTR::from(n)))
                        .ok()?;
                    uia.CreateAndCondition(&kind, &named).ok()?
                }
                None => kind,
            };
            root.FindFirst(TreeScope_Children, &condition).ok()
        }
    }

    fn tab_is_selected(tab: &IUIAutomationElement) -> bool {
        // SAFETY: COM call on this thread.
        unsafe {
            tab.GetCurrentPatternAs::<IUIAutomationSelectionItemPattern>(UIA_SelectionItemPatternId)
                .and_then(|p| p.CurrentIsSelected())
                .is_ok_and(|b| b.as_bool())
        }
    }

    fn active_tab_domain(bar: &IUIAutomationElement) -> Option<String> {
        // SAFETY: COM call on this thread; the value pattern of an edit box is its text.
        let text = unsafe {
            bar.GetCurrentPatternAs::<IUIAutomationValuePattern>(UIA_ValuePatternId)
                .and_then(|p| p.CurrentValue())
        };
        domain_from_address(&text.ok()?.to_string())
    }

    /// The browser window in front, and the UI Automation root for it. `None` if nothing
    /// trackable is in front.
    fn foreground_browser(uia: &IUIAutomation) -> Option<(IUIAutomationElement, String)> {
        // SAFETY: plain FFI call.
        let hwnd = unsafe { GetForegroundWindow() };
        if hwnd.is_invalid() {
            return None;
        }
        let exe = crate::tracking::win::executable_name(hwnd.0)?;
        if !is_browser(&exe) {
            return None;
        }
        // SAFETY: COM call on this thread with a handle from the OS.
        let root = unsafe { uia.ElementFromHandle(hwnd) }.ok()?;
        Some((root, display_name(&exe)))
    }

    pub fn list() -> Vec<OpenTab> {
        let Some(uia) = client() else { return vec![] };
        let Some((root, browser)) = foreground_browser(&uia) else {
            return vec![];
        };
        let bar = find_child(&uia, &root, UIA_EditControlTypeId.0, None);
        find_all(&uia, &root, UIA_TabItemControlTypeId.0)
            .into_iter()
            .enumerate()
            .map(|(i, tab)| {
                let active = tab_is_selected(&tab);
                // SAFETY: COM call on this thread.
                let title = unsafe { tab.CurrentName() }
                    .ok()
                    .map(|n| n.to_string())
                    .filter(|s| !s.is_empty());
                let domain = (active && bar.is_some())
                    .then(|| active_tab_domain(bar.as_ref().unwrap()))
                    .flatten();
                OpenTab {
                    browser: browser.clone(),
                    window_index: 0, // v1: the window in front only
                    tab_index: u32::try_from(i).unwrap_or(u32::MAX),
                    title,
                    domain,
                    active,
                }
            })
            .collect()
    }

    pub fn close(_browser: &str, window_index: u32, tab_index: u32) -> bool {
        if window_index != 0 {
            return false; // v1 only ever lists window 0
        }
        let Some(uia) = client() else { return false };
        let Some((root, _)) = foreground_browser(&uia) else {
            return false;
        };
        let Some(tab) = find_all(&uia, &root, UIA_TabItemControlTypeId.0)
            .into_iter()
            .nth(tab_index as usize)
        else {
            return false;
        };
        let Some(close_button) = find_child(&uia, &tab, UIA_ButtonControlTypeId.0, None) else {
            return false;
        };
        // SAFETY: COM call on this thread.
        unsafe {
            close_button
                .GetCurrentPatternAs::<IUIAutomationInvokePattern>(UIA_InvokePatternId)
                .and_then(|p| p.Invoke())
                .is_ok()
        }
    }
}

#[cfg(target_os = "macos")]
mod os {
    use std::process::Command;

    use loaf_core::sites::{domain_from_address, OpenTab};
    use loaf_core::usage::display_name;

    /// Same browsers as `sites.rs`: their scripting dictionary can list every tab directly.
    const ASKABLE: &[&str] = &[
        "Google Chrome",
        "Microsoft Edge",
        "Brave Browser",
        "Vivaldi",
    ];

    fn run(script: &str) -> Option<String> {
        let out = Command::new("/usr/bin/osascript")
            .args(["-e", script])
            .output()
            .ok()?;
        out.status
            .success()
            .then(|| String::from_utf8_lossy(&out.stdout).into_owned())
    }

    /// Tab-separated: `window<TAB>tab<TAB>active<TAB>url<TAB>title`, one line per tab, skipping
    /// private windows entirely.
    fn list_script(app: &str) -> String {
        format!(
            r#"tell application "{app}"
  set out to ""
  set wIndex to 0
  repeat with w in windows
    set wIndex to wIndex + 1
    if (mode of w) is "normal" then
      set activeIndex to active tab index of w
      set tIndex to 0
      repeat with t in tabs of w
        set tIndex to tIndex + 1
        set isActive to (tIndex = activeIndex) as string
        set out to out & wIndex & "\t" & tIndex & "\t" & isActive & "\t" & (URL of t) & "\t" & (title of t) & "\n"
      end repeat
    end if
  end repeat
  return out
end tell"#
        )
    }

    pub fn list() -> Vec<OpenTab> {
        let mut tabs = vec![];
        for app in ASKABLE {
            let Some(out) = run(&list_script(app)) else {
                continue;
            };
            for line in out.lines() {
                let mut f = line.splitn(5, '\t');
                let (Some(w), Some(t), Some(active), Some(url), title) =
                    (f.next(), f.next(), f.next(), f.next(), f.next())
                else {
                    continue;
                };
                let (Ok(window_index), Ok(tab_index)) = (w.parse::<u32>(), t.parse::<u32>()) else {
                    continue;
                };
                tabs.push(OpenTab {
                    browser: display_name(app),
                    window_index: window_index.saturating_sub(1),
                    tab_index: tab_index.saturating_sub(1),
                    title: title.map(str::to_owned).filter(|s| !s.is_empty()),
                    domain: domain_from_address(url),
                    active: active == "true",
                });
            }
        }
        tabs
    }

    pub fn close(browser: &str, window_index: u32, tab_index: u32) -> bool {
        let Some(app) = ASKABLE.iter().find(|a| display_name(a) == browser) else {
            return false;
        };
        let script = format!(
            r#"tell application "{app}" to close tab {t} of window {w}"#,
            w = window_index + 1,
            t = tab_index + 1,
        );
        run(&script).is_some()
    }
}

#[cfg(not(any(windows, target_os = "macos")))]
mod os {
    use loaf_core::sites::OpenTab;

    pub fn list() -> Vec<OpenTab> {
        vec![]
    }

    pub fn close(_browser: &str, _window_index: u32, _tab_index: u32) -> bool {
        false
    }
}
