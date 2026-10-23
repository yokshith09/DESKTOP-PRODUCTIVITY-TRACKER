//! The desktop pet (F1-22): a small transparent, always-on-top window with Loaf the bear.
//!
//! * **Click** opens the dashboard, **double-click** hides it, **right-click** opens a menu,
//!   **drag** moves the pet. Hovering grows the window to show a summary card beside the pet;
//!   the pet itself never moves on screen while the card is open.
//! * The pet's place is remembered (`pet.position` preference, physical pixels) and checked
//!   against the connected displays at startup: a pet on a display that is gone comes back to
//!   the bottom-right of the main display (R1-61).
//! * `pet.visible` and `pet.size` are settings; changing them from Settings, the tray, the menu
//!   or `Mod+Shift+P` applies at once.
//!
//! Event-driven: one task parked on the bus, plus a one-shot delayed save after a drag.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, PoisonError};
use std::time::Duration;

use loaf_core::bus::{EventBus, Recv};
use loaf_core::error::{AppError, Result};
use loaf_core::events::Event;
use loaf_core::settings_service::SettingsService;
use serde::Serialize;
use serde_json::{json, Value};
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, Runtime, State, WebviewWindow,
};

pub const LABEL: &str = "pet";
const POSITION_PREF: &str = "pet.position";
/// Space between the pet and the edge of the screen when it is placed by default.
const MARGIN: i32 = 24;
/// Space between the pet and its card.
const GAP: u32 = 8;

/// A rectangle in physical pixels.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub w: u32,
    pub h: u32,
}

impl Rect {
    fn contains(&self, x: i32, y: i32) -> bool {
        x >= self.x && y >= self.y && x < self.x + self.w as i32 && y < self.y + self.h as i32
    }
}

/// Where the pet sits inside the grown window, so the page can lay the card out around it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct Anchor {
    /// `"right"`: the pet is at the right edge and the card extends to the left.
    pub pet: &'static str,
    /// `"above"` or `"below"` the pet.
    pub card: &'static str,
}

/// The window grown to hold the card next to the pet, kept inside the work area. The pet's
/// own square stays exactly where it was.
pub fn expanded(pet: Rect, card_w: u32, card_h: u32, work: Rect) -> (Rect, Anchor) {
    let w = pet.w.max(card_w);
    let h = pet.h + GAP + card_h;
    // Above when it fits there; else below when it fits; else whichever side has more room, so
    // on a short screen the card is cut as little as possible (FR-43). Same for left/right.
    let (room_above, room_below) = (
        pet.y - work.y,
        work.y + work.h as i32 - (pet.y + pet.h as i32),
    );
    let need_v = (card_h + GAP) as i32;
    let above = room_above >= need_v || (room_below < need_v && room_above >= room_below);
    let (room_left, room_right) = (
        pet.x + pet.w as i32 - work.x,
        work.x + work.w as i32 - pet.x,
    );
    let leftwards = room_left >= w as i32 || (room_right < w as i32 && room_left >= room_right);
    let x = if leftwards {
        pet.x + pet.w as i32 - w as i32
    } else {
        pet.x
    };
    let y = if above {
        pet.y - (card_h + GAP) as i32
    } else {
        pet.y
    };
    (
        Rect { x, y, w, h },
        Anchor {
            pet: if leftwards { "right" } else { "left" },
            card: if above { "above" } else { "below" },
        },
    )
}

/// Where the pet's square is now, if the grown window (set at `grown`) was dragged to `(x, y)`.
/// The pet keeps its place inside the grown window, so it moved by the same amount.
pub fn follow(base: Rect, grown: Rect, x: i32, y: i32) -> Rect {
    Rect {
        x: base.x + (x - grown.x),
        y: base.y + (y - grown.y),
        ..base
    }
}

