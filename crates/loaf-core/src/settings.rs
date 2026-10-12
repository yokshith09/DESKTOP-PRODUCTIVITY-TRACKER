//! Settings schema, defaults, and validation (F0-07).
//!
//! All settings live in the DB (settings table). Defaults are hardcoded here in Rust;
//! a missing key always returns its default. Type and range validation happens on set.

use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::BTreeMap;

/// How many apps the "do not track" list can hold, and the longest name in it.
pub const EXCLUDE_APPS_MAX: usize = 200;
pub const EXCLUDE_APP_LEN_MAX: usize = 100;

/// All settings keys, grouped by section (TRD §3.1).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SettingsKey {
    // general
    #[serde(rename = "general.autostart")]
    GeneralAutostart,
    #[serde(rename = "general.theme")]
    GeneralTheme,
    #[serde(rename = "general.font_size")]
    GeneralFontSize,

    // pet
    #[serde(rename = "pet.visible")]
    PetVisible,
    #[serde(rename = "pet.size")]
    PetSize,
    #[serde(rename = "pet.opacity")]
    PetOpacity,
    #[serde(rename = "pet.always_on_top")]
    PetAlwaysOnTop,

    // shortcuts (F1-24 registers these)
    #[serde(rename = "shortcuts.global_open")]
    ShortcutsGlobalOpen,
    #[serde(rename = "shortcuts.global_new_note")]
    ShortcutsGlobalNewNote,
    #[serde(rename = "shortcuts.global_new_task")]
    ShortcutsGlobalNewTask,

    // tracking (opt-in; Phase 2 pulled forward)
    #[serde(rename = "tracking.apps")]
    TrackingApps,
    #[serde(rename = "tracking.exclude_apps")]
    TrackingExcludeApps,

    // advanced
    #[serde(rename = "advanced.log_level")]
    AdvancedLogLevel,
}

/// A global shortcut as stored: `Mod+…+Key`, e.g. `CmdOrCtrl+Shift+L`. It needs Ctrl, Alt, Cmd
/// or CmdOrCtrl (Shift alone would steal ordinary typing), each modifier once, and one key:
/// a letter, a digit or F1–F24.
pub fn shortcut_is_valid(combo: &str) -> bool {
    let parts: Vec<&str> = combo.split('+').map(str::trim).collect();
    let Some((key, mods)) = parts.split_last() else {
        return false;
    };
    let key_ok = (key.len() == 1 && key.chars().all(|c| c.is_ascii_alphanumeric()))
        || key
            .strip_prefix('F')
            .and_then(|n| n.parse::<u8>().ok())
            .is_some_and(|n| (1..=24).contains(&n));
    let mut seen: Vec<&str> = Vec::new();
    for m in mods {
        let m = match *m {
            "CmdOrCtrl" | "CommandOrControl" => "CmdOrCtrl",
            "Ctrl" | "Control" => "Ctrl",
            "Cmd" | "Command" | "Super" => "Cmd",
            "Alt" | "Option" => "Alt",
            "Shift" => "Shift",
            _ => return false,
        };
        if seen.contains(&m) {
            return false;
        }
        seen.push(m);
    }
    key_ok && seen.iter().any(|m| *m != "Shift")
}

