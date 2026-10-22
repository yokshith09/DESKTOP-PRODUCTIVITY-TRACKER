# Loaf — Master plan (phases, milestones, features)

**Date:** 2026-10-22 · **Source version:** 0.2.0 (owner label v2.0.0) · **Positioning:** student-first, local-first desktop pet + productivity.

This is the one page that says **what we build, in what order, and when each thing is done**. Detail lives elsewhere: full 13-point specs in [`docs/features/FR-v2-features.md`](docs/features/FR-v2-features.md) (FR-41+) and [`docs/features/`](docs/features/README.md); evidence in [`PROJECT_STATUS.md`](PROJECT_STATUS.md); reasons in [`DECISIONS.md`](DECISIONS.md); competitor in [`docs/competitors/OPENPETS_RESEARCH_2026-10-22.md`](docs/competitors/OPENPETS_RESEARCH_2026-10-22.md).

**Status words:** Complete (run on a real OS) · Unverified (built, tests pass, nobody ran it on a real OS) · Partial · Planned · On hold (owner) · Blocked (needs something outside the code).

**Rule:** one milestone at a time, top to bottom. Nothing is "Complete" until the owner runs it on Windows.

---

## Phase overview

| Phase | Goal | Milestones | Ends when |
|---|---|---|---|
| **P0 Foundation** (done in code) | Notes, tasks, meetings, pet, time tracking work | M0, M1, M2, M3 | Owner's Windows test of v2.0.0 recorded |
| **P1 Fix & polish** | Everything the owner reported in V2 works | FM-V2 | All 16 V2 issues closed and run on Windows |
| **P2 Student release** | A student can plan, study and track a semester | FM-ST, FM-GUIDE, M8 | Student pack + guide + focus shipped as v0.3.0 |
| **P3 Characters** | Pets look alive, customisable, compatible with OpenPets packs | FM-CS, M6, M13 | Studio + packs + accessories + emotes shipped as v0.4.0 |
| **P4 Projects & developers** | Students and developers organise project work | FM-PS, M4, M12 | Project Spaces + Quick Actions + developer reactions, v0.5.0 |
| **P5 Platform** | Reach: Linux, local integrations, voice, privacy report | FM-LIN, FM-INT, M9, M11 | v0.6.0 on Windows + Linux |
| **P6 AI** (on hold) | Writing help, meeting summaries, quiz from notes | M5, M7 | Owner picks an AI provider |
| **P7 Online** (on hold) | Gallery, plugins, sharing | FM-BE, FM-PLUG | Owner approves backend + privacy statement; code signing |

---

## P0 — Foundation (M0-M3) — code done, waiting for the owner's Windows test

| ID | Feature | Status |
|---|---|---|
| M0 | Foundation: autostart, export/import/delete, performance harness | Partial |
| M1 | Notes, tasks, search, labels, dates, daily progress | Unverified (owner: works in V2) |
| M2 | Meetings, pet window, global shortcuts, settings, first run | Unverified (owner: works in V2) |
| M3 | App and website time, privacy panel (option d) | Unverified |

**Owner action:** run the v2.0.0 checklist on Windows and send results. This turns P0 Complete.

---

## P1 — Fix & polish: **FM-V2** (ACTIVE NEXT)

| ID | Feature | Defined as | Done when | Size | Status |
|---|---|---|---|---|---|
| FR-41 | Toast stack (Q1) | Small cards bottom-right: "Task saved · Undo", auto-dismiss 5 s, max 3 stacked; after add/edit the user returns to Today | Every add/edit/delete shows one toast; tests for stack, dismiss, undo | M | Planned |
| FR-42 | Actionable task↔note links (Q5 confirmed) | "Open note" button on a task; "Linked tasks" list in the note; "Create note from task"; Links section inside Notes (V2-08) | Clicking a link opens the target; both sides show the link | M | Planned |
| FR-43 | Pop-ups above the pet, fixed (Q2) | Notifications and emote bubbles stay above the pet; positioned so they never go off-screen, one at a time, readable | Bubble visible at every screen edge; tests for placement | S | Planned |
| FR-44 | Time tiles resizable, no empty space | Drag-to-resize with grid snap; tiles grow to fill the row | No gaps at any window size | M | Planned |
| FR-45 | Date/time picker | Presets (Today, Tomorrow, This weekend, Next week, In 3 days), month grid, time list | Used in tasks, reminders, meetings | M | Planned |
| FR-46 | Auto-delete (Q3) | Per type: Time/activity history and completed tasks; Never / 30 / 90 days / 6 months / 1 year; preview first, goes to Bin | Older data moves to Bin on schedule; notes, meetings, open tasks never touched | M | Planned |
| FR-47 | Remove Logs rows from Settings | UI only, logging stays | Rows gone | XS | Planned |
| FR-48 | Editable pet-window shortcuts, default off | Record new keys, conflict check | Shortcut changes saved and work | S | Planned |
| FR-49a | Browser tabs on the dashboard (Q4) | List open tabs of Chrome/Edge/Firefox, click to switch, ✕ to close. **No extension**: Windows UI Automation. Off by default, titles never stored | A 1-day spike works on Windows; else reported back | L | Planned, **spike first** |
| FR-61 | **Rename links (V2-16, new)** | Edit a link's name (and URL) in place from the Links card and Notes | Rename saved and shown everywhere | S | Planned |
| FR-52 | Meeting action items on Today (Q6 yes) | Converted tasks appear on Today with a "from: <meeting>" chip | Chip shown, click opens the meeting | S | Planned |

