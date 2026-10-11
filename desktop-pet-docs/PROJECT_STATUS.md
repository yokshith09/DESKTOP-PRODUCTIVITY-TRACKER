# Loaf — Project Status

**Audit date:** 2026-10-11 · **Branch:** `claude/repo-context-review-trprp8` @ `86b18f0` · **Open PR:** #1 (draft, all work is here)
**Read this first.** Then [`ROADMAP.md`](ROADMAP.md) (plan), [`DECISIONS.md`](DECISIONS.md) (why) and [`CHANGELOG.md`](CHANGELOG.md) (what changed).

Every claim below is tagged with how it was checked. **Fact** = seen in code, tests, Git or CI during this audit. **Inference** = a reasoned guess from facts. **Unknown** = no evidence either way.

---

## 1. Summary in ten lines

1. **Fact:** Loaf is a Tauri v2 app: a Rust core (`crates/loaf-core`, no Tauri dependency), a thin shell (`src-tauri`) and a React + TypeScript UI (`src`).
2. **Fact:** The core has the notes, labels, tasks, reminders, daily log, usage tracking, settings and database layers, with 312 passing tests (run today).
3. **Fact:** The UI has Today overview, Time, Notes, Archive, Bin, Character, MCP (placeholder) and Settings pages.
4. **Fact:** CI is green on the head commit for Windows and macOS (5 of 5 checks, 2026-10-05).
5. **Fact:** `main` holds only the first documentation commit. All 49 later commits are on the feature branch, in PR #1.
6. **Fact:** 2 of 28 frontend tests fail when run before about 08:30 local time. They depend on the time of day (see §6, defect D1).
7. **Unknown:** Whether the real Windows app has been run by the owner. The screenshots the owner shared match the in-memory demo data, so they may come from the demo, not the real app.
8. **Fact:** The main project docs were stale: they said "no application code exists yet". This audit updates them.
9. **Active milestone:** M1 — Notes and daily work management (P0, first release). See [`ROADMAP.md`](ROADMAP.md).
10. **Last thing built:** Overview tile drag-and-drop (`86b18f0`). The owner said the Overview page is done.

---

## 2. What each status word means

| Word | Meaning |
|------|---------|
| **Complete** | Built, automated tests pass, CI green. Nothing known missing. |
| **Unverified** | Built and compiles, but it needs a real machine or OS to prove it works (tray, notifications, Windows collector, macOS). Never call these verified until someone runs them. |
| **In progress** | Work started and not finished. |
| **Partial** | A screen or code path exists but part of the requirement is missing (for example a toggle that saves a setting but does nothing). |
| **Planned** | Written in the docs, no code. |
| **Blocked** | Cannot continue until something outside the code is decided or done. |
| **Deprecated** | Removed or replaced on purpose. Kept in the docs for history. |

---

## 3. Current work

| Item | Detail |
|------|--------|
| **Current feature** | None is being coded. This audit (docs only) is the only open work. |
| **Last completed** | Today overview: tile drag-and-drop with saved order and keyboard support (`86b18f0`, 2026-10-05). |
| **Next** | Notes page and the rest of M1 (see §7 and [`ROADMAP.md`](ROADMAP.md)). |
| **Unfinished tasks** | The M1 list in §5. |
| **Blockers** | (a) No real-Windows run has been recorded. (b) F0-09 autostart is waiting for the owner's go-ahead. |
| **Working tree at audit start** | Clean. |
| **Relevant files** | Notes: `crates/loaf-core/src/notes.rs`, `labels.rs`; `src/features/notes/*`. Tasks: `crates/loaf-core/src/tasks.rs`; `src/features/overview/{TodayAgenda,TaskEditor}.tsx`. Daily log: `crates/loaf-core/src/daily_log.rs`; `src/features/time/*`. IPC: `src-tauri/src/ipc.rs`, `src/ipc/{client,mock}.ts`. |

---

## 4. Feature audit

How verification was done: **core** = `cargo test` in `loaf-core` (312 pass); **UI-mock** = Vitest against the in-memory demo shell (26 pass, 2 time-dependent failures); **CI** = Windows + macOS jobs green; **human** = someone used it in the real app (none recorded).

### 4.1 Foundation (Phase 0)