/// Bottom-right of the work area.
pub fn default_spot(size: u32, work: Rect) -> (i32, i32) {
    (
        work.x + work.w as i32 - size as i32 - MARGIN,
        work.y + work.h as i32 - size as i32 - MARGIN,
    )
}

/// Pet edge length in logical pixels for `pet.size`.
/// A saved spot is used only if the pet's **centre** lands inside a connected screen's work
/// area; checking one corner let a pet end up mostly off-screen after a layout change (B6).
pub fn spot_fits(spot: (i32, i32), size: u32, monitors: &[Rect]) -> bool {
    let half = (size / 2) as i32;
    monitors
        .iter()
        .any(|m| m.contains(spot.0 + half, spot.1 + half))
}

/// "Show or hide pet" (tray, shortcut): decided by what is **on screen**, not the stored
/// setting, so one press always does the visible thing even when they disagree (B4).
pub fn toggle_target(window_visible: bool) -> bool {
    !window_visible
}

/// The wake watcher's tick and the gap that means the computer slept in between (B2/S1).
pub const WAKE_TICK: Duration = Duration::from_secs(60);
pub fn slept(expected: Duration, elapsed_wall: Duration) -> bool {
    elapsed_wall > expected + Duration::from_secs(60)
}

pub fn logical_size(setting: &str) -> f64 {
    match setting {
        "S" => 96.0,
        "L" => 160.0,
        _ => 128.0,
    }
}

#[derive(Default)]
pub struct PetState {
    expanded: AtomicBool,
    /// The pet's own square, while the window is grown.
    base: Mutex<Option<Rect>>,
    /// The grown window as it was set, to tell whether it was dragged since.
    grown: Mutex<Option<Rect>>,
    save_pending: AtomicBool,
}

fn lock<T>(m: &Mutex<T>) -> std::sync::MutexGuard<'_, T> {
    m.lock().unwrap_or_else(PoisonError::into_inner)
}

fn internal(_: tauri::Error) -> AppError {
    AppError::internal("The pet window couldn't do that.")
}

fn window<R: Runtime>(app: &AppHandle<R>) -> Option<WebviewWindow<R>> {
    app.get_webview_window(LABEL)
}

fn outer_rect<R: Runtime>(w: &WebviewWindow<R>) -> tauri::Result<Rect> {
    let p = w.outer_position()?;
    let s = w.outer_size()?;
    Ok(Rect {
        x: p.x,
        y: p.y,
        w: s.width,
        h: s.height,
    })
}

fn work_area<R: Runtime>(w: &WebviewWindow<R>) -> Option<Rect> {
    let m = w.current_monitor().ok().flatten()?;
    let a = m.work_area();
    Some(Rect {
        x: a.position.x,
        y: a.position.y,
        w: a.size.width,
        h: a.size.height,
    })
}

// ---- commands ------------------------------------------------------------------------------

/// Grow the window to show the card (`expanded: true`) or shrink it back. Returns where the pet
/// sits in the grown window. Card size is in logical pixels.
#[tauri::command]
pub async fn pet_hover(
    expanded: bool,
    card_width: f64,
    card_height: f64,
    app: AppHandle,
    state: State<'_, Arc<PetState>>,
) -> Result<Option<Anchor>> {
    let Some(w) = window(&app) else {
        return Ok(None);
    };
    if expanded {
        let pet = match current_base(&w, &state) {
            Some(base) if state.expanded.load(Ordering::SeqCst) => base,
            _ => outer_rect(&w).map_err(internal)?,
        };
        let scale = w.scale_factor().map_err(internal)?;
        let work = work_area(&w).unwrap_or(pet);
        let (rect, anchor) = expanded_rect(pet, card_width, card_height, scale, work);
        *lock(&state.base) = Some(pet);
        *lock(&state.grown) = Some(rect);
        state.expanded.store(true, Ordering::SeqCst);
        w.set_size(PhysicalSize::new(rect.w, rect.h))
            .map_err(internal)?;
        w.set_position(PhysicalPosition::new(rect.x, rect.y))
            .map_err(internal)?;
        Ok(Some(anchor))
    } else {
        if state.expanded.load(Ordering::SeqCst) {
            if let Some(base) = current_base(&w, &state) {
                let dragged = *lock(&state.base) != Some(base);
                w.set_size(PhysicalSize::new(base.w, base.h))
                    .map_err(internal)?;
                w.set_position(PhysicalPosition::new(base.x, base.y))
                    .map_err(internal)?;
                // The pet was dragged while its card was open: remember the new spot.
                if dragged {
                    if let Some(settings) = app.try_state::<Arc<SettingsService>>() {
                        let _ = settings
                            .set_pref(POSITION_PREF, json!({ "x": base.x, "y": base.y }))
                            .await;
                    }
                }
            }
            // Let the move events from shrinking pass before moves count as drags again.
            tokio::time::sleep(Duration::from_millis(150)).await;
            state.expanded.store(false, Ordering::SeqCst);
        }
        Ok(None)
    }
}