**Order inside FM-V2:** FR-47 → FR-61 → FR-42 → FR-41 → FR-43 → FR-52 → FR-45 → FR-44 → FR-46 → FR-48 → FR-49a spike.
**Release:** v0.2.1 for owner testing.

---

## P2 — Student release

### FM-ST Student pack (FR-58)
| Feature | Defined as | Done when |
|---|---|---|
| Course label | Tag notes/tasks with a course; filter by course | Course filter on Notes and Tasks |
| Exam countdown | Exam dates with days-left on Today | Countdown tile |
| Weekly report | Hours studied per course, tasks done | Report screen, exportable |
| Focus linked to a task | Start focus from a task; time logged to it | Task shows focus time |
| Quick capture | One shortcut → new note or task from anywhere | Works while app is in the tray |
| Quiz from notes | Questions generated from notes | **On hold** (AI provider) |

### FM-GUIDE Guide (FR-51)
Tour of each tab on first run, skippable at any step; Guide page in Settings; credit line "Built by QUORBIT TECHNOLOGIES". Done when a new user can finish or skip the tour and reopen it later.

### M8 Focus & wellbeing (FR-05)
Pomodoro timer with the pet reacting; daily/weekly summaries; goals. Borrowed ideas from OpenPets plugins: breathing break, water reminder, mood check-in (all off by default).

**Release:** v0.3.0.

---

## P3 — Characters

### FM-CS Character Studio & sprite packs (FR-49, FR-50, FR-59)
| Feature | Defined as | Done when | Status |
|---|---|---|---|
| Sprite packs (FR-50) | OpenPets/Codex V1 format: `pet.json` + `spritesheet.webp`, 8×9 cells of 192×208, rows idle…review | 5 packs load in OpenPet/OpenPets on Windows | **Built, Unverified** (all rows drawn) |
| Pack import | Import any Codex/OpenPets pack (ZIP or folder), validate, preview | A downloaded pack runs as the Loaf pet | Planned |
| Studio preview | Row picker plays each row at its real timing | All 9 rows play | Planned |
| Accessories as **wardrobe outfits** (FR-49) | Hat, glasses, scarf, bow, headphones drawn per character; saved as OpenPets `wardrobe` outfits with optional schedule (e.g. scarf in winter) | Outfit switches live and by schedule | Planned |
| Cursor gaze (FR-59, new) | V2 format: 2 extra rows, 16 look directions | Pet eyes follow the cursor | Planned |
| Export pack | Export the current character (+ outfits) as a pack ZIP | ZIP passes OpenPets validation | Planned |
| Personal photo characters | — | — | **On hold** |

### M6 Reminders & contextual pet (finish) · M13 Character customisation
Emotes (FR-40) exported as OpenPets **activities**; drag-and-throw and wander (FR-60, new); quiet hours.

**Release:** v0.4.0.

---

## P4 — Projects & developers

| Milestone | Contents |
|---|---|
| FM-PS (FR-53) | Project Spaces, opt-in, off by default: notes, tasks, links, files per project; sidebar item appears when on |
| M4 Quick Actions | Keyboard command centre: new note/task, search, open link |
| M12 Developer reactions | Pet reacts to git commits, local builds, CI status |

**Release:** v0.5.0.

---

## P5 — Platform

| Milestone | Contents | Notes |
|---|---|---|
| FM-LIN (FR-57) | Linux AppImage and .deb | Unverified until run on Linux |
| FM-INT (FR-54) | Local MCP server | **Shape on hold** (D-MCP-SHAPE); OpenPets' status/react/say is the reference |
| M9 Voice | Push-to-talk → task/note/search | STT engine choice later |
| M11 Privacy radar report | Per-site evidence report | — |

**Release:** v0.6.0.

---

## P6 — AI (on hold: AI provider)
M5 writing & prompt assistant · M7 meeting summaries and suggested actions · quiz from notes · Study companion (FR-12) · error translator (FR-16).

## P7 — Online (on hold: backend + privacy statement, plugin model, code signing)
FM-BE gallery (FR-56) · FM-PLUG plugins (FR-55) · sharing, referrals, leaderboards (FR-04, FR-10, FR-31).

---

## Decisions — all answered except these

| Open | Blocks | Who |
|---|---|---|
| Windows test results for v2.0.0 | P0 → Complete | Owner |
| FR-49a spike result | Browser tabs feature | Us (spike), then owner |
| AI provider | P6 | Owner (on hold) |
| D-MCP-SHAPE, D-PLUGIN-MODEL | FM-INT, FM-PLUG | Owner (on hold) |
| Backend + privacy statement | P7 | Owner (later) |
| Code signing | Installers, plugins | Owner (on hold) |
| Personal-photo characters | FM-CS extra | Owner (on hold) |
| Product name | Website (FR-34) | Owner |

Closed 2026-10-22: Q1 toast stack · Q2 bubbles above pet stay · Q3 auto-delete Time + completed tasks · Q4 browser tabs on dashboard · Q5 link plan · Q6 meeting tasks on Today · D-SIZE 192×208 (confirmed by OpenPets source) · D-LICENCE CC BY 4.0 · student-first order.
