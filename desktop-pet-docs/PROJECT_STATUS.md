# Loaf — Project Status

**Last updated:** 2026-10-11 · **Work branch:** `main` (owner decision: one branch). PR #1 and PR #2 are merged. Releases: `v0.1.0` published; `v0.1.1` draft (pet); `0.1.2` adds pet reactions and the soft-3D bear; `0.1.3` drops the overdue reaction and makes the bear sleep only when nothing has happened for 15 minutes.
**Read this first.** Then [`ROADMAP.md`](ROADMAP.md) (plan), [`DECISIONS.md`](DECISIONS.md) (why) and [`CHANGELOG.md`](CHANGELOG.md) (what changed).

Every claim is tagged with how it was checked. **Fact** = seen in code, tests, Git or CI. **Inference** = a reasoned guess from facts. **Unknown** = no evidence either way.

---

## 1. Summary

1. **Fact:** Loaf is a Tauri v2 app: Rust core (`crates/loaf-core`, no Tauri dependency), thin shell (`src-tauri`), React + TypeScript UI (`src`).
2. **Fact:** On 2026-10-11 the owner decided: merge now and build in one branch (done: PR #1 merged), no Progress card, calendar shows the next 7 days, autostart is built before the first release, the phase order stays as locked (ADR-015), M1 is labelled v0.1 and v1.0.0 stays for the full Phase 1.
3. **Fact:** The whole M1 build list is now implemented: Notes (Markdown preview, label manager, shortcuts), Tasks (page, all views, status controls, defer, detail, work updates, delete, search), daily-log history on the Time page, autostart, export/import/delete-all, installer workflow, coverage floors.
4. **Fact:** Tests run on 2026-10-12: **347** core tests + **17** shell tests pass; **70** frontend tests pass; `cargo clippy -D warnings`, `cargo fmt --check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:core-deps` pass; generated types are fresh.
5. **Fact:** Coverage measured today: `loaf-core` **97.3%** of lines; frontend **89.7%** lines. CI now enforces floors (core ≥ 90% lines; frontend lines/statements ≥ 80, branches ≥ 70, functions ≥ 55).
6. **Fact (owner, 2026-10-11):** the owner installed v0.1.0 on Windows; the app opens, app tracking lists apps (Loaf, Claude, File Explorer) and tasks can be added. The owner reported: no desktop pet, colours confusing, the dashboard opened full screen, no way to delete every task. All four are addressed in 0.1.1 (§4.6), **Unverified** until the owner installs it.
7. **Unknown (the main risk):** the rest of the Windows checklist (§8) has not been run line by line. Everything that needs the operating system is **Unverified**: the tray, reminder notifications, the Windows app tracker, opening links, **autostart**, the **file dialogs for export and import**, and the **installer**.
8. **Fact:** CI failed on `00ae175` (2026-10-11 08:17 UTC) because the demo data in the frontend tests depended on the time of day. Fixed in `3ed177f` with a regression test; CI is green on it for Windows and macOS.

**M1 (first release) is feature-complete in code.** What stands between here and a release is **verification on a real Windows PC (G1)** and **signing certificates (owner)**.

---

## 2. What each status word means

| Word | Meaning |
|------|---------|
| **Complete** | Built, automated tests pass, CI green. Nothing known missing. |
| **Unverified** | Built and compiles, but it needs a real machine or OS to prove it works. Never call these verified until someone runs them. |
| **In progress** | Work started and not finished. |
| **Partial** | A screen or code path exists but part of the requirement is missing. |
| **Planned** | Written in the docs, no code. |
| **Blocked** | Cannot continue until something outside the code is decided or done. |
| **Deprecated** | Removed or replaced on purpose. |

---

## 3. Current work

| Item | Detail |
|------|--------|
| **Current milestone** | **M1 — Notes + daily work (P0, first release, v0.1).** Code complete; in verification. |
| **Just finished** | Owner's first-test fixes (0.1.1): desktop pet with hover card, click / double-click / right-click menu, drag, global shortcuts; Pet and Shortcuts settings; calmer colours; main window opens at 1180×760 and remembers its size; delete any task. See the CHANGELOG. |
| **Open work** | G1 (owner runs the Windows checklist, §8). Signing certificates (owner). F0-06 wake-from-sleep and timezone-change hooks (a risk, not a blocker; see §6 R1). |
| **Blockers** | G1 needs the owner's PC. Signing needs the owner's certificates. |
| **Next after M1** | M2 — rest of Phase 1 (meetings, pet window, global shortcuts, first run) toward v1.0.0. Not started; not to be started without the owner's go-ahead. |

---

## 4. Feature audit

**How verification was done:** *core* = `cargo test` (327 pass); *UI-mock* = Vitest against the in-memory demo shell (41 pass); *CI* = Windows + macOS jobs; *human* = used in the real app (none recorded).

### 4.1 Foundation (Phase 0)

| ID | Feature | Status | Evidence |
|----|---------|--------|----------|
| F0-01 | Scaffold | Complete | Builds in CI on both OSes. **V-1 (oldest macOS): Unverified**, needs a Mac. |
| F0-02 | CI matrix, V-2 RAM job | Complete (CI) / Unverified (final V-2) | `v2-ram` jobs pass; the numbers were not read. Gate: private working set (ADR-020). |
| F0-03 | Event bus | Complete | core |
| F0-04 | Database, migrations 001–003 | Complete | core |
| F0-05 | DB writer thread | Complete | core; `compact()` added for delete-all |
| F0-06 | Clock, midnight rollover | Partial | Core + scheduler wired. **Missing:** wake-from-sleep and timezone-change hooks (no code in `src-tauri`). |
| F0-07 | Settings, typed IPC | Complete | core + UI-mock |
| F0-08 | Tray, single instance, close-hides, quit | Unverified | 4 tray tests; never run on a desktop. Window position not remembered. |
| F0-09 | Autostart `--hidden` | **Unverified** | Built: login item via the autostart plugin, `--hidden` starts hidden in the tray (window created hidden), second `--hidden` launch does not pop the window, reconcile at startup (4 combinations tested), login item removed on Delete all. Never run on a real OS. |
| F0-10 | Frontend shell | Complete | UI-mock |
| F0-11 | Export / import / delete all | **Unverified** (core Complete) | 9 core tests: round trip is identical, import refuses a non-empty Loaf, wrong format/newer schema/damaged row/missing parent imports nothing, `DELETE` must be exact, append-only rules restored. **Unverified:** the system file dialogs and file writing in `src-tauri/src/ipc.rs`. |
| F0-12 | Performance harness | Partial | `scripts/ram` measures V-2 only. V-3, V-5 have no harness. |
| F0-13 | Errors and logging | Complete | core |

### 4.2 P0 — Notes

| Req | Feature | Status | Evidence |
|-----|---------|--------|----------|
| R1-01 | Create note, discard if empty | Complete | core + UI-mock |
| R1-02 | Autosave | Complete | 500 ms (PRD v1.5), saves on closing the editor |
| R1-03 | List, pinned first, three sorts | Complete | core + UI-mock |
| R1-04 | Edit; `edited_at` only on real change | Complete (core) | cursor-at-end Unknown |
| R1-05 | Delete | Complete | 30-day Bin + Undo (PRD v1.5) |
| R1-06 | Pin / unpin | Complete | card hover, editor toolbar, `Mod+D` |
| R1-07 | Archive / restore | Complete | `Mod+Shift+A` in the editor |
| R1-08 | Labels | Complete | add, create inline, **Manage labels** dialog (rename, delete with confirm, name clash refused), `Mod+L` |
| R1-09 | Label filter with counts | Complete | chips on the Notes tab |
| R1-10 | Colours | Complete | |
| R1-11 | Markdown edit / preview | **Complete** | `react-markdown` + GFM; raw HTML shown as text (tested); task boxes read-only; links open via `open_url`; `Mod+E` |
| — | Notes search | Complete | substring on title and body |

### 4.3 P0 — Tasks and daily work

| Req | Feature | Status | Evidence |
|-----|---------|--------|----------|
| R1-20/21 | Create, quick add | Complete | Today, Tasks page, `Mod+T` |
| R1-22/23 | Status machine, buttons | **Complete** | Task detail offers only valid moves (Start, Pause, Resume, Complete, Cancel, Reopen); mirrors the PRD table, tested cell by cell |
| R1-24 | Defer | **Complete** | Tomorrow or a chosen day; history records it |
| R1-25 | Work updates | **Complete** | new core code: add, list newest first, delete only within 5 minutes; tested |
| R1-26 | Link a note | **Complete** | picker in task detail |
| R1-27 | Views + filters | **Complete** | Tasks page: Today, Upcoming, Pending, All, Completed; priority, project, status, date range |
| R1-28 | Overdue badge | Complete | |
| R1-29 | Delete task | **Complete** | finished tasks only, with confirmation |
| — | Task search | **Complete** | box on the Tasks page (title, description, project) |
| R1-40–43 | Daily log: live, freeze, missed days | Complete (core) / Unverified (real rollover) | 23 core tests |
| R1-44 | History with compare | **Complete** | Time page "Daily log": last 14 days, done of planned, change vs the day before, expand to see tasks |
| R1-45 | Export a day as Markdown | **Complete** | copy-to-clipboard button per day (clipboard is Unverified on a real OS) |
| — | Daily progress | Complete | Done this week, Activity, Daily log. **No Progress card** (owner, 2026-10-11) |

### 4.4 Owner additions

| Feature | Status | Evidence |
|---------|--------|----------|
| Reminders | Complete (core + UI) / Unverified (OS notification) | |
| Bin (30 days) | Complete | |
| Today overview with drag-to-reorder tiles | Complete | UI-mock |
| Calendar on Notes: **next 7 days** | Complete | UI-mock |
| Links card | Complete (UI) / Unverified (opening in a real browser) | |
| App and site time tracking | Core Complete; Windows collector **Unverified** | |
| Time page with filters and daily log | Complete (UI-mock) | |

### 4.5 Release (M1 gate)

| Item | Status |
|------|--------|
| G1 Real-Windows checklist (§8) | **Open — owner** |
| G2 Export / import / delete all | Unverified (built) |
| G3 Autostart | Unverified (built) |
| G4 Installer | **Built, Unverified**: changing the version in `src-tauri/tauri.conf.json` on `main` (or pushing a `v*` tag, or pressing Run workflow) runs `.github/workflows/release.yml`, which builds installers on Windows and macOS and creates a **draft GitHub Release** `v<version>` with them (publishing it = one click, and creates the tag). `webviewInstallMode: embedBootstrapper`. Version is `0.1.0`. The workflow ran successfully on 2026-10-11 and produced `Loaf_0.1.0_x64-setup.exe`, `Loaf_0.1.0_x64_en-US.msi` (Windows) and `Loaf_0.1.0_aarch64.dmg` (Apple Silicon only; no Intel Mac build). None of these installers has been installed or run by a person yet. **Signing: not set up** (needs the owner's certificates). |
| G5 Time-of-day test bug | Fixed (`3ed177f`) |
| G6 Coverage floors | Done (core ≥ 90% lines, frontend thresholds) |

### 4.6 Rest of Phase 1 (v1.0.0), later phases

| Item | Status |
|------|--------|
| Meetings (F1-17…19) | **Built** 2026-10-12: list (newest first, filter by participant and dates), editor that saves itself, participants with suggestions, Markdown notes, decisions and action items (reorder), follow-up date, action item → task with live status, delete. Core `crates/loaf-core/src/meetings.rs` (9 tests), UI `src/features/meetings/`. Not yet: follow-ups on the Today overview (R1-70, F1-23). |
| Pet window (F1-22) | **Built, Unverified** (owner asked for it after testing v0.1.0). Transparent, always-on-top window with the animated bear (breathing, blinking, waving on hover, sleeping after 15 quiet minutes; CSS transforms only). Hover → card with today's total, top 3 apps, top 2 tasks, next reminder, done/open counts; the window grows toward the free side of the screen. Click opens Loaf, double-click hides it, right-click opens a native menu (open/hide, new note, new task, tracking on/off, settings, hide pet, quit), drag moves it and the spot is remembered. Code: `src-tauri/src/pet.rs`, `src/pet/`. **0.1.2:** soft-3D redraw and reactions with speech bubbles (task added, done, all done, started, reminder, deleted; overdue removed in 0.1.3; `src/pet/reactions.ts`); Character page previews every pose. Missing from F1-22: reactions to app/focus time. |
| Global shortcuts + quick-add popup (F1-24) | **Built, Unverified**: `Mod+Shift+L` and `Mod+Shift+N` can be changed in Settings › Keyboard shortcuts (press the keys; Esc cancels; clashes refused; Reset); `Mod+Shift+P` fixed. The shell re-registers on change. Quick-add popup and `Mod+Shift+T` removed (owner). |
| Settings screens (F1-25) | **Built**: Appearance, General, Notifications, Desktop pet, Keyboard shortcuts, Privacy and tracking, Your data (with database location), Advanced (log detail, logs folder, reset settings), About (licenses). Folder buttons and live log level are **Unverified** on Windows. |
| First run (F1-26) | **Built** (welcome screen S-00, `src/features/welcome/Welcome.tsx`; tests in `App.test.tsx`): add a task, write a note, log a meeting. |
| Phase 2 rest: browser extensions, bridge, macOS collector, open tabs | Planned |
| Phases 3–7 | Planned |

### 4.7 Deprecated

| Item | Replaced by |
|------|-------------|
| Global search (ADR-006, ADR-014, R1-50…56) | Removed (ADR-017); plain notes and task search added |
| Separate Overview / Today pages | One Today overview |
| Sidebar label list | Label chips on Notes + Manage labels |
| Progress card, Coming up, stat strip | Removed (owner) |
| Mon–Sun week calendar | Next 7 days |

---

## 5. M1 build list — done

N1 Markdown · N2 label manager · N3 pin shortcut and keyboard map · N4 PRD amended (v1.5) · T1 Tasks page · T2 status controls · T3 defer · T4 task detail with work updates and linked note · T5 delete · task search · D-a daily-log history (Time page) · D-b compare + Markdown copy · D-c dropped by the owner · G2 · G3 · G4 (workflow, unsigned) · G5 · G6.

Remaining for release: **G1**, **signing**, version bump, and fixing whatever G1 finds.

---

## 6. Known risks and defects

| # | Problem | Evidence | Severity |
|---|---------|----------|----------|
| R1 | No wake-from-sleep or timezone-change hooks. If the PC sleeps over midnight the rollover relies on the startup catch-up and the day scheduler. | no code in `src-tauri`; core has multi-day-gap tests | Medium |
| R2 | The Windows tracker, tray, notifications, autostart, file dialogs and installer have never run on real Windows. | no record | **High** |
| R3 | The pet uses a transparent window. On Windows it needs WebView2 transparency; on macOS the private API (`macOSPrivateApi`), which the Mac App Store does not allow. Nobody has seen it on a real desktop yet. | `tauri.conf.json` | Medium |
| R9 | The pet's animations run all the time while it is visible. R1-65 asks for ~0% CPU when idle; CSS transforms are cheap but not zero. Not measured. | `src/index.css` | Low |
| R4 | Delete-all removes the login item through the autostart plugin; if the plugin refuses, the item can stay. The warning is logged. | `src-tauri/src/autostart.rs` | Low |
| R5 | Export holds the whole database in memory (fine at expected sizes; the 5000-item fixture is not measured). | `data.rs` | Low |
| R6 | Feature spec files F0-01…F0-13 still say DRAFT. | `docs/features/*.md` | Low (doc debt) |
| R7 | GitHub shows the repository as `DESKTOP-PRODUCTIVITY-TRACKER`. This cloud session can only push through the old name, so the **local remote on your PC needs updating by you**: `git remote set-url origin https://github.com/yokshith09/DESKTOP-PRODUCTIVITY-TRACKER.git` | push attempt to the new URL was refused by the session's git proxy | Low |
| R10 | Until 2026-10-12 the app never started its logger, so no log file or crash report was ever written (F0-13 was built in the core but not wired). Fixed; logs are in the app's log folder (Settings › Advanced › Open logs folder). | `src-tauri/src/logs.rs` | Fixed, Unverified |
| R11 | The Windows end-to-end job depends on a matching Microsoft Edge Driver (installed by `msedgedriver-tool` in CI). If WebView2 and the driver drift apart, the job fails before any test runs. | `.github/workflows/e2e.yml` | Low |
| R8 | A session hook reported missing `memory/decisions.md` and `memory/FACTS.md`. They do not exist in this repo. | hook output | Low |

Fixed since the first audit: D1 time-of-day tests (CI had failed on it), D2 autostart switch, D4 two documents named ADR-001 (the RAM one is now ADR-020), a race in the demo shell that made it create two copies of itself on start (events were lost; found while testing delete-all).

---

## 7. Next three actions

1. **M2 (owner, 2026-10-12: "keep moving"; next release only after Phase 2).** Done: F1-26 first run, F1-17…19 meetings. Done also: F1-23 (Yesterday line), F1-24, F1-25. M2: F1-27 end-to-end tests built (`e2e/`, CI workflow *End-to-end*); only **signing** is left, and it needs the owner's certificates. Next: M3 (Phase 2), then the release.
2. **Owner: re-check the three 0.1.3 fixes** when convenient: Actions → Release build → Run workflow refreshes the `v0.1.3` draft with them (no version change). Notifications: Settings › Notifications › Send a test notification.
3. **Characters (owner, 2026-10-12, pulled forward):** four designs (3D-lit; Byte dropped) and the bear's typing pose are in as a preview. Typing along is built (`pet.typing`, off by default) — **Unverified**: needs a run on the owner's Windows PC (turn on Character › Type along with me, type in Notepad). Open: watch the other app's text box instead of the 20 s wait.
4. **Signing certificates** (owner): order them now; they are needed for the Phase 2 release.

---

## 8. Windows checklist (owner)

**Result on 0.1.3 (owner, 2026-10-12):** everything passed except three lines, now fixed in code and **Unverified**:
- line 5 **FAIL**: no Windows notification for a reminder. Cause not confirmed (the plugin hides errors). Fix: errors are logged, the taskbar flashes, the pet rings for 15 s, an in-app alert with Done / Snooze appears, Settings › Notifications has a test button and a link to the system settings.
- reminders could not be edited (none could; the owner noticed it on a missed one). Fix: click a reminder to change its text or time, or snooze it.
- line 13 **FAIL**: the pet could not be dragged while its card was open. Fix: the grown window is dragged as is; the shell follows the pet and saves the new spot.

Run `pnpm tauri dev` or install the CI build. Write pass or fail next to each line.

1. App opens as a window (not full screen) and the tray icon appears. Resize it, quit, reopen: same size and place.
2. Close the window: it hides. Tray → Quit: the process ends. A second copy brings the first to the front.
3. Notes: create, edit, pin (`Ctrl+D`), colour, label, preview Markdown (`Ctrl+E`), archive, delete + Undo, search, rename and delete a label. Restart: everything is still there.
4. Tasks: add one, Start, Pause, Resume, Complete, Reopen, add a work update, defer to tomorrow, change priority and deadline, delete a finished one. Restart: all correct.
5. A reminder two minutes ahead produces a Windows notification.
6. Settings → app tracking on; use three apps for five minutes: the Time page shows them; click one for its active spans.
7. Paste a link in Links and click it: the default browser opens.
8. Settings → **Open Loaf at login** on, sign out and in: Loaf starts hidden in the tray. Turn it off, sign out and in: it does not start. Remove the login item in Windows settings, reopen Loaf: the switch is off.
9. Settings → **Export**: choose a place, a file appears. **Delete all** (type DELETE): everything is gone. **Import** that file: everything is back, identical.
10. Leave Loaf open past midnight (or move the clock): yesterday appears in the Time page's Daily log. Copy a day as Markdown and paste it somewhere.
11. Task Manager: idle CPU near 0%, memory under 100 MB.
12. Install from the CI installer on a clean PC: it installs, starts, uninstalls cleanly.
13. Desktop pet: hover card fully visible (no scrollbars), click / double-click / right-click, drag and restart (same spot), `Ctrl+Shift+P/L/N/T`, reactions (add, start, finish, finish last, reminder, delete), sleeps after 15 quiet minutes.

---

## 9. Session protocol (for every future Claude session)

1. **Read** this file, then `ROADMAP.md` (active milestone) and the open decisions in `DECISIONS.md`.
2. **Inspect Git:** `git status`, `git log --oneline -15`, `git branch -vv`. Check the open PR and the CI result on the head commit.
3. **Re-verify before trusting:** `cargo test --workspace`, `pnpm typecheck`, `pnpm lint`, `pnpm test`. If a number here differs, trust the run and fix this file.
4. **Continue the active milestone only.** Ask before design choices (the owner dislikes decisions made without asking) and before starting a later milestone.
5. **Build small and test:** add tests with the change. `cargo fmt`, `cargo clippy -D warnings`, `pnpm gen:types` after changing a core type. Never mark something Complete if it needs a real OS and nobody ran it: use Unverified.
6. **Update the docs in the same change:** status here, plan in `ROADMAP.md`, decisions in `DECISIONS.md`, one line in `CHANGELOG.md`.
7. **Commit and push** to the designated branch; keep the PR open; check CI after pushing. Do not stack new work on a merged PR: restart the branch from `main`.
8. **End of session:** state the current feature, what changed, what is open, and the next action.

Never: rewrite working code without a reason, add dependencies silently, mix a future feature into a P0 change, or claim Windows or macOS behaviour was tested when only CI compiled it.