/// The pet's square while the window is grown, following any drag of the grown window.
fn current_base<R: Runtime>(w: &WebviewWindow<R>, state: &PetState) -> Option<Rect> {
    let base = (*lock(&state.base))?;
    match (*lock(&state.grown), w.outer_position()) {
        (Some(grown), Ok(p)) => Some(follow(base, grown, p.x, p.y)),
        _ => Some(base),
    }
}

fn expanded_rect(pet: Rect, card_w: f64, card_h: f64, scale: f64, work: Rect) -> (Rect, Anchor) {
    expanded(
        pet,
        (card_w * scale).round() as u32,
        (card_h * scale).round() as u32,
        work,
    )
}

/// Single click: open the dashboard.
#[tauri::command]
pub fn pet_click(app: AppHandle) {
    crate::tray::show_main(&app);
}

/// A button on the hover card: open the dashboard and do one thing there (FR-111). Only the
/// commands the pet menu already sends are accepted.
#[tauri::command]
pub fn pet_command(what: String, app: AppHandle) {
    if matches!(what.as_str(), "new-note" | "new-task") {
        command(&app, &what);
    }
}

/// Double click: put the dashboard away.
#[tauri::command]
pub fn pet_double_click(app: AppHandle) {
    hide_main(&app);
}

pub fn hide_main<R: Runtime>(app: &AppHandle<R>) {
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.hide();
    }
}

/// Right click: the pet's menu, at the cursor.
#[tauri::command]
pub async fn pet_menu(app: AppHandle, settings: State<'_, Arc<SettingsService>>) -> Result<()> {
    let tracking = settings
        .get_all()
        .await?
        .get("tracking.apps")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let main_visible = app
        .get_webview_window("main")
        .and_then(|m| m.is_visible().ok())
        .unwrap_or(false);
    let Some(w) = window(&app) else { return Ok(()) };
    let menu = build_menu(&app, main_visible, tracking).map_err(internal)?;
    w.popup_menu(&menu).map_err(internal)
}

fn build_menu<R: Runtime>(
    app: &AppHandle<R>,
    main_visible: bool,
    tracking: bool,
) -> tauri::Result<Menu<R>> {
    let (open_id, open_label) = if main_visible {
        ("pet:hide-main", "Hide Loaf")
    } else {
        ("pet:open", "Open Loaf")
    };
    let mod_key = if cfg!(target_os = "macos") {
        "Cmd"
    } else {
        "Ctrl"
    };
    let menu = Menu::new(app)?;
    menu.append(&MenuItem::with_id(
        app,
        open_id,
        open_label,
        true,
        Some(format!("{mod_key}+Shift+L")),
    )?)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&MenuItem::with_id(
        app,
        "pet:new-note",
        "New note",
        true,
        Some(format!("{mod_key}+Shift+N")),
    )?)?;
    menu.append(&MenuItem::with_id(
        app,
        "pet:new-task",
        "New task",
        true,
        None::<&str>,
    )?)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&CheckMenuItem::with_id(
        app,
        "pet:tracking",
        "Track app time",
        true,
        tracking,
        None::<&str>,
    )?)?;
    menu.append(&MenuItem::with_id(
        app,
        "pet:settings",
        "Settings…",
        true,
        None::<&str>,
    )?)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&MenuItem::with_id(
        app,
        "pet:hide-pet",
        "Hide pet",
        true,
        Some(format!("{mod_key}+Shift+P")),
    )?)?;
    menu.append(&MenuItem::with_id(
        app,
        "pet:quit",
        "Quit Loaf",
        true,
        None::<&str>,
    )?)?;
    Ok(menu)
}

