# Changelog

All notable changes. Newest first. Format follows [Keep a Changelog](https://keepachangelog.com). Everything lives on `main`. `v0.1.0` is the first release; entries below are grouped by date. Dates come from Git.

## [Unreleased]

- Added (preview): four new characters (Mochi the cat, Pip the penguin, Bolt the robot, Ghosty the ghost), drawn with 3D lighting shown on the Character page, each with idle / typing / cheer / sleep poses. Not selectable yet.
- Added: the bear's "typing" pose (opens a laptop and taps along). Not yet triggered by real typing.

### 2026-10-12 (M2: end-to-end tests, F1-27)
- Added: **end-to-end tests** on the real app (`pnpm e2e`): a fresh install shows the welcome screen; add a task; write a note; log a meeting and convert its action item to a task; restart and check everything is still there. Runs on Windows in CI (*End-to-end* workflow) through WebDriver; macOS gets a launch smoke test (`pnpm e2e:smoke`), because Apple has no WebDriver for the app's webview.
- Added: `LOAF_DATA_DIR` environment variable: keeps Loaf's database and logs in that folder (the tests use a fresh temporary one, never real data).

### 2026-10-12 (M2: Today, shortcuts, settings)
- Added: **"Yesterday: X of Y done · N still open"** under the greeting on Today; a click opens Tasks on yesterday's unfinished tasks.
- Added: change the global shortcuts for Open/hide Loaf and New note in Settings › Keyboard shortcuts (press the keys, Esc cancels, clashes refused, Reset). They apply at once.
- Added: Settings › Your data shows where the database is, with Open folder. Settings › Advanced: log detail (Low/Normal/Debug, applies at once), Open logs folder, Reset settings. About lists the open-source projects Loaf uses.
- Fixed: **the app never wrote a log file or crash report** — the logger existed but was never started. Now it starts first thing.
- Fixed: Character › "Always on top" had no effect on the pet window.

### 2026-10-12 (M2: meetings F1-17…19; shortcut removed)
- Added: **Meetings** page (sidebar, `Ctrl+5`; `Ctrl+M` starts one). List newest first with participant and date filters. The editor saves itself: title, time, participants (suggested from earlier meetings), Markdown notes, decisions and action items (add, edit, remove, reorder), follow-up date. **Convert to task** makes a task (project = meeting, due = follow-up, assignee in the description) and the item shows that task's status live. Deleting a meeting keeps its tasks.
- Added: "Log a meeting" on the welcome screen.
- Removed: the global shortcut `Ctrl+Shift+T` (owner). The in-app `Ctrl+T` stays.
- Fixed: a due reminder showed two toasts inside Loaf; now one, with Done and Snooze.
- Tests: fixed a test race (Delete all fired before the page listened for events).

### 2026-10-12 (M2: first run, F1-26)
- Added: **welcome screen** on a fresh Loaf (and after Delete all): hello from the bear, "Add your first task" or "Write a note", and three choices — show the pet (on), track app time (off), open at login (off). Shown once; never to someone who already has notes or tasks.

### 2026-10-12 (owner's test of 0.1.3; no version change: next release after Phase 2)
- Fixed: reminders can be edited (text, time) and snoozed (10 min, 1 hour, tomorrow 9 AM) from Today and the Notes strip. A new time makes the reminder ring again.
- Fixed: the pet can be dragged while its card is open. The window is dragged as it is (shrinking it first lost the grab), the card hides during the drag, and the pet's new spot is saved.
- Changed: reminder alerts no longer rely only on the system notification: failures are logged, Loaf flashes in the taskbar, the pet rings for 15 s, and an in-app alert offers Done and Snooze. New Settings › Notifications with "Send a test notification" and "Open notification settings".

### 2026-10-11 (0.1.3 — owner's test of 0.1.2)
- Fixed: the pet "always slept". It slept by the clock (23:00–06:00), which is when the owner works. It now sleeps only after 15 minutes with nothing happening (no hover, no click, no event from Loaf, no tracked app time) and wakes at once.
- Removed: the overdue reaction (owner's call). The worried pose stays for later use.
- Changed: version **0.1.3**.

### 2026-10-11 (0.1.2 — owner's test of 0.1.1)
- Fixed: scrollbars in the pet window. The hover card was taller than the space reserved for it (291 px vs 262), so the window scrolled. The card now has its measured size and the pet window never scrolls.
- Fixed: scrollbars everywhere are hidden until the pointer is over the area that scrolls.
- Fixed: Today overview tiles. The second row (Links, Activity, Done this week) was as tall as the first and "Done this week" overflowed sideways. Rows are now 15rem; Today and Total time span two rows.
- Changed: the bear is redrawn "soft 3D": form shading, warm rim light, contact shadows, blurred ground shadow, squash-and-stretch.
- Added: **pet reactions** with a 3-second speech bubble. Task added → catches a card; task done → jumps ("Done! 2 left today"); last task done → party with confetti; task started → works on a laptop (and keeps working while any task is in progress); task overdue → worried with a sweat drop; reminder due → rings a bell; task deleted → tosses a paper ball. One table (`src/pet/reactions.ts`) holds them all; adding one is one line.
- Added: Character page previews every pose.
- Changed: version **0.1.2**.

### 2026-10-11 (0.1.1 — fixes from the owner's first test)
- Added: **desktop pet** (F1-22). An animated bear in its own transparent, always-on-top window, bottom-right by default. Hover shows today's card: total time, top 3 apps, top 2 tasks, next reminder, done/open counts. Click opens Loaf, double-click hides it, right-click opens a menu (open/hide Loaf, new note, new task, app tracking on/off, settings, hide pet, quit). Drag to move; the spot is remembered. Also in the tray menu. **Unverified** on a real desktop.
- Added: global shortcuts `Ctrl+Shift+L` show/hide Loaf, `Ctrl+Shift+N` new note, `Ctrl+Shift+T` new task, `Ctrl+Shift+P` show/hide pet (`Cmd` on macOS).
- Added: Settings › Desktop pet (show, size, opacity) and Settings › Keyboard shortcuts.
- Added: delete for **any** task: a trash button on Tasks and Today rows (click twice to confirm) and in task detail. Unfinished tasks are cancelled first.
- Changed: the main window opens at 1180×760 instead of full screen and remembers its size and position.
- Changed: calmer colours: clearer card edges, stronger secondary text, darker dark-mode background.
- Changed: version **0.1.1**.

### 2026-10-11 (release automation)
- First release build ran green: release `v0.1.0` has the Windows `.exe` and `.msi` and an Apple Silicon `.dmg` attached. It is shown as **published** (13:10 UTC); the workflow itself only makes drafts. Not yet tested by a person.
- Changed: version bumped to **0.1.0** (package, Tauri, Cargo workspace); Settings › About now shows the real version.
- Added: the release workflow starts by itself when the version in `src-tauri/tauri.conf.json` changes on `main` (also on a `v*` tag push or by hand). It builds the Windows and macOS installers and creates a **draft GitHub Release** `v<version>` with them attached; it does nothing if that release already exists. Publishing the draft (one click) creates the tag. Reason: this session cannot push tags or start workflows.

### 2026-10-11 (M1 build-out)
- Merged: PR #1 into `main` (`3cdaa9e`).
- Fixed: CI failed before 08:30 UTC because the frontend demo data depended on the time of day; fixed with a regression test (`3ed177f`). Also fixed a race that made the demo shell create two copies of itself.
- Added: **Autostart** (F0-09): login item with `--hidden`, quiet start in the tray, reconcile with the system at startup.
- Added: **Tasks page** with Today, Upcoming, Pending, All, Completed, filters and search; **task detail** with status buttons, defer, project, linked note, history, **work updates** (new core code, 5-minute delete window), delete for finished tasks. New commands: `task_get`, `task_history`, `task_defer`, `task_delete`, `work_updates_list`, `work_update_add`, `work_update_delete`; `TaskEdit` now carries the whole task.
- Added: **Markdown preview** in the note editor; **Manage labels** (rename, delete); editor shortcuts `Mod+D`, `Mod+E`, `Mod+Shift+A`, `Mod+L`; app shortcuts `Mod+1…4`, `Mod+,`, `Mod+T`.
- Added: **Daily log** list on the Time page (last 14 days, change vs the day before, copy as Markdown).
- Added: **Export, import, delete all data** (F0-11): core module `data.rs` with 9 tests; Settings › Your data; the file dialogs are opened by Rust.
- Added: Release build workflow and installer config; coverage floors in CI.
- Changed: the calendar on Notes shows the next 7 days; PRD v1.5 (autosave 500 ms, Bin instead of confirm-delete, history on the Time page, no Progress card); ADR-001 (RAM) renamed ADR-020; removed the unused `TodayCard`.
- Docs: `PROJECT_STATUS.md`, `ROADMAP.md`, `DECISIONS.md` brought up to date.

### 2026-10-11 (audit)
- Docs: audit of the whole project. Added `PROJECT_STATUS.md`, `DECISIONS.md`, this file; rewrote `ROADMAP.md` around milestones M0–M8 with M1 (notes + daily work) as the first release; added `CLAUDE.md` with the session protocol; fixed stale status lines in the README files.

### 2026-10-05
- Added: drag-and-drop to reorder Today overview tiles, with keyboard support, saved order and "Reset layout" (`86b18f0`).
- Added: edit a task from Today: title, priority, deadline, reminder. New `task_update` command and `TaskEdit` type (`4bacfbb`).
- Added: browsers list their sites with time under the browser in the total-time tile (`4bacfbb`).

### 2026-10-04
- Changed: Today overview lists every app and website under the total time; the stat strip and the category legend are removed (`183934f`).
- Added: large "Total time today" tile, Apps and Sites lists, a separate Links card; removed the Progress tile and "Coming up" (`7f9deed`).
- Added: Notes quick-capture bar ("Take a note…") and a header row on the list layout (`7f9deed`).
- Added: opt-in app and site time tracking (Windows collector, usage tables, migration 003), link opening, generated types (`72d06f1`).
- Added: Time page filters (period, category, apps/sites), shortcuts, Notes top tiles (`21c9391`).
- Added: week calendar on Notes; Today and Overview merged into "Today overview" with an Activity feed (`919004f`, `8586a34`).
- Changed: Reminders merged into Today; Bin reached from the sidebar (`b30444e`, `91cbf78`).
- Added: notes search, Bin (soft delete, restore, purge, 30-day janitor), reminders with a scheduler and OS notifications (`b5428ab`, `a2cd81a`).
- Added: Notes screen on shadcn-style components and Tailwind v4, then a professional neutral theme with search, Bin, reminders and a full sidebar (`ed39f08`, `81e0824`).
- Added: static HTML design prototype with the Loaf bear (`9b1b573`).
- Added: F0-08 tray menu registry, close-hides, quit flow, single-instance plugin; settings persisted (`d8493a8`, `308d046`).
- Added: F0-07 settings schema, validation, service, Tauri IPC commands, frontend types and client (`fde3b47`, `dbb0e02`, `68ac7ec`, `410d672`).
- Fixed: frontend lint, Rust formatting (`83f893d`, `0f02047`).

### 2026-10-03
- Added: F1-14 task views and F1-15 daily log (build, freeze, reconcile, freezer) (`91c2acf`, `29b2d5c`).
- Added: CP3 tasks core: model, state machine, history, defer, delete rule (`5a2326b`).
- Added: CP2 notes core: notes, labels, pin, archive, delete with undo (`7e3a0dc`).
- Added: F0-06 injectable clock and midnight-rollover scheduler (`65b6ff8`).
- Added: F0-05 database writer thread and read pool; F0-04 database open, migrations, integrity check (`3616b80`, `51b57d8`).
- Added: F0-03 event bus; F0-13 error model, rotating logs, panic hook (`d6c7694`, `f9b39af`).
- Added: F0-02 CI matrix and V-2 RAM measurement; F0-01 Tauri v2 + React/TS/Vite scaffold (`76532b9`, `e579860`).
- Added: `ROADMAP.md`; CP1 feature specs (`6f4dc06`, `20bd4d1`).
- Changed: global search removed from v1 (ADR-017); phase order Developer → MCP → Voice (ADR-015); CI status moved to Phase 5.1 (ADR-016); D0–D7 locked (`20bd4d1`, `eb8926a`, `c931107`, `7648b89`).
- Fixed: `loaf-core` did not compile as a plain library (`7b19c2d`).
- Docs: project documentation added (`d90d7ae`, the only commit on `main`).
