# Loaf — Roadmap

The one page that tracks progress. Flow: **build principles → phases → milestones → features.**
Everything else is reference — open it when a feature needs it:

| Need | Document |
|------|----------|
| Where things stand, evidence, defects | [PROJECT_STATUS](PROJECT_STATUS.md) |
| Why things were decided, open questions | [DECISIONS](DECISIONS.md) |
| What changed | [CHANGELOG](CHANGELOG.md) |
| Why / what the product is | [Product Document](docs/00-product/product-document.md) · [PRD](docs/02-prd/PRD.md) |
| How it is built | [TRD](docs/03-trd/TRD.md) · [Schema](docs/05-backend/backend-schema.md) · [ADRs](docs/01-build-principles/07-architecture-decisions.md) |
| What it looks like | [App flow](docs/04-design/app-flow.md) · [UI/UX brief](docs/04-design/ui-ux-brief.md) |
| Feature detail (acceptance, tests) | [`docs/features/`](docs/features/README.md) |
| Sizes and exit gates | [Implementation plan](docs/06-plan/implementation-plan.md) |

**Rule from here:** this file tracks plan and status. Evidence for every status is in [`PROJECT_STATUS.md`](PROJECT_STATUS.md). Scope or design changes are one line in [`DECISIONS.md`](DECISIONS.md); a locked document is amended only if it would otherwise contradict the code.

