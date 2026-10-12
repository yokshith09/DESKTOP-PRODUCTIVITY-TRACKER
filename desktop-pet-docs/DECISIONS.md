# Loaf — Decisions

One place to see what was decided, by whom, and what is still open. Long reasoning stays where it already lives:

- Architecture decisions ADR-001 … ADR-019: [`docs/01-build-principles/07-architecture-decisions.md`](docs/01-build-principles/07-architecture-decisions.md)
- V-2 RAM metric: [`docs/05-backend/adr-020-ram-metric-v2.md`](docs/05-backend/adr-020-ram-metric-v2.md) (ADR-020; was wrongly numbered ADR-001)
- Product decisions D-1 … D-10: [PRD §9](docs/02-prd/PRD.md) and amendments in PRD §12

**Source tags:** *Owner* = said by the project owner in chat; *Doc* = written in a locked document; *Claude* = proposed by Claude and accepted by silence or not yet reviewed.

---

## 1. Open decisions

None are waiting on the owner right now. Questions that will come up next: when to start M2, when to add signing, and whether to keep the "Character" and "MCP" sidebar items visible before they do anything.

### Resolved on 2026-10-11 (owner)

| # | Question | Answer | What was done |
|---|----------|--------|---------------|
| U1 | First release name | **v0.1.0** for M1; **v1.0.0** stays for the full Phase 1 | Roadmap; version bump happens at release time |
| U2 | Post-v1 order | **As locked:** Developer → MCP → Voice (ADR-015) | Roadmap unchanged |
| U3 | Where Daily Logs history lives | **On the Time page, short** | "Daily log" list on the Time page |
| U4 | Progress card | **Do not create one** | R1-70's yesterday/today summary dropped |
| U5 | Autosave and delete rules | **Update the PRD to match the code** | PRD v1.5: 500 ms; Bin + Undo |
| U6 | Merge PR #1 | **Merge now; build in one branch** | PR #1 merged as `3cdaa9e`; work continues on the one designated branch via new PRs to `main` |
| U7 | Repo rename | **Update the remote** | Done in docs; this cloud session's git proxy only allows the old name, so you must run the `git remote set-url` command in PROJECT_STATUS R7 on your PC |
| U8 | Two documents called ADR-001 | "Do something" (not understood) | Claude renamed the RAM one to **ADR-020** (file, heading and references) |
| U9 | Week calendar | **Next 7 days** | Calendar starts today |
| U10 | Task search | "Leave to M1" — read as **include it in M1** | Search box on the Tasks page. If you meant "leave it out", delete that box |
| U11 | Autostart | **Build before the first version** | F0-09 built |

## 2. Decisions made

### Owner decisions (from chat)

| Date | Decision | Where it shows |
|------|----------|----------------|
| 2026-10-03 | PRD §9 D-1 … D-10 approved; documents D0–D7 locked | PRD, `desktop-pet-docs/README.md` |
| 2026-10-12 | Four characters (Mochi, Pip, Bolt, Ghosty) designed early, pulled forward from Phase 7; Ember, Sprout and Byte dropped. Bear first. | Character page (preview) |
| 2026-10-12 | Typing reaction approved: count key presses only (never which key), off by default with its own switch, nothing stored or sent; macOS needs Input Monitoring | Not built yet |
| 2026-10-03 | Global search removed from v1 (ADR-017) | Architecture decisions |
| 2026-10-03 | Phase order: Developer → MCP → Voice (ADR-015); CI status after MCP (ADR-016) | Architecture decisions |
| 2026-10-04 | Windows is developed and tested on the owner's PC; macOS and Windows are built by GitHub Actions and sent for testing | CI |
| 2026-10-04 | V-2 RAM is gated on **private working set**, not private bytes (ADR-020) | `05-backend/adr-020-ram-metric-v2.md` |
| 2026-10-04 | The UI must look polished and professional, structured tiles, not a "kids" UI | `src/index.css`, dashboard |
| 2026-10-04 | App window opens maximized | `tauri.conf.json` |
| 2026-10-04 | Reminders live inside Today (one agenda) | Today overview |
| 2026-10-04 | Today and Overview merged into one **Today overview** page; it is the landing page | `App.tsx` |
| 2026-10-04 | Sidebar: Today overview, Time, Notes, Character, MCP; Library (Archive, Bin); Settings. Labels live inside Notes, not the sidebar | `Sidebar.tsx` |
| 2026-10-04 | Notes tab order: Today, This-week calendar, Pinned (distinct row), All notes. Search, New note and Ctrl/⌘ K/N only on Notes | `NotesPage.tsx` |
| 2026-10-04 | Bin (30 days) and plain notes search added (reverses part of ADR-017) | PRD amendment v1.4 |
| 2026-10-04 | App and site time tracking pulled forward from Phase 2: **opt-in, off by default, domain-only (no URLs or titles), local, deletable** (ADR-019) | Architecture decisions |
| 2026-10-04 | Time = "where my time went": per-app time, browser sites, click for active spans, with period, category and app/site filters; no calendar, no log | `TimePage.tsx` |
| 2026-10-04 | Today agenda shows time, tasks, reminders; calendar events arrive with MCP (Phase 5) | Roadmap M6 |
| 2026-10-05 | Remove Progress tile and "Coming up"; Links in their own card; total time in a large tile with Apps and Websites under it | `TodayOverviewPage.tsx` |
| 2026-10-05 | Today tasks are editable: priority, deadline, reminder | `TaskEditor.tsx` |
| 2026-10-05 | Overview tiles can be dragged and the order is remembered; Overview page is "fine" | `MovableTiles.tsx` |
| 2026-10-05 | Notes next, then continue in order | This roadmap |
| 2026-10-11 | **P0 = Notes and daily work management is the first release.** Later: browser tracking, desktop companion, voice, MCP, developer reactions, characters | `ROADMAP.md` |
| 2026-10-12 | Next release only after Phase 2 (M2 + M3) is complete; no version bumps until then | Owner, after testing 0.1.3 |
| 2026-10-12 | First run (F1-26): one welcome screen, start empty (no sample data), pet on by default; tracking and login off until chosen | Owner chose the recommended options |
| 2026-10-12 | Global `Mod+Shift+T` and the quick-add popup (F1-24) removed | Owner: "remove the shortcut ctrl+shift+T completely" |
| 2026-10-11 | U1–U11 answered (table above): v0.1.0 for M1, ADR-015 order kept, Time page history, no Progress card, PRD v1.5, merge PR #1, next-7-days calendar, autostart before release | PRD, `ROADMAP.md`, code |

