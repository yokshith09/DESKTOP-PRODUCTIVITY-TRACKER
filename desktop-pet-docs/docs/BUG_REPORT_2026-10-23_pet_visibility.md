# Bug report — "the pet doesn't come back; I have to click Show on desktop again and again" (2026-10-23)

**Status: fixed in code 2026-10-23 (commit after owner OK), Unverified on Windows.** Fixes 1-6 below were implemented; S3/S4 remain to be checked on a real PC. Nobody has reproduced these on Windows yet; tags: [Likely] strong evidence in code · [Guessing] possible, needs a test on a real PC.

## Owner's report
Sometimes the pet does not start again by itself; turning "Show on desktop" on (sometimes repeatedly) brings it back.

## How the pet window works today (`src-tauri/src/pet.rs`, `lib.rs`)
- The pet is a separate transparent window, created hidden. `pet::start` calls `apply()` once at startup, then **only again when a setting changes** (`pet.visible`, `pet.size`, `pet.always_on_top`) or all data is deleted.
- `apply()` reads `pet.visible`, sets size, always-on-top and position, then `show()` or `hide()`. All window errors are ignored (`let _ = …`).
- The tray item "Show or hide pet", the pet menu "Hide pet", `Mod+Shift+P` and **closing the pet window** all **flip** the stored `pet.visible` value.

## Causes found

| # | Cause | Evidence | Effect | Confidence |
|---|---|---|---|---|
| B1 | **Closing the pet window turns the setting off, permanently.** `WindowEvent::CloseRequested` on the pet window flips `pet.visible` (lib.rs, `on_window_event`). Alt+F4 while the pet has focus, or the OS asking windows to close (sign-out/restart paths), does this. The value is saved, so **the next start keeps the pet hidden**. Two close events in a row flip it back on — so it looks random. | lib.rs `WindowEvent::CloseRequested { … } => pet::flip_setting(…, "pet.visible", true)` | Pet missing after restart; "Show on desktop" is off | [Likely] |
| B2 | **The window can vanish while the setting still says "on", and Pluto never notices.** `apply()` runs only at startup and on a setting change — never after sleep/resume, a monitor turning off or being unplugged, a DPI/scale change, Explorer restarting, or a full-screen app taking "topmost". If the window ends up hidden, behind, or off-screen, nothing re-applies. | `pet::start` loop handles only `SettingChanged` for 3 keys | "Show on desktop" is **on** but no pet. Clicking it turns it **off** (nothing visible changes), clicking again turns it **on** → `apply()` runs → pet back. **This matches "again and again".** | [Likely] |
| B3 | **A missed event is ignored.** The pet's bus listener drops `Recv::Resync` (sent when it falls behind) instead of re-applying. | `Recv::Event(_) \| Recv::Resync { .. } => {}` | Window and setting out of step after a burst of events | [Likely] (rare) |
| B4 | **"Show" actions toggle the stored value instead of showing.** Tray, menu and shortcut flip `pet.visible` based on the setting, not on whether the pet is actually on screen. When B1/B2 already put them out of step, the first click hides an already-invisible pet. | `flip_setting` | Needs two clicks | [Likely] |
| B5 | **Errors are silent.** `show()`, `set_position()`, `set_always_on_top()` failures are discarded without a log line. | `let _ = w.show()` … | Can't diagnose from the user's log file | [Certain] |
| B6 | Saved position on a display that's still connected but now has a different layout/scale may place the pet just off the visible area (the check only tests the top-left corner + 8 px). | `monitors.iter().any(|m| m.contains(x + 8, y + 8))` | Pet "missing" but actually off-screen | [Guessing] |

## Similar issues elsewhere in the app

| # | Where | Problem | Confidence |
|---|---|---|---|
| S1 | **Routine reminder and daily greeting** (`useRoutineReminder`, `useDailyGreeting`) run in the **dashboard** webview. While the dashboard is hidden in the tray, WebView2/WebKit may throttle or pause timers in hidden pages, and `focus`/`visibilitychange` don't fire for a hidden window. → reminders late, greeting only when the dashboard is opened. | [Likely] |
| S2 | **Global shortcut** `Mod+Shift+P` uses the same flip (B4). | [Likely] |
| S3 | **Dashboard window** position is restored by the window-state plugin; after a monitor change it may open off-screen ("Pluto won't open"). | [Guessing] |
| S4 | Typing/tracking hooks after sleep/resume have never been tested on a real PC. | [Guessing] |

## Proposed fixes (to do after owner review)
1. **B1:** closing the pet window only hides it for this session; never writes `pet.visible`. Only explicit "Hide pet" actions change the setting.
2. **B2/B3:** re-apply on `Resync`, on display/scale changes (`WindowEvent::ScaleFactorChanged`, monitor list change), on resume from sleep (Windows `WM_POWERBROADCAST` via a hidden message window, macOS `NSWorkspaceDidWakeNotification`), and when the dashboard is shown. Re-assert always-on-top at the same points.
3. **B4:** "Show pet" **sets** visible and re-applies; "Hide pet" sets hidden. Tray label shows the real state.
4. **B5:** log every failed window call with `tracing::warn!`.
5. **B6:** require the whole pet rectangle (or its centre) to be inside a work area; otherwise default spot. Add a tray item **"Bring the pet back"** (resets position and shows it).
6. **S1:** move the routine reminder and greeting schedule into the Rust core scheduler (it already runs reminders reliably) or into the always-present pet window; keep the dashboard only for the toast.
7. Tests: unit tests for the visibility state machine (B1-B4), position rule (B6); manual Windows checklist: sleep/resume, unplug monitor, Alt+F4 on pet, sign out/in, Explorer restart.