| ID | Feature | Status | Evidence |
|----|---------|--------|----------|
| F0-01 | Scaffold | Complete | Builds in CI on both OSes; `src-tauri` also compiled on Linux in this audit. **V-1 (oldest macOS) is Unverified** — needs a Mac. |
| F0-02 | CI matrix, V-2 RAM job | Complete (CI) / Unverified (final V-2) | CI green. The `v2-ram` jobs pass, but they only prove a number was measured. This audit did not read the numbers. Gate is private working set (ADR-001-RAM). |
| F0-03 | Event bus | Complete | core tests |
| F0-04 | Database, migrations 001–003 | Complete | core tests |
| F0-05 | DB writer thread | Complete | core tests |
| F0-06 | Clock and midnight rollover | Partial | Core and scheduler are wired in the shell (`Scheduler::spawn`). **Missing:** wake-from-sleep and timezone-change hooks (no code in `src-tauri`). |
| F0-07 | Settings and typed IPC | Complete | core + UI-mock. Rust→TypeScript types are generated (CI checks they are fresh) except settings keys, which are hand-written. |
| F0-08 | Tray, single instance, close-hides, quit | Unverified | Compiles, 4 tray tests pass, CI green. Never run on a real desktop. Window position is not remembered. |
| F0-09 | Autostart (`--hidden`) | **Partial, on hold** | The Settings page has an "Open Loaf at login" switch that saves `general.autostart`. **Nothing in `src-tauri` registers autostart**, so the switch does nothing. Waiting for the owner's go-ahead. |
| F0-10 | Frontend shell | Complete | Sidebar, theme, tokens, page state, last view remembered. Layout differs from the original brief on purpose (see DECISIONS). |
| F0-11 | Export / import / delete all data | **Planned** | No code. Only "Delete tracked time" exists. |
| F0-12 | Performance harness | Partial | `scripts/ram` measures V-2 only. V-3 (idle CPU) and V-5 have no harness. |
| F0-13 | Errors and logging | Complete | core tests |

### 4.2 P0 — Notes

| Req | Feature | Status | Evidence / gap |
|-----|---------|--------|----------------|
| R1-01 | Create note, discard if empty | Complete | core + UI-mock. Quick-capture bar and full editor. |
| R1-02 | Autosave | Complete, differs from spec | Editor saves after **500 ms** (spec says 800 ms). Saves on closing the editor. Saving on window close is Unknown. |
| R1-03 | List: pinned first, three sorts | Complete | core + UI-mock. Pinned shown as a separate accent row. |
| R1-04 | Edit; `edited_at` only on real change | Complete (core) | core tests. Cursor-at-end is Unknown. |
| R1-05 | Delete | Complete, differs from spec | Spec: confirm + 5 s undo, no trash. Built: **30-day Bin** + undo toast, no confirm. Owner addition. |
| R1-06 | Pin / unpin | Partial | Card hover works. Editor-toolbar pin and shortcut: Unknown / not seen. |
| R1-07 | Archive / restore + Archive view | Complete | core + UI-mock |
| R1-08 | Labels: add, create inline, case-insensitive unique | Complete | core tests (Unicode). **Rename / delete label has no UI** (core + IPC exist, `labelRename`/`labelDelete` are never called from a screen). |
| R1-09 | Label filter with counts | Complete, moved | Now chips on the Notes tab (owner moved them out of the sidebar). |
| R1-10 | Colours | Complete | 8 colours + default, picker, tinted cards |
| R1-11 | Markdown edit / preview | **Planned** | No Markdown code anywhere in `src`. |
| — | Notes search | Complete | Plain case-insensitive match on title and body, notes only (ADR-017 as amended). Tasks and meetings are not searched. |
| — | Notes page layout | Complete | Today strip, This-week calendar, Quick-capture bar, Pinned row, All notes (grid or list with header). |

### 4.3 P0 — Tasks and daily work

| Req | Feature | Status | Evidence / gap |
|-----|---------|--------|----------------|
| R1-20/21 | Create task, quick add | Complete | Quick add on Today. The editor changes title, priority, deadline. **No UI for description, project or planned date.** |
| R1-22/23 | Status machine, timestamps, history | Partial | Core: all 25 transitions tested. **UI offers only "complete" (and undo).** No start, pending, cancel or reopen control. |
| R1-24 | Defer | Partial | Core function exists. **No IPC command, no UI.** |
| R1-25 | Work updates | **Planned** | Table `task_work_updates` exists in the schema. No code uses it. |
| R1-26 | Link a note | Partial | Core can store the link. No UI. |
| R1-27 | Views: Today, Upcoming, Pending, All, Completed | Partial | Core + IPC for all five. **UI shows Today only.** The Upcoming list was removed from Today ("Coming up"). There is no Tasks page. |
| R1-28 | Overdue badge | Complete | UI-mock |
| R1-29 | Delete task | Partial | Core rule done. No IPC, no UI. |
| R1-40–43 | Daily log: live, freeze at rollover, missed days | Complete (core) / Unverified (real rollover) | 23 core tests. Real midnight rollover on a running app: never observed. |
| R1-44 | History: calendar/list, compare | **Partial** | Core can return any day. **No history screen.** The owner had the calendar and log removed from the Time page on 2026-10-04. |
| R1-45 | Export a day as Markdown | **Planned** | No code. |
| — | Daily progress | Partial | Shown as "Done this week" bars, the Activity feed and a Time-page chart. The Progress ring and "Done today" figure were removed at the owner's request. |
| R1-70 | Today startup context | Partial | Agenda, reminders, week calendar. Missing: yesterday's summary, pinned notes on Today, meeting follow-ups. |

