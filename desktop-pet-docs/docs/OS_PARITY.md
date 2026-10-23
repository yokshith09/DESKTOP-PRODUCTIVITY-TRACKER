# Feature parity across operating systems (2026-10-23)

Loaf ships **Windows and macOS** installers (release workflow matrix: `windows-latest`, `macos-latest`). **Linux has no build yet** (FR-57 planned). Everything is **Unverified on a real PC** except what the owner has tested on Windows (v2.0.0).

| Feature | Windows | macOS | Linux |
|---|---|---|---|
| Notes, tasks, meetings, routine, diary (planned), links, Today, Settings | ✅ | ✅ | ⬜ no build |
| Desktop pet window, reactions, bubbles, pet library, ZIP import | ✅ | ✅ (transparent window; drag uses OS move) | ⬜ |
| Daily greeting, birthdays, nudge budget, toasts | ✅ (see bug S1) | ✅ (see bug S1) | ⬜ |
| System reminder notifications | ✅ | ✅ (needs notification permission) | ⬜ |
| Open at login (autostart) | ✅ registry Run key | ✅ login item | ⬜ |
| Global shortcuts | ✅ | ✅ (may need Accessibility for some keys) | ⬜ |
| **App time tracking** (`tracking.rs`) | ✅ event hook, no polling | ✅ checks once a second (exception to ADR-009) | ⬜ "unavailable" |
| **Website time** (`sites.rs`) | ✅ Chrome, Edge, Brave, Firefox… via UI Automation; private windows skipped (English UI only) | ⚠️ Chrome, Edge, Brave, Vivaldi only (AppleScript, asks per browser); **Safari, Firefox, Arc: nothing** | ⬜ |
| **Open tabs list / close tab** (`tabs.rs`) | ⚠️ the browser window **in front only**; domain only for the visible tab | ✅ all Chrome-family tabs across windows; Safari/Firefox skipped | ⬜ |
| **Typing along** (`typing.rs`) | ✅ keyboard hook counter | ✅ system key counter; needs Input Monitoring (+ Accessibility for the text-box part) | ⬜ |
| Code signing | ❌ unsigned (SmartScreen warning) → SignPath once the repo is public | ❌ unsigned (Gatekeeper; needs Apple Developer $99/yr) | — |

**Gaps to close for parity:**
1. Linux build (FR-57): AppImage + .deb; tracking via X11 (`_NET_ACTIVE_WINDOW`) and a Wayland fallback ("unavailable"); typing via evdev needs permissions — likely "unavailable" on Wayland.
2. macOS website time for Safari/Firefox: no reliable way without an extension (locked decision) → stays unsupported; say so in the UI.
3. Windows tabs: all windows, not just the front one (UI Automation can walk every browser window).
4. Signing on both platforms.