/// Menu clicks from the pet menu and the tray's "Show or hide pet".
pub fn on_menu(app: &AppHandle, id: &str) {
    match id {
        "pet:open" => crate::tray::show_main(app),
        "pet:hide-main" => hide_main(app),
        "pet:new-note" => command(app, "new-note"),
        "pet:new-task" => command(app, "new-task"),
        "pet:settings" => command(app, "settings"),
        "pet:tracking" => flip_setting(app, "tracking.apps", false),
        "pet:hide-pet" => set_visible(app, false),
        crate::tray::ID_PET => toggle_pet(app),
        crate::tray::ID_PET_BACK => bring_back(app),
        "pet:quit" => crate::quit(app),
        _ => {}
    }
}

/// Bring the dashboard up and ask it to do something (`new-note`, `new-task`, `settings`).
pub fn command<R: Runtime>(app: &AppHandle<R>, what: &str) {
    crate::tray::show_main(app);
    let _ = app.emit_to("main", "loaf://command", what);
}

/// Set `pet.visible` and apply it now, even if the stored value was already that (the window
/// may have disappeared while the setting still said "on": B2/B4).
pub fn set_visible<R: Runtime>(app: &AppHandle<R>, visible: bool) {
    let Some(settings) = app
        .try_state::<Arc<SettingsService>>()
        .map(|s| Arc::clone(&s))
    else {
        return;
    };
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(error) = settings.set("pet.visible", json!(visible)).await {
            tracing::warn!(code = ?error.code, "couldn't change pet.visible");
        }
        apply(&app, &settings, false).await;
    });
}

/// Re-place the pet with the current settings (display changes).
pub fn reapply<R: Runtime>(app: &AppHandle<R>) {
    let Some(settings) = app
        .try_state::<Arc<SettingsService>>()
        .map(|s| Arc::clone(&s))
    else {
        return;
    };
    let app = app.clone();
    tauri::async_runtime::spawn(async move { apply(&app, &settings, false).await });
}

/// "Show or hide pet": the opposite of what is on screen right now (B4).
pub fn toggle_pet<R: Runtime>(app: &AppHandle<R>) {
    let on_screen = window(app)
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false);
    set_visible(app, toggle_target(on_screen));
}

/// "Bring the pet back": forget the saved spot, show it at the default place (B6).
pub fn bring_back<R: Runtime>(app: &AppHandle<R>) {
    let Some(settings) = app
        .try_state::<Arc<SettingsService>>()
        .map(|s| Arc::clone(&s))
    else {
        return;
    };
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let _ = settings.set_pref(POSITION_PREF, Value::Null).await;
        if let Err(error) = settings.set("pet.visible", json!(true)).await {
            tracing::warn!(code = ?error.code, "couldn't show the pet");
        }
        apply(&app, &settings, true).await;
    });
}

/// Flip a boolean setting; the bus listener applies it.
pub fn flip_setting<R: Runtime>(app: &AppHandle<R>, key: &'static str, default: bool) {
    let Some(settings) = app
        .try_state::<Arc<SettingsService>>()
        .map(|s| Arc::clone(&s))
    else {
        return;
    };
    tauri::async_runtime::spawn(async move {
        let current = settings
            .get_all()
            .await
            .ok()
            .and_then(|all| all.get(key).and_then(Value::as_bool))
            .unwrap_or(default);
        if let Err(error) = settings.set(key, json!(!current)).await {
            tracing::warn!(code = ?error.code, key, "couldn't change a setting from the pet");
        }
    });
}

