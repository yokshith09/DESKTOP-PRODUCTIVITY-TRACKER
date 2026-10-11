# Changelog

All notable changes. Newest first. Format follows [Keep a Changelog](https://keepachangelog.com). Nothing has been released yet; everything below is **Unreleased** and lives on branch `claude/repo-context-review-trprp8` (PR #1). Dates come from Git.

## [Unreleased]

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