### 4.4 Owner additions (not in the original PRD)

| Feature | Status | Evidence |
|---------|--------|----------|
| Reminders (create, missed state, scheduler) | Complete (core + UI) / Unverified (OS notification) | 16 core tests. Notification plugin wired; never seen on a real desktop. |
| Bin (30 days, restore, empty, auto-purge) | Complete | core + UI-mock |
| Today overview dashboard (agenda, total time, Links, Activity, Done this week) with drag-to-reorder | Complete | UI-mock. Owner approved on 2026-10-05. |
| Week calendar on Notes | Complete | UI-mock. Shows Mon–Sun (open decision U9). |
| Links card (paste links, open in browser) | Complete (UI) / Unverified (opening a link in the real app) | Opener plugin with narrow permissions. |
| Time tracking: per-app and per-site time, opt-in | Core Complete; Windows collector **Unverified** | 46 + 9 core tests. `src-tauri/src/tracking.rs` compiles in Windows CI, never run on Windows hardware. |
| Time page with period, category and app/site filters | Complete (UI-mock) | Depends on tracking data. |

### 4.5 Rest of Phase 1 (v1.0.0 scope)

| ID | Feature | Status |
|----|---------|--------|
| F1-17…19 | Meetings, decisions, action items | Planned (only the `meetings` count in daily-log stats exists) |
| F1-22 | Pet window | Planned. `pet.html` is an empty placeholder. The Character page is a static bear inside the main window. |
| F1-24 | Global shortcuts, quick-add popup | Planned. In-app Ctrl/⌘ K and N exist on the Notes page only. |
| F1-25 | Settings screens | Partial. Has Appearance, General, Privacy and tracking, About. Missing Pet, Shortcuts, Data, Advanced. |
| F1-26 | First run and empty states | Planned (some empty states exist; no first-run teaching) |
| F1-27 | Installers, signing, release | Planned. CI builds with `--no-bundle`. |

### 4.6 Later phases

| Phase | Status |
|-------|--------|
| 2 Browser Intelligence | Partly pulled forward (Windows app tracking above). **Planned:** Chrome/Edge/Firefox/Safari extensions, native-messaging bridge, macOS collector, open-tab list. The Sites list is empty on real data until the extension exists. |
| 3 Pet and Companion | Planned |
| 4 Developer Companion | Planned |
| 5 MCP (incl. calendar) | Planned. The MCP page is a "coming soon" placeholder. |
| 5.1 CI status | Planned |
| 6 Voice | Planned |
| 7 Characters | Planned. One static bear exists. |

### 4.7 Deprecated

| Item | Replaced by |
|------|-------------|
| Global search, FTS5, search overlay (ADR-006, ADR-014, R1-50…56, F1-20/21) | Removed (ADR-017). Plain notes search was re-added later (owner, 2026-10-04). |
| Separate "Overview" and "Today" pages | One "Today overview" page |
| Sidebar label list (R1-09 wording) | Label chips on the Notes tab |
| Progress card, "Coming up" list, stat strip on Today | Removed at the owner's request, 2026-10-04/05 |

---

## 5. P0 remaining requirements (M1)

P0 = Notes and daily work management as the first release. Each line is a gap found above.

**Notes**
- N1 Markdown edit / preview (R1-11)
- N2 Label manager: rename and delete (R1-08)
- N3 Pin from the editor toolbar and a shortcut; keyboard map (R1-06, R1-82)
- N4 Decide and document autosave 500 vs 800 ms and Bin vs confirm-delete (PRD amendment)

**Tasks**
- T1 A Tasks page with Upcoming, Pending, All and Completed and their filters (R1-27)
- T2 Full status controls: start, pending, cancel, reopen (R1-22)
- T3 Defer: IPC command and UI (R1-24)
- T4 Task detail: description, project, planned date, linked note, history, work updates (R1-13, R1-25, R1-26)
- T5 Delete task: IPC and UI (R1-29)

**Daily progress**
- D-a A Daily Logs history screen (R1-44)
- D-b Compare with previous day and Markdown export (R1-44, R1-45)
- D-c A "yesterday and today" progress summary on Today (R1-70) — needs an owner decision on what replaces the removed Progress card

**Release gate (needed before anyone outside the project uses it)**
- G1 A recorded real-Windows run of the checklist in §8
- G2 Export / import / delete all data (F0-11) — Loaf promises local ownership of data (ADR-012)
- G3 F0-09 autostart done for real, or the switch hidden until it works
- G4 Installers and signing (F1-27)
- G5 Fix the time-of-day test (D1)
- G6 Coverage floor switched on (CI reports coverage but does not enforce it)