impl SettingsKey {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::GeneralAutostart => "general.autostart",
            Self::GeneralTheme => "general.theme",
            Self::GeneralFontSize => "general.font_size",
            Self::PetVisible => "pet.visible",
            Self::PetSize => "pet.size",
            Self::PetOpacity => "pet.opacity",
            Self::PetAlwaysOnTop => "pet.always_on_top",
            Self::ShortcutsGlobalOpen => "shortcuts.global_open",
            Self::ShortcutsGlobalNewNote => "shortcuts.global_new_note",
            Self::ShortcutsGlobalNewTask => "shortcuts.global_new_task",
            Self::TrackingApps => "tracking.apps",
            Self::TrackingExcludeApps => "tracking.exclude_apps",
            Self::AdvancedLogLevel => "advanced.log_level",
        }
    }

    /// Parse a key string; None if not recognized.
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "general.autostart" => Some(Self::GeneralAutostart),
            "general.theme" => Some(Self::GeneralTheme),
            "general.font_size" => Some(Self::GeneralFontSize),
            "pet.visible" => Some(Self::PetVisible),
            "pet.size" => Some(Self::PetSize),
            "pet.opacity" => Some(Self::PetOpacity),
            "pet.always_on_top" => Some(Self::PetAlwaysOnTop),
            "shortcuts.global_open" => Some(Self::ShortcutsGlobalOpen),
            "shortcuts.global_new_note" => Some(Self::ShortcutsGlobalNewNote),
            "shortcuts.global_new_task" => Some(Self::ShortcutsGlobalNewTask),
            "tracking.apps" => Some(Self::TrackingApps),
            "tracking.exclude_apps" => Some(Self::TrackingExcludeApps),
            "advanced.log_level" => Some(Self::AdvancedLogLevel),
            _ => None,
        }
    }

    /// Default value for this key.
    pub fn default_value(&self) -> Value {
        match self {
            Self::GeneralAutostart => json!(false),
            Self::GeneralTheme => json!("system"),
            Self::GeneralFontSize => json!("M"),
            Self::PetVisible => json!(true),
            Self::PetSize => json!("M"),
            Self::PetOpacity => json!(100),
            Self::PetAlwaysOnTop => json!(true),
            Self::ShortcutsGlobalOpen => json!(null),
            Self::ShortcutsGlobalNewNote => json!(null),
            Self::ShortcutsGlobalNewTask => json!(null),
            Self::TrackingApps => json!(false),
            Self::TrackingExcludeApps => json!([]),
            Self::AdvancedLogLevel => json!("info"),
        }
    }

    /// Validate a value for this key; returns error if invalid.
    pub fn validate(&self, value: &Value) -> Result<()> {
        match self {
            Self::GeneralAutostart
            | Self::PetVisible
            | Self::PetAlwaysOnTop
            | Self::TrackingApps => {
                if !value.is_boolean() {
                    return Err(AppError::validation(self.as_str(), "must be a boolean"));
                }
            }
            Self::GeneralTheme => {
                let s = value
                    .as_str()
                    .ok_or_else(|| AppError::validation(self.as_str(), "must be a string"))?;
                if !["light", "dark", "system"].contains(&s) {
                    return Err(AppError::validation(
                        self.as_str(),
                        "must be 'light', 'dark', or 'system'",
                    ));
                }
            }
            Self::GeneralFontSize => {
                let s = value
                    .as_str()
                    .ok_or_else(|| AppError::validation(self.as_str(), "must be a string"))?;
                if !["S", "M", "L"].contains(&s) {
                    return Err(AppError::validation(
                        self.as_str(),
                        "must be 'S', 'M', or 'L'",
                    ));
                }
            }
            Self::PetSize => {
                let s = value
                    .as_str()
                    .ok_or_else(|| AppError::validation(self.as_str(), "must be a string"))?;
                if !["S", "M", "L"].contains(&s) {
                    return Err(AppError::validation(
                        self.as_str(),
                        "must be 'S', 'M', or 'L'",
                    ));
                }
            }
            Self::PetOpacity => {
                let n = value
                    .as_u64()
                    .ok_or_else(|| AppError::validation(self.as_str(), "must be a number"))?;
                if n > 100 {
                    return Err(AppError::validation(self.as_str(), "must be 0–100"));
                }
            }
            Self::ShortcutsGlobalOpen
            | Self::ShortcutsGlobalNewNote
            | Self::ShortcutsGlobalNewTask => {
                if value.is_null() {
                    return Ok(());
                }
                let combo = value.as_str().ok_or_else(|| {
                    AppError::validation(self.as_str(), "must be null or a string")
                })?;
                if !shortcut_is_valid(combo) {
                    return Err(AppError::validation(
                        self.as_str(),
                        "Use Ctrl, Alt or Cmd with a letter, digit or F-key, e.g. CmdOrCtrl+Shift+L.",
                    ));
                }
            }
            Self::TrackingExcludeApps => {
                let items = value.as_array().ok_or_else(|| {
                    AppError::validation(self.as_str(), "must be a list of app names")
                })?;
                if items.len() > EXCLUDE_APPS_MAX {
                    return Err(AppError::validation(
                        self.as_str(),
                        format!("can hold at most {EXCLUDE_APPS_MAX} apps"),
                    ));
                }
                for item in items {
                    let name = item.as_str().ok_or_else(|| {
                        AppError::validation(self.as_str(), "every app must be text")
                    })?;
                    if name.trim().is_empty() || name.chars().count() > EXCLUDE_APP_LEN_MAX {
                        return Err(AppError::validation(
                            self.as_str(),
                            format!("each app name must be 1-{EXCLUDE_APP_LEN_MAX} characters"),
                        ));
                    }
                }
            }
            Self::AdvancedLogLevel => {
                let s = value
                    .as_str()
                    .ok_or_else(|| AppError::validation(self.as_str(), "must be a string"))?;
                if !["trace", "debug", "info", "warn", "error"].contains(&s) {
                    return Err(AppError::validation(
                        self.as_str(),
                        "must be 'trace', 'debug', 'info', 'warn', or 'error'",
                    ));
                }
            }
        }
        Ok(())
    }
}

