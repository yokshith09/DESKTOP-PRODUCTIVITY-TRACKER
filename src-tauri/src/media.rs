//! Play / pause / next under the pet (owner request H4, 2026-10-25).
//!
//! The pet sends the system's own media keys, so whatever is playing (Spotify, a browser tab,
//! a video player) reacts as it does to the keyboard's media keys. There is no browser extension
//! and nothing is read about what is playing.
//!
//! * **Windows**: `SendInput` with `VK_MEDIA_PLAY_PAUSE`, `VK_MEDIA_NEXT_TRACK` and
//!   `VK_MEDIA_PREV_TRACK` (key down, key up).
//! * **macOS and elsewhere**: not built. The command returns a plain "not available" error and
//!   the buttons stay hidden there. macOS needs `NSEvent` system-defined events and a real Mac
//!   to check them on; that is not done.
//!
//! Unverified on a real OS: the key mapping is unit-tested, nobody has pressed the buttons yet.

use loaf_core::error::{AppError, Result};

const VK_MEDIA_NEXT_TRACK: u16 = 0xB0;
const VK_MEDIA_PREV_TRACK: u16 = 0xB1;
const VK_MEDIA_PLAY_PAUSE: u16 = 0xB3;

/// The virtual-key code for a pet media action, or `None` for an unknown one. Pure, so it is tested.
pub fn key_for(action: &str) -> Option<u16> {
    match action {
        "play-pause" => Some(VK_MEDIA_PLAY_PAUSE),
        "next" => Some(VK_MEDIA_NEXT_TRACK),
        "previous" => Some(VK_MEDIA_PREV_TRACK),
        _ => None,
    }
}

#[cfg(windows)]
fn press(vk: u16) -> Result<()> {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP,
    };
    let key = |flags| INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                wScan: 0,
                dwFlags: flags,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    };
    let inputs = [key(0), key(KEYEVENTF_KEYUP)];
    // SAFETY: `inputs` is a valid array of two INPUT structs and the size is that of one INPUT.
    let sent = unsafe {
        SendInput(
            inputs.len() as u32,
            inputs.as_ptr(),
            std::mem::size_of::<INPUT>() as i32,
        )
    };
    if sent == inputs.len() as u32 {
        Ok(())
    } else {
        Err(AppError::io("Couldn't send the media key."))
    }
}

#[cfg(not(windows))]
fn press(_vk: u16) -> Result<()> {
    Err(AppError::io("Media buttons only work on Windows for now."))
}

#[tauri::command]
pub fn pet_media(action: String) -> Result<()> {
    let vk =
        key_for(&action).ok_or_else(|| AppError::validation("action", "Unknown media action."))?;
    press(vk)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn actions_map_to_the_media_virtual_keys() {
        assert_eq!(key_for("play-pause"), Some(0xB3));
        assert_eq!(key_for("next"), Some(0xB0));
        assert_eq!(key_for("previous"), Some(0xB1));
    }

    #[test]
    fn anything_else_is_refused() {
        assert_eq!(key_for(""), None);
        assert_eq!(key_for("volume-up"), None);
        assert!(pet_media("rewind".into()).is_err());
    }
}
