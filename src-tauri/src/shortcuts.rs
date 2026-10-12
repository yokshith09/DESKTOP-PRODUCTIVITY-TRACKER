//! System-wide keyboard shortcuts (UI brief §8). They work while Loaf is in the tray or behind
//! other windows. A shortcut another app already owns is skipped with a warning in the log; the
//! rest still work.

use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// What a shortcut does.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Action {
    TogglePet,
    ToggleDashboard,
    NewNote,
}

/// `Mod+Shift+<key>` for each action. `Mod` is Cmd on macOS, Ctrl elsewhere.
/// `Mod+Shift+T` (new task) was removed by the owner on 2026-10-12: no quick-add from other apps.
pub const KEYS: [(Code, Action); 3] = [
    (Code::KeyP, Action::TogglePet),
    (Code::KeyL, Action::ToggleDashboard),
    (Code::KeyN, Action::NewNote),
];

fn modifiers() -> Modifiers {
    if cfg!(target_os = "macos") {
        Modifiers::SUPER | Modifiers::SHIFT
    } else {
        Modifiers::CONTROL | Modifiers::SHIFT
    }
}

fn run<R: Runtime>(app: &AppHandle<R>, action: Action) {
    match action {
        Action::TogglePet => crate::pet::flip_setting(app, "pet.visible", true),
        Action::ToggleDashboard => {
            let visible = app
                .get_webview_window("main")
                .and_then(|w| w.is_visible().ok())
                .unwrap_or(false);
            if visible {
                crate::pet::hide_main(app);
            } else {
                crate::tray::show_main(app);
            }
        }
        Action::NewNote => crate::pet::command(app, "new-note"),
    }
}

pub fn register<R: Runtime>(app: &AppHandle<R>) {
    for (code, action) in KEYS {
        let shortcut = Shortcut::new(Some(modifiers()), code);
        let result = app
            .global_shortcut()
            .on_shortcut(shortcut, move |app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    run(app, action);
                }
            });
        if let Err(error) = result {
            tracing::warn!(%error, ?action, "a global shortcut is taken by another app; skipped");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_action_has_exactly_one_distinct_key() {
        let mut codes: Vec<_> = KEYS.iter().map(|(c, _)| format!("{c:?}")).collect();
        codes.sort();
        codes.dedup();
        assert_eq!(codes.len(), KEYS.len());
        for a in [Action::TogglePet, Action::ToggleDashboard, Action::NewNote] {
            assert_eq!(KEYS.iter().filter(|(_, b)| *b == a).count(), 1, "{a:?}");
        }
    }

    #[test]
    fn mod_shift_t_is_not_taken() {
        assert!(!KEYS.iter().any(|(c, _)| *c == Code::KeyT));
    }
}