**Last updated:** 2026-10-11, after the M1 build-out (branch `claude/repo-context-review-trprp8`, PR #2). Status words (Complete, Unverified, Partial, Planned…) are defined in PROJECT_STATUS §2. **Unverified** means it compiles and CI is green but nobody has run it on a real machine.

---

## 1. Build principles

Full text: [`docs/01-build-principles/`](docs/01-build-principles/README.md).

1. **Event-driven, always** — no polling; one-shot timers are fine.
2. **Lightweight, always** — idle CPU <1%, RAM <100 MB.
3. **Local-first** — user data lives in SQLite on their machine.
4. **One feature at a time** — finish and verify before the next.
5. **UI first** — design before backend.
6. **Tests early** — before or alongside code; >80% coverage to ship.
7. **Learn fundamentals first** — understand it before reaching for a library.
8. **Usable at every phase** — each phase ships something people can use.
9. **No premature optimisation** — make it work, right, then fast.
10. **Technical debt is a debt** — log it with a payoff date.

## 2. Milestones (release order)

The first release is **M1: Notes and daily work management (P0)**. Everything else waits for it. The PRD's "v1.0.0" (notes + tasks + meetings + pet) stays as the full Phase 1 target; M1 is the smaller release before it, labelled **v0.1.0** (owner, 2026-10-11).

| Milestone | Name | Contents | Status |
|-----------|------|----------|--------|
| **M0** | Foundation closure | Real-Windows run, autostart, export/import/delete, perf harness | 🟡 Partial |
| **M1** | **Notes + daily work (P0, first release, v0.1.0)** | Notes, tasks, search, labels, dates, completion history, daily progress, release gate | 🟡 **Active — code complete, in verification (G1)** |
| M2 | Phase 1 completion → v1.0.0 | Meetings, pet window, global shortcuts, settings screens, first run | ⬜ |
| M3 | Browser tracking (Phase 2) | Extensions, bridge, macOS collector, open tabs | 🟡 Windows app tracking built, unverified |
| M4 | Desktop companion (Phase 3) | Animated pet, reactions, sleep | ⬜ |
| M5 | Developer reactions (Phase 4) | Git and local build awareness | ⬜ |
| M6 | MCP (Phase 5, 5.1) | MCP client, OAuth, calendar, GitHub, Gmail, Slack, Notion, CI | ⬜ |
| M7 | Voice (Phase 6) | Activation, intents, voice → task/note | ⬜ |
| M8 | Character customization (Phase 7) | 18 characters, outfits | ⬜ |

**Order after M2:** Developer → MCP → Voice, as locked in ADR-015 (the owner confirmed this on 2026-10-11). M3 and M4 come before it as in the PRD.

---

## M0 — Foundation closure

| ID | Feature | Status (2026-10-11) |
|----|---------|--------|
| F0-01 | Scaffold | ✅ Complete (V-1 oldest macOS: Unverified, needs a Mac) |
| F0-02 | CI matrix + V-2 | ✅ CI green · final V-2 on the full app Unverified (gate: private working set, ADR-020) |
| F0-03 | Event bus | ✅ Complete |
| F0-04 | Database, migrations | ✅ Complete (migrations 001–003) |
| F0-05 | DB writer + read pool | ✅ Complete |
| F0-06 | Clock + rollover | 🟡 Partial — core and scheduler wired; wake-from-sleep and timezone hooks missing |
| F0-07 | Settings + typed IPC | ✅ Complete (settings keys hand-typed) |
| F0-08 | Tray, single instance, close-hides, quit | 🟡 Unverified — never run on a real desktop |
| F0-09 | Autostart `--hidden` | 🟡 Unverified — built 2026-10-11, never run on a real OS |
| F0-10 | Frontend shell | ✅ Complete |
| F0-11 | Export / import / delete all data | 🟡 Unverified — core done and tested (9 tests); file dialogs never run on a real OS |
| F0-12 | Performance harness | 🟡 Partial — V-2 only |
| F0-13 | Errors and logging | ✅ Complete |

---

## M1 — Notes + daily work (P0, first release)

**Goal:** someone can capture notes, plan and finish tasks, find things, and see what they got done each day — on a real Windows machine, with their data safe. **Exit gate:** every checked item below, the Windows checklist (PROJECT_STATUS §8) passed, CI green on Windows and macOS, installer built.

### M1.1 Notes
- [x] Create, edit, autosave (500 ms), discard-if-empty (F1-01, F1-03)
- [x] List, sort, pin, archive, colours (F1-02, F1-05, F1-06, F1-08)
- [x] Delete to a 30-day Bin with Undo, restore, empty (F1-04 + owner addition)
- [x] Labels: add, create inline, filter with counts, **manage (rename, delete)** (F1-07)
- [x] Search (plain, notes)
- [x] N1 Markdown edit / preview (F1-09)
- [x] N3 Pin from the editor, `Mod+D`, `Mod+E`, `Mod+Shift+A`, `Mod+L`; app keys `Mod+1…4`, `Mod+,`, `Mod+T`
- [x] N4 PRD amended (v1.5): autosave 500 ms, Bin instead of confirm-delete

### M1.2 Tasks
- [x] Create, quick add, edit, complete with Undo, overdue badge (F1-10, F1-12)
- [x] Core: state machine, history, defer, delete rule, five views, filters (F1-11, F1-14)
- [x] T1 Tasks page: Today, Upcoming, Pending, All, Completed + priority/project/status/date filters + search
- [x] T2 Status buttons: Start, Pause, Resume, Complete, Cancel, Reopen
- [x] T3 Defer (tomorrow or a chosen day)
- [x] T4 Task detail: description, project, planned date, deadline, linked note, history, work updates (F1-13)
- [x] T5 Delete a finished task

### M1.3 Daily progress
- [x] Daily log core: live, freeze, missed days (F1-15)
- [x] Done-this-week bars, Activity feed
- [x] D-a/D-b Daily log on the Time page: last 14 days, done of planned, change vs the day before, expand, copy as Markdown (F1-16)
- [x] D-c **dropped**: no Progress card (owner)

### M1.4 Release gate
- [ ] G1 Real-Windows checklist passed and recorded — **owner**
- [x] G2 Export / import / delete all data (F0-11) — built, Unverified
- [x] G3 Autostart (F0-09) — built, Unverified
- [x] G4 Installer workflow `release.yml` + bundle config — built, never run; **signing not set up (owner's certificates)**
- [x] G5 Time-of-day test bug fixed
- [x] G6 Coverage floors enforced in CI (core ≥ 90% lines, frontend thresholds)
- [ ] Bump version to 0.1.0, run Release build, install on a clean PC

**Already built and not part of the original M1 list (owner additions):** reminders with notifications, the Today overview dashboard with drag-to-reorder tiles, week calendar, Links, Time page and Windows app tracking. They ship with M1 but their real-machine behaviour is Unverified.

---

## M2 — Phase 1 completion → v1.0.0

| ID | Feature | Status |
|----|---------|--------|
| F1-17 | Meeting create/edit + participants | ⬜ |
| F1-18 | Decisions + action items | ⬜ |
| F1-19 | Action item → task | ⬜ |
| F1-22 | Minimal pet window | ⬜ (`pet.html` is a placeholder) |
| F1-23 | Today view (R1-70 rest) | 🟡 Partial |
| F1-24 | Global shortcuts + quick-add popup + keymap | ⬜ |
| F1-25 | Settings screens (Pet, Shortcuts, Advanced) | 🟡 Partial — Data section done in M1 |
| F1-26 | First run + empty states | ⬜ |
| F1-27 | Cross-OS E2E, signing, **v1.0.0** | ⬜ |

F1-20 and F1-21 (search) are cancelled; their numbers are retired.

---

## M3 — Browser tracking (Phase 2)

| Item | Status |
|------|--------|
| Windows foreground-app tracking, opt-in, domain-only (ADR-019) | 🟡 Built, **Unverified** on Windows |
| Per-app / per-site time, Time page, filters | ✅ Complete (UI-mock) |
| Chrome + Edge extensions (MV3) | ⬜ |
| Native-messaging bridge to the core | ⬜ (the ingest command `usage_record_domain` exists) |
| Open-tabs list and close tab | ⬜ |
| Firefox, Safari extensions | ⬜ |
| macOS foreground-app collector | ⬜ (reports `supported: false`) |

---

## Outline: Phase 2 remainder *(see M3)*
**Milestone 2.1 — Capture**
- App-focus tracking (OS events, no polling)
- Chrome + Edge extensions (MV3)
- Native-messaging bridge to the core
- Firefox extension
- Safari extension

**Milestone 2.2 — Data & privacy**
- Browser / domain sessions, buffered writes (≤1/min)
- Domain categories
- Privacy radar: track / don't track, incognito excluded, delete data

**Milestone 2.3 — Dashboard**
- Today dashboard: time by category, top apps and domains, hourly chart
- Open tabs view + close tab
- Today vs yesterday

## M4 — Desktop companion: Phase 3 *(outline)*
**Milestone 3.1 — Pet engine**
- Sprite renderer (30 FPS cap, stops when hidden)
- Idle and hover animations
- Behaviour state machine

**Milestone 3.2 — Reactions**
- Task created / completed / pending
- App focus (editor, design tool)
- Long-session encouragement, rate-limited

**Milestone 3.3 — Companion**
- Sleep mode
- Startup greeting
- Pet behaviour settings

## M5 — Developer reactions: Phase 4 *(outline; fully offline)*
**Milestone 4.1 — Git**
- Repository watcher on `.git` refs
- Commit and push detection

**Milestone 4.2 — Build**
- Local build monitoring
- Build state in the dashboard

**Milestone 4.3 — Reactions**
- Pet reactions to git and build events
- Build-failure notification
- Suggest a task from a failure

## M6 — MCP: Phase 5 *(outline; the largest post-v1 phase; Calendar lives here)*
**Milestone 5.1 — Foundation**
- MCP client scaffold
- OAuth 2.0 + PKCE, tokens in the OS keychain
- Integration settings and per-integration toggle
- MCP events routed into Loaf events

**Milestone 5.2 — Services (read-only)**
- GitHub
- Gmail (+ action-item extraction)
- Google Calendar
- Slack
- Notion

## M6b — CI status: Phase 5.1 *(outline)*
**Milestone 5.1.1 — CI**
- GitHub Actions status (Jenkins if sizing allows)
- CI pass / fail pet reactions
- CI-failure notification and task suggestion

## M7 — Voice: Phase 6 *(outline)*
**Milestone 6.1 — Capture & intent**
- Activation (button / wake word), no always-on mic
- Audio capture and JEV provider
- Intent parsing

**Milestone 6.2 — Actions**
- Voice → task
- Voice → note
- Voice queries
- Spoken results

**Milestone 6.3 — Meetings**
- Meeting transcription into the transcript field

## M8 — Character customization: Phase 7 *(outline)*
**Milestone 7.1 — Character system**
- Asset pipeline and lazy loading
- Character switching UI

**Milestone 7.2 — Wardrobe**
- Outfits and closet
- Seasonal packs

**Milestone 7.3 — Context**
- App-specific reactions
- Character pack download