// ---- placement, visibility, saving ---------------------------------------------------------

/// A drag ended somewhere: remember it (debounced, so a drag is one write).
pub fn on_moved<R: Runtime>(app: &AppHandle<R>, x: i32, y: i32) {
    let Some(state) = app.try_state::<Arc<PetState>>().map(|s| Arc::clone(&s)) else {
        return;
    };
    if state.expanded.load(Ordering::SeqCst) {
        return; // the window is grown for the card; the pet hasn't moved
    }
    *lock(&state.base) = None;
    if state.save_pending.swap(true, Ordering::SeqCst) {
        return;
    }
    let (Some(settings), Some(w)) = (
        app.try_state::<Arc<SettingsService>>()
            .map(|s| Arc::clone(&s)),
        window(app),
    ) else {
        state.save_pending.store(false, Ordering::SeqCst);
        return;
    };
    let _ = (x, y);
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_millis(600)).await;
        state.save_pending.store(false, Ordering::SeqCst);
        if state.expanded.load(Ordering::SeqCst) {
            return;
        }
        if let Ok(p) = w.outer_position() {
            let _ = settings
                .set_pref(POSITION_PREF, json!({ "x": p.x, "y": p.y }))
                .await;
        }
    });
}

async fn apply<R: Runtime>(app: &AppHandle<R>, settings: &SettingsService, reset_position: bool) {
    let Some(w) = window(app) else { return };
    let all = settings.get_all().await.unwrap_or_default();
    let visible = all
        .get("pet.visible")
        .and_then(Value::as_bool)
        .unwrap_or(true);
    let size_name = all
        .get("pet.size")
        .and_then(Value::as_str)
        .unwrap_or("M")
        .to_owned();
    let scale = w.scale_factor().unwrap_or(1.0);
    let size = (logical_size(&size_name) * scale).round() as u32;
    warn_on("set_size", w.set_size(PhysicalSize::new(size, size)));
    // Character › "Always on top" (on by default).
    let on_top = all
        .get("pet.always_on_top")
        .and_then(Value::as_bool)
        .unwrap_or(true);
    warn_on("set_always_on_top", w.set_always_on_top(on_top));

    let saved = if reset_position {
        None
    } else {
        settings.get_pref(POSITION_PREF).await.ok().flatten()
    };
    let monitors: Vec<Rect> = w
        .available_monitors()
        .unwrap_or_default()
        .iter()
        .map(|m| {
            let a = m.work_area();
            Rect {
                x: a.position.x,
                y: a.position.y,
                w: a.size.width,
                h: a.size.height,
            }
        })
        .collect();
    let spot = saved
        .and_then(|v| Some((v.get("x")?.as_i64()? as i32, v.get("y")?.as_i64()? as i32)))
        .filter(|&(x, y)| spot_fits((x, y), size, &monitors));
    let spot = spot.or_else(|| {
        let primary = w.primary_monitor().ok().flatten()?;
        let a = primary.work_area();
        Some(default_spot(
            size,
            Rect {
                x: a.position.x,
                y: a.position.y,
                w: a.size.width,
                h: a.size.height,
            },
        ))
    });
    if let Some((x, y)) = spot {
        warn_on("set_position", w.set_position(PhysicalPosition::new(x, y)));
    }
    warn_on(
        if visible { "show" } else { "hide" },
        if visible { w.show() } else { w.hide() },
    );
}

/// Window calls used to fail silently, which made "the pet is gone" impossible to diagnose (B5).
fn warn_on(what: &str, result: tauri::Result<()>) {
    if let Err(error) = result {
        tracing::warn!(%error, what, "pet window call failed");
    }
}

