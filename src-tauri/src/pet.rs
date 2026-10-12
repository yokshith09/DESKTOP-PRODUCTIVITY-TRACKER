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
    let above = pet.y - (card_h + GAP) as i32 >= work.y;
    let leftwards = pet.x + pet.w as i32 - w as i32 >= work.x;
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
        "pet:hide-pet" | crate::tray::ID_PET => flip_setting(app, "pet.visible", true),
        "pet:quit" => crate::quit(app),
        _ => {}
    }
}

/// Bring the dashboard up and ask it to do something (`new-note`, `new-task`, `settings`).
pub fn command<R: Runtime>(app: &AppHandle<R>, what: &str) {
    crate::tray::show_main(app);
    let _ = app.emit_to("main", "loaf://command", what);
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
    let _ = w.set_size(PhysicalSize::new(size, size));

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
        .filter(|(x, y)| monitors.iter().any(|m| m.contains(x + 8, y + 8)));
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
        let _ = w.set_position(PhysicalPosition::new(x, y));
    }
    let _ = if visible { w.show() } else { w.hide() };
}

/// Place and show the pet now, and follow the pet settings from here on.
pub fn start<R: Runtime>(app: AppHandle<R>, settings: Arc<SettingsService>, bus: &EventBus) {
    let mut events = bus.subscribe();
    tauri::async_runtime::spawn(async move {
        apply(&app, &settings, false).await;
        loop {
            match events.recv().await {
                Recv::Event(Event::SettingChanged { key, .. })
                    if key == "pet.visible" || key == "pet.size" =>
                {
                    apply(&app, &settings, false).await;
                }
                Recv::Event(Event::AllDataDeleted { .. }) => apply(&app, &settings, true).await,
                Recv::Event(_) | Recv::Resync { .. } => {}
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
}