/// Get the default value for a key by string; None if key is not recognized.
pub fn default_for(key: &str) -> Option<Value> {
    SettingsKey::parse(key).map(|k| k.default_value())
}

/// Validate a key-value pair; None if valid, Some(AppError) if not.
pub fn validate(key: &str, value: &Value) -> Option<AppError> {
    let k = SettingsKey::parse(key)?;
    k.validate(value).err()
}

/// All defaults as a map.
pub fn all_defaults() -> BTreeMap<String, Value> {
    [
        SettingsKey::GeneralAutostart,
        SettingsKey::GeneralTheme,
        SettingsKey::GeneralFontSize,
        SettingsKey::PetVisible,
        SettingsKey::PetSize,
        SettingsKey::PetOpacity,
        SettingsKey::PetAlwaysOnTop,
        SettingsKey::ShortcutsGlobalOpen,
        SettingsKey::ShortcutsGlobalNewNote,
        SettingsKey::ShortcutsGlobalNewTask,
        SettingsKey::TrackingApps,
        SettingsKey::TrackingExcludeApps,
        SettingsKey::AdvancedLogLevel,
    ]
    .iter()
    .map(|k| (k.as_str().to_string(), k.default_value()))
    .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shortcuts_need_a_real_modifier_and_one_key() {
        for ok in [
            "CmdOrCtrl+Shift+L",
            "Alt+F4",
            "Ctrl+Alt+9",
            "Cmd+K",
            "CommandOrControl+Shift+F12",
        ] {
            assert!(shortcut_is_valid(ok), "{ok}");
        }
        for bad in [
            "",
            "L",
            "Shift+L",
            "CmdOrCtrl+",
            "CmdOrCtrl+Ctrl+Ctrl+L",
            "Ctrl+Ctrl+L",
            "Ctrl+LL",
            "Hyper+L",
            "Ctrl+F25",
            "Ctrl+Shift",
        ] {
            assert!(!shortcut_is_valid(bad), "{bad}");
        }
        assert!(SettingsKey::ShortcutsGlobalOpen
            .validate(&serde_json::json!("Shift+L"))
            .is_err());
        assert!(SettingsKey::ShortcutsGlobalOpen
            .validate(&serde_json::json!(null))
            .is_ok());
    }
    use crate::error::ErrorCode;

    #[test]
    fn all_defaults_exist() {
        let defaults = all_defaults();
        assert_eq!(defaults.len(), 13);
        assert_eq!(
            defaults["tracking.apps"],
            json!(false),
            "tracking is opt-in"
        );
        assert_eq!(defaults["tracking.exclude_apps"], json!([]));
        assert_eq!(defaults["general.autostart"], json!(false));
        assert_eq!(defaults["general.theme"], json!("system"));
        assert_eq!(defaults["pet.opacity"], json!(100));
    }

    #[test]
    fn validate_boolean_fields() {
        assert!(SettingsKey::GeneralAutostart.validate(&json!(true)).is_ok());
        assert!(SettingsKey::GeneralAutostart
            .validate(&json!(false))
            .is_ok());
        assert!(SettingsKey::GeneralAutostart
            .validate(&json!("true"))
            .is_err());
    }

    #[test]
    fn validate_enum_fields() {
        assert!(SettingsKey::GeneralTheme.validate(&json!("light")).is_ok());
        assert!(SettingsKey::GeneralTheme.validate(&json!("dark")).is_ok());
        assert!(SettingsKey::GeneralTheme.validate(&json!("system")).is_ok());
        assert!(SettingsKey::GeneralTheme
            .validate(&json!("invalid"))
            .is_err());
    }

    #[test]
    fn validate_opacity_range() {
        assert!(SettingsKey::PetOpacity.validate(&json!(0)).is_ok());
        assert!(SettingsKey::PetOpacity.validate(&json!(50)).is_ok());
        assert!(SettingsKey::PetOpacity.validate(&json!(100)).is_ok());
        assert!(SettingsKey::PetOpacity.validate(&json!(101)).is_err());
        assert!(SettingsKey::PetOpacity.validate(&json!(-1)).is_err());
    }

    #[test]
    fn validate_nulls_in_shortcuts() {
        assert!(SettingsKey::ShortcutsGlobalOpen
            .validate(&json!(null))
            .is_ok());
        assert!(SettingsKey::ShortcutsGlobalOpen
            .validate(&json!("Ctrl+Shift+L"))
            .is_ok());
        assert!(SettingsKey::ShortcutsGlobalOpen
            .validate(&json!(123))
            .is_err());
    }

    #[test]
    fn tracking_apps_is_a_boolean() {
        assert!(SettingsKey::TrackingApps.validate(&json!(true)).is_ok());
        assert!(SettingsKey::TrackingApps.validate(&json!("yes")).is_err());
        assert!(SettingsKey::TrackingApps.validate(&json!(null)).is_err());
    }

    #[test]
    fn exclude_apps_is_a_bounded_list_of_short_names() {
        let k = SettingsKey::TrackingExcludeApps;
        assert!(k.validate(&json!([])).is_ok());
        assert!(k.validate(&json!(["KeePass.exe", "Signal"])).is_ok());
        assert!(k.validate(&json!("KeePass.exe")).is_err());
        assert!(k.validate(&json!([1])).is_err());
        assert!(k.validate(&json!([""])).is_err());
        assert!(k.validate(&json!(["   "])).is_err());
        assert!(k.validate(&json!(["x".repeat(100)])).is_ok());
        assert!(k.validate(&json!(["x".repeat(101)])).is_err());
        let many: Vec<String> = (0..200).map(|i| format!("app{i}")).collect();
        assert!(k.validate(&json!(many)).is_ok());
        let too_many: Vec<String> = (0..201).map(|i| format!("app{i}")).collect();
        let err = k.validate(&json!(too_many)).unwrap_err();
        assert_eq!(err.field.as_deref(), Some("tracking.exclude_apps"));
    }

    #[test]
    fn error_includes_field() {
        let err = SettingsKey::GeneralTheme
            .validate(&json!("invalid"))
            .unwrap_err();
        assert_eq!(err.code, ErrorCode::Validation);
        assert_eq!(err.field.as_deref(), Some("general.theme"));
    }

    #[test]
    fn parse_valid_keys() {
        assert_eq!(
            SettingsKey::parse("general.autostart"),
            Some(SettingsKey::GeneralAutostart)
        );
        assert_eq!(
            SettingsKey::parse("pet.opacity"),
            Some(SettingsKey::PetOpacity)
        );
    }

    #[test]
    fn parse_invalid_keys() {
        assert_eq!(SettingsKey::parse("invalid.key"), None);
        assert_eq!(SettingsKey::parse(""), None);
    }
}