/// The screens' work areas, to notice a monitor being added, removed or rearranged.
fn monitor_layout<R: Runtime>(app: &AppHandle<R>) -> Vec<Rect> {
    window(app)
        .and_then(|w| w.available_monitors().ok())
        .unwrap_or_default()
        .iter()
        .map(|m| {
            let a = m.work_area();
            Rect {
                x: a.position.x,
                y: a.position.y,
                w: a.size.width,
                h: a.size.height,
            }
        })
        .collect()
}

/// Place and show the pet now, and follow the pet settings from here on. Also watches for the
/// computer waking up and for screens changing (B2/S1): the OS gives no portable event for
/// either, so one look a minute (an exception to ADR-009, like `sites.rs`) re-applies the pet
/// and tells every window `loaf://wake` so reminders and the greeting can catch up.
pub fn start<R: Runtime>(app: AppHandle<R>, settings: Arc<SettingsService>, bus: &EventBus) {
    {
        let (app, settings) = (app.clone(), Arc::clone(&settings));
        tauri::async_runtime::spawn(async move {
            let mut layout = monitor_layout(&app);
            loop {
                let before = std::time::SystemTime::now();
                tokio::time::sleep(WAKE_TICK).await;
                let wall = before.elapsed().unwrap_or_default();
                let now_layout = monitor_layout(&app);
                let woke = slept(WAKE_TICK, wall);
                if woke || now_layout != layout {
                    tracing::info!(
                        woke,
                        screens_changed = now_layout != layout,
                        "re-applying the pet"
                    );
                    layout = now_layout;
                    apply(&app, &settings, false).await;
                    if woke {
                        let _ = app.emit("loaf://wake", ());
                    }
                }
            }
        });
    }
    let mut events = bus.subscribe();
    tauri::async_runtime::spawn(async move {
        apply(&app, &settings, false).await;
        loop {
            match events.recv().await {
                Recv::Event(Event::SettingChanged { key, .. })
                    if key == "pet.visible" || key == "pet.size" || key == "pet.always_on_top" =>
                {
                    apply(&app, &settings, false).await;
                }
                Recv::Event(Event::AllDataDeleted { .. }) => apply(&app, &settings, true).await,
                // Fell behind on events: one may have been a pet setting (B3).
                Recv::Resync { .. } => apply(&app, &settings, false).await,
                Recv::Event(_) => {}
                Recv::Closed => break,
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    const WORK: Rect = Rect {
        x: 0,
        y: 0,
        w: 1920,
        h: 1040,
    };

    #[test]
    fn the_card_opens_up_and_left_when_the_pet_is_bottom_right() {
        let pet = Rect {
            x: 1768,
            y: 888,
            w: 128,
            h: 128,
        };
        let (r, a) = expanded(pet, 300, 170, WORK);
        assert_eq!(
            a,
            Anchor {
                pet: "right",
                card: "above"
            }
        );
        assert_eq!(
            r,
            Rect {
                x: 1768 + 128 - 300,
                y: 888 - 178,
                w: 300,
                h: 128 + 8 + 170
            }
        );
        // The pet's own square is where it was: bottom-right corner of the grown window.
        assert_eq!(
            (r.x + r.w as i32 - 128, r.y + r.h as i32 - 128),
            (pet.x, pet.y)
        );
    }

    #[test]
    fn the_card_flips_down_and_right_near_the_top_left_corner() {
        let pet = Rect {
            x: 10,
            y: 10,
            w: 128,
            h: 128,
        };
        let (r, a) = expanded(pet, 300, 170, WORK);
        assert_eq!(
            a,
            Anchor {
                pet: "left",
                card: "below"
            }
        );
        assert_eq!(
            (r.x, r.y),
            (10, 10),
            "the pet stays put at the top-left of the window"
        );
    }

    #[test]
    fn when_the_card_fits_neither_way_it_takes_the_side_with_more_room() {
        let short = Rect {
            x: 0,
            y: 0,
            w: 1280,
            h: 500,
        };
        // Pet a little below the middle of a short screen: 300 px above, 72 below, card 352.
        let pet = Rect {
            x: 600,
            y: 300,
            w: 128,
            h: 128,
        };
        let (r, a) = expanded(pet, 300, 352, short);
        assert_eq!(a.card, "above");
        assert_eq!(r.y + r.h as i32 - 128, pet.y, "the pet stays put");
        // Near the top instead: more room below.
        let pet = Rect { y: 60, ..pet };
        assert_eq!(expanded(pet, 300, 352, short).1.card, "below");
        // Narrow screen, pet in the middle: the wider side wins.
        let narrow = Rect {
            x: 0,
            y: 0,
            w: 400,
            h: 1040,
        };
        let pet = Rect {
            x: 230,
            y: 800,
            w: 128,
            h: 128,
        };
        assert_eq!(
            expanded(pet, 380, 100, narrow).1.pet,
            "right",
            "358 px to the left beats 170 to the right"
        );
    }

    #[test]
    fn a_card_narrower_than_the_pet_does_not_shrink_the_window() {
        let pet = Rect {
            x: 800,
            y: 600,
            w: 160,
            h: 160,
        };
        let (r, _) = expanded(pet, 100, 50, WORK);
        assert_eq!(r.w, 160);
    }

    #[test]
    fn a_dragged_grown_window_carries_the_pet_with_it() {
        let base = Rect {
            x: 1000,
            y: 800,
            w: 128,
            h: 128,
        };
        let grown = Rect {
            x: 828,
            y: 500,
            w: 300,
            h: 428,
        };
        assert_eq!(follow(base, grown, 828, 500), base);
        assert_eq!(
            follow(base, grown, 700, 450),
            Rect {
                x: 872,
                y: 750,
                w: 128,
                h: 128
            }
        );
    }

    #[test]
    fn default_spot_is_bottom_right_with_a_margin() {
        assert_eq!(default_spot(128, WORK), (1920 - 128 - 24, 1040 - 128 - 24));
        let second = Rect {
            x: 1920,
            y: 0,
            w: 1280,
            h: 1000,
        };
        assert_eq!(
            default_spot(96, second),
            (1920 + 1280 - 96 - 24, 1000 - 96 - 24)
        );
    }

    #[test]
    fn sizes_follow_the_setting_with_medium_as_the_fallback() {
        assert_eq!(logical_size("S"), 96.0);
        assert_eq!(logical_size("M"), 128.0);
        assert_eq!(logical_size("L"), 160.0);
        assert_eq!(logical_size("XL"), 128.0);
    }

    #[test]
    fn rect_contains_is_half_open() {
        assert!(WORK.contains(0, 0));
        assert!(!WORK.contains(1920, 0));
        assert!(!WORK.contains(-1, 5));
    }

    #[test]
    fn a_saved_spot_needs_the_pets_centre_on_a_screen() {
        let screen = [Rect {
            x: 0,
            y: 0,
            w: 1920,
            h: 1040,
        }];
        assert!(spot_fits((1700, 900), 128, &screen));
        // Top-left corner on screen but most of the pet hanging off the right edge.
        assert!(!spot_fits((1900, 500), 128, &screen));
        assert!(!spot_fits((-500, 0), 128, &[]));
    }

    #[test]
    fn show_or_hide_follows_what_is_on_screen() {
        assert!(toggle_target(false)); // invisible (even if the setting says on) -> show
        assert!(!toggle_target(true));
    }

    #[test]
    fn a_long_gap_between_ticks_means_the_computer_slept() {
        assert!(!slept(WAKE_TICK, Duration::from_secs(61)));
        assert!(!slept(WAKE_TICK, Duration::from_secs(119)));
        assert!(slept(WAKE_TICK, Duration::from_secs(600)));
    }
}