---

## 6. Known defects and doc debt

| # | Problem | Evidence | Severity |
|---|---------|----------|----------|
| D1 | Two tests (`Total time lists every app and website…`, `browsers list their sites…`) fail before about 08:30 local time. The demo data only has Chrome sessions from 08:30. CI passed on 2026-10-05 around 12:30 UTC, so CI can fail on early-morning runs. | Test run today at 08:13 UTC: 2 failed, 26 passed. Cause read from `src/ipc/mock.ts` (sessions end at "now"). A first run under heavy CPU load showed 3 failures; the third is Unknown. | Medium (CI reliability) |
| D2 | "Open Loaf at login" switch does nothing. | No autostart code in `src-tauri`. | Medium (misleading UI) |
| D3 | Feature spec files F0-01…F0-13 still say DRAFT; `features/README.md` too. | `docs/features/*.md` | Low |
| D4 | Two documents are both called ADR-001: "Tauri v2 as the shell" and "V-2 RAM metric". | `07-architecture-decisions.md`, `05-backend/adr-001-ram-metric-v2.md` | Low |
| D5 | GitHub shows the repository as `DESKTOP-PRODUCTIVITY-TRACKER`; the local remote still says `DESKTOP-PET`. Works through GitHub's redirect. | CI check URLs; `git remote -v` | Low |
| D6 | A session hook reported missing files `memory/decisions.md` and `memory/FACTS.md`. They do not exist in this repo. Origin Unknown. | Hook output at session start | Low |
| D7 | Windows tracker and tray have never run on real Windows. | No record | High (for release) |

Fixed by this audit: stale "no application code exists yet" lines and stale Phase 0 statuses (README files, `ROADMAP.md`).

---

## 7. Next three actions

1. **Owner: run the Windows checklist (§8) on a real build** and record the result here. This turns the Unverified items into Complete or into bugs. Nothing else should be called "done" before this.
2. **M1 slice 1 — finish Notes:** N1 Markdown preview, N2 label manager, N3 pin from the editor, and fix D1. Decide N4 first (a one-line PRD note).
3. **M1 slice 2 — the Tasks page:** T1, T2, T3 (views, status controls, defer) with their IPC commands; then T4, T5, then the Daily Logs screen.

---

## 8. Windows smoke checklist (owner)

Run `pnpm tauri dev` (or the CI build) on Windows. Write pass or fail next to each line.

1. App opens maximized and the tray icon appears.
2. Close the window: it hides, not quits. Tray → Quit: the process ends.
3. Start a second copy: the first window comes to the front.
4. Create, edit, pin, colour, label, archive, delete (Undo) and search a note. Restart the app: everything is still there.
5. Add a task, edit its priority and deadline, complete it. Restart: still correct.
6. Add a reminder two minutes ahead: a Windows notification appears.
7. Settings → turn on app tracking, use three apps for five minutes: the Time page shows them, and clicking an app shows its active spans.
8. Paste a link in Links and click it: the default browser opens.
9. Leave it open past midnight (or change the clock): yesterday's log appears.
10. Open Task Manager: idle CPU is near 0% and memory is under 100 MB.

---

## 9. Session protocol (for every future Claude session)

1. **Read** this file, then `ROADMAP.md` (active milestone) and the "Unresolved decisions" in `DECISIONS.md`.
2. **Inspect Git:** `git status`, `git log --oneline -15`, `git branch -vv`. Check the open PR and the CI result on the head commit.
3. **Re-verify before trusting:** run `cargo test --workspace`, `pnpm typecheck`, `pnpm lint`, `pnpm test`. If a number here differs, trust the run and fix this file.
4. **Continue the active milestone only.** Take the next unchecked item in `ROADMAP.md`. Do not start a later milestone or a feature the owner has not asked for. Ask before design choices (the owner dislikes decisions made without asking).
5. **Build small and test:** add tests with the change. Rust: `cargo fmt`, `cargo clippy -D warnings`. Types: `pnpm gen:types` after changing a core type. Never mark something Complete if it needs a real OS and nobody has run it — use Unverified.
6. **Update the docs in the same change:** feature status in `ROADMAP.md`, defects and evidence in this file, decisions in `DECISIONS.md`, one line in `CHANGELOG.md`.
7. **Commit and push** to the designated branch. Keep the draft PR open. Check CI after pushing.
8. **End of session:** state the current feature, what changed, what is still open, and the next action.

Never: rewrite working code without a reason, add dependencies silently, mix a future feature into a P0 change, or claim macOS or Windows behaviour was tested when only CI compiled it.