### Technical decisions made by Claude (open to review)

| Date | Decision | Reason |
|------|----------|--------|
| 2026-10-04 | Use ts-rs 11 to generate TypeScript types from Rust; CI fails if they are stale | One source of truth for IPC types |
| 2026-10-04 | In-memory mock shell (`src/ipc/mock.ts`) for design work in a browser | Fast UI iteration without the desktop shell |
| 2026-10-04 | Use the official single-instance plugin, not a lock file | The hand-rolled version was unreliable |
| 2026-10-04 | Opener plugin with narrow permissions; the UI calls our own `open_url`, which only allows http, https and mailto | Limits what a pasted link can do |
| 2026-10-04 | Tracking idle check: one 60 s timer only while a session is open and tracking is on; 5 min idle threshold (ADR-019 exception to ADR-009) | No OS event exists for "no input" |
| 2026-10-05 | A reminder created from the task editor is a normal reminder with the task's title, not linked to the task | No schema change |
| 2026-10-05 | `@dnd-kit` for tile drag, for keyboard support | Native drag has no keyboard path |
| 2026-10-05 | Overview tiles share one height so dragging leaves no gaps | Mixed heights left empty holes |
| 2026-10-11 | Export is a plain JSON dump of every table by column name; import inserts the same way, in one transaction, and recomputes label `name_folded` | New tables are covered without a second list to maintain; a bad row undoes everything |
| 2026-10-11 | The export/import file dialogs are opened by Rust (dialog plugin), never by the webview | The webview never holds or supplies a file path |
| 2026-10-11 | Delete all lifts the append-only triggers inside one transaction, wipes every table, puts the triggers back, then runs `VACUUM` | Keeps the "history is append-only" rule everywhere else, and removes deleted text from the file |
| 2026-10-11 | Autostart: the OS login item is the truth; if it disagrees with the setting at startup, the setting changes. The main window is created hidden and shown unless `--hidden` | A removed login item can't leave the switch lying |
| 2026-10-11 | Windows installer uses `embedBootstrapper` for WebView2 | Works on a clean PC without a separate download step for most systems |
| 2026-10-11 | A day's log is exported by copying Markdown to the clipboard | No file dialog needed for a short text; a save-to-file option can follow |
| 2026-10-11 | Tasks got their own sidebar page ("Tasks") between Today overview and Time | R1-27 needs the five views somewhere; the owner approved the sidebar order earlier but not this addition: tell Claude if you want it elsewhere |
| 2026-10-11 | Coverage floors: core ≥ 90% lines (measured 97%), frontend lines 80 / branches 70 / functions 55 (measured 88 / 80 / 65) | Catches large drops without failing on small ones |
| 2026-10-11 | The pet (F1-22) was built before M2 starts because the owner reported its absence as a v0.1 bug | Owner request after testing v0.1.0 |
| 2026-10-11 | Pet window: one transparent window that grows to show the hover card toward the free side of the screen, instead of a second card window | One webview; the pet never jumps |
| 2026-10-11 | Pet animations use CSS transforms only (breathe, blink, wave, hop); no JS animation loop. R1-65 (~0 idle CPU) is not measured yet (risk R9) | Cheapest animation the webview offers |
| 2026-10-11 | Click vs double-click on the pet: a click waits 260 ms; a second click inside that window hides Loaf instead | Owner asked for click = open, double-click = close |
| 2026-10-11 | Pet right-click menu is a native OS menu (Tauri `popup_menu`), not an HTML menu | A transparent 128 px window cannot fit an HTML menu |
| 2026-10-11 | Global shortcuts `Mod+Shift+L` (Loaf), `N` (note), `T` (task), `P` (pet). A key already taken by another app is skipped with a log warning, not an error | Owner asked for pet shortcuts; startup must not fail over a key clash |
| 2026-10-11 | Main window opens at 1180×760, centred, not maximized; the window-state plugin remembers size, position and maximized state (not the pet) | Owner: "open halfway, full screen only when I choose" |
| 2026-10-11 | Any task can be deleted. An unfinished task is cancelled first (so history records it), then deleted; two-step "Delete?" confirm on rows | Owner asked for delete on every task; core only deletes finished tasks |
| 2026-10-11 | Colour pass: darker dark-mode canvas, raised cards with a 1px border and top-edge highlight, stronger muted text; one accent colour | Owner said the colours were confusing; follows the 60-30-10 / subtle-border rules |
| 2026-10-11 | Bear stays a drawn SVG ("soft 3D": shading, rim light, contact shadows), not real 3D. Owner chose it over three.js | Real 3D needs an artist-made model and keeps the GPU busy; an artist Rive/Lottie file can replace the SVG later |
| 2026-10-11 | Pet reactions are one table of event → pose, bubble, duration, priority (`src/pet/reactions.ts`); at most 3 wait, highest priority first | Owner: "lot more to come" — new moments must be one line each |
| 2026-10-11 | ~~"Overdue" reaction noticed by the pet once a minute~~ **Removed in 0.1.3** (owner) | Owner did not want it |
| 2026-10-11 | The bear sleeps after 15 minutes with no activity (hover, click, any Loaf event, tracked app time), not by the clock | Owner works late; clock-based sleep looked like "always asleep". With tracking off, only Loaf activity keeps it awake |
| 2026-10-11 | Speech bubbles grow the pet window the same way the hover card does, and never take focus | A bubble must not interrupt typing in another app |
| 2026-10-11 | Scrollbars are invisible until the pointer is over the scrolling area | Owner asked for no visible scrollbars; hiding them fully would remove the only hint that a list scrolls |
| 2026-10-12 | A due reminder is shown four ways: system notification, taskbar flash, pet bell (15 s), in-app alert with Done / Snooze | The system notification can be swallowed silently (Do not disturb, notifications off) and the plugin never reports it |
| 2026-10-12 | Dragging the pet with its card open moves the grown window; the shell computes the pet's new square from how far the window moved | Resizing the window at the start of a drag cancels the drag on Windows |
| 2026-10-12 | Meetings save themselves 600 ms after the last change (like notes); a new meeting is created the first time it has a title | No Save button to forget; matches notes |
| 2026-10-12 | Decisions and action items keep their ids across saves, and the UI makes the id for a new item | A converted action item stays linked to its task when the list is edited or reordered, and the page never has to match rows up after a save |
| 2026-10-12 | Converting an action item: task planned date stays empty (it shows under All/Upcoming by due date, not Today) | R1-34 sets title, project, due and description only |
| 2026-10-12 | Meetings page is `Mod+5`; `Mod+4` stays Time | The UI brief puts Meetings at `Mod+4`, but Time already owns it and the owner uses it |
| 2026-10-12 | Today shows only "Yesterday: X of Y done · N still open" from R1-70; a click opens Tasks filtered to those tasks. Meeting follow-ups and pinned notes are not on Today | Owner chose only this |
| 2026-10-12 | Two global shortcuts are changeable (open/hide Loaf, new note); the pet's stays fixed. A combination needs Ctrl/⌘ or Alt plus a letter, digit or F-key, checked in the core and in the UI | Matches the existing settings keys; Shift-only combos would steal typing |
| 2026-10-12 | Log level changes apply immediately (reloadable filter), no restart | Debug logging is most useful right when a problem is happening |
| 2026-10-12 | Reset settings resets settings only, not data or layout preferences | "Reset" next to a Delete-all button must not be a second delete |
| 2026-10-12 | End-to-end tests drive the real binary with WebDriver (tauri-driver + selenium-webdriver, Node's own test runner) on Windows; macOS gets a launch smoke test only | Tauri's WebDriver works on Windows and Linux, not macOS; one small dependency, no new test framework |
| 2026-10-12 | `LOAF_DATA_DIR` overrides where data and logs live | Tests (and anyone running a second copy) must never touch real data |

### Documented conflicts (code differs from a locked document)

| Document says | Code does | Resolution |
|---------------|-----------|------------|
| UI brief §8: `Mod+4` Meetings, `Mod+5` Daily Logs, global `Mod+Shift+T` quick-add | `Mod+4` Time, `Mod+5` Meetings, no `Mod+Shift+T` | Owner removed `Mod+Shift+T`; Time kept `Mod+4` |
| R1-02 autosave after 800 ms | 500 ms | U5 |
| R1-05 no trash, 5 s undo | 30-day Bin, undo toast | Owner addition; PRD amended in v1.4; U5 for the rest |
| R1-09 label list in the sidebar | Label chips on Notes | Owner decision 2026-10-04 |
| D-9 home = Today + Dashboard | Home = Today overview | PRD amendment v1.4 |
| R1-46, R1-84 hide activity and tracking until Phase 2 | Shown when tracking is on | PRD amendment v1.4 |
