# Loaf — Decisions

One place to see what was decided, by whom, and what is still open. Long reasoning stays where it already lives:

- Architecture decisions ADR-001 … ADR-019: [`docs/01-build-principles/07-architecture-decisions.md`](docs/01-build-principles/07-architecture-decisions.md)
- V-2 RAM metric: [`docs/05-backend/adr-020-ram-metric-v2.md`](docs/05-backend/adr-020-ram-metric-v2.md) (see U8 about its number)
- Product decisions D-1 … D-10: [PRD §9](docs/02-prd/PRD.md) and amendments in PRD §12

**Source tags:** *Owner* = said by the project owner in chat; *Doc* = written in a locked document; *Claude* = proposed by Claude and accepted by silence or not yet reviewed.

---

## 1. Open decisions (answer these; Claude should not decide them)

| # | Question | Why it matters | Recommendation |
|---|----------|----------------|----------------|
| U1 | **What is the first release called?** M1 (notes + daily work) is smaller than the PRD's v1.0.0 (adds meetings and the pet). | Version numbers and expectations | Call M1 **v0.1**; keep v1.0.0 for the full Phase 1. |
| U2 | **Post-v1 order.** ADR-015 (owner, 2026-10-03): Developer → MCP → Voice. The audit request listed voice before MCP and developer. | Decides what is built after v1 | Keep ADR-015 unless you say otherwise. |
| U3 | **Where does Daily Logs history live?** You removed the calendar and log from the Time page on 2026-10-04. R1-44 still needs a history screen. | M1 cannot close without it | A "History" tab on the Tasks page (new), not on Time. |
| U4 | **What replaces the Progress card on Today?** You removed it. R1-70 wants "yesterday and today" progress. | Daily progress is a P0 goal | A one-line strip in the Today header: "3 of 5 done today · yesterday 7 of 8". |
| U5 | **Autosave 500 ms vs 800 ms; Bin + Undo vs confirm + no trash.** Code and PRD disagree. | PRD must match the product | Amend the PRD to the code (500 ms, Bin 30 days, Undo). |
| U6 | **When to merge PR #1.** `main` has only the docs commit; 49 commits sit on the branch. | Risk of a huge unreviewed merge | Merge after the Windows checklist passes. |
| U7 | **Repo rename.** GitHub shows `DESKTOP-PRODUCTIVITY-TRACKER`; the local remote says `DESKTOP-PET`. | Tooling scope and links | Update the remote URL on your machine. |
| U8 | **Two documents are both "ADR-001".** | Confusing references | Rename the RAM one to ADR-020 (it is newer than ADR-019). |
| U9 | Week calendar: Monday–Sunday or the next seven days? On a Sunday it shows only that day. | Small UX | Rolling seven days. |
| U10 | Should task search exist (notes only today)? | "Search" is a P0 check item | Not in M1; revisit after the Tasks page. |
| U11 | Is the in-app "Open Loaf at login" switch hidden until F0-09 is built? | Defect D2 | Hide it, or build F0-09 now. |

---

## 2. Decisions made

### Owner decisions (from chat)

| Date | Decision | Where it shows |
|------|----------|----------------|
| 2026-10-03 | PRD §9 D-1 … D-10 approved; documents D0–D7 locked | PRD, `desktop-pet-docs/README.md` |
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

### Documented conflicts (code differs from a locked document)

| Document says | Code does | Resolution |
|---------------|-----------|------------|
| R1-02 autosave after 800 ms | 500 ms | U5 |
| R1-05 no trash, 5 s undo | 30-day Bin, undo toast | Owner addition; PRD amended in v1.4; U5 for the rest |
| R1-09 label list in the sidebar | Label chips on Notes | Owner decision 2026-10-04 |
| D-9 home = Today + Dashboard | Home = Today overview | PRD amendment v1.4 |
| R1-46, R1-84 hide activity and tracking until Phase 2 | Shown when tracking is on | PRD amendment v1.4 |
