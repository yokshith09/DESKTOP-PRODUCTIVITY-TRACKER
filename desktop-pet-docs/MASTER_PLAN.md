# Loaf — Master plan (phases, milestones, features)

> **Owner's 2026-10-28 list (progress):** phases 1-3 built, all Unverified on a real PC. Phase 1 (notes delete, quick add, calmer task editor, narrow focus timer, right-click menu), phase 2 (fullscreen hiding, Character page tiles, stretch and water reminders, every delete asks first), phase 3 (research, per-character reactions + one special each, alignment checker and our five characters rebuilt through it, `loaf-character` skill: name + picture in, one ZIP out). **Next:** T13 production-readiness audit, trivia is built (first-launch tour + Learn Loaf quiz + roles, 2026-10-28), T15 character design briefs, then the student release (P2). Owner still to test and then say "push" / the next version.

> **Active work (2026-10-23): FM-V2 fix pack + companion features + fixing the pet-visibility bugs (report: `docs/BUG_REPORT_2026-10-23_pet_visibility.md`).** M1-M3 are code-complete (owner: works in v2.0.0).

> **Where we stand (2026-10-27):** P0 and P1 are built (Unverified, waiting for the owner's Windows results); P3 Characters is partly pulled forward (wardrobe, reactions, packs); P2 Student release has not started. Version 0.5.1 is the current draft. Details: `PROJECT_STATUS.md` §3.

> **Planning is closed (owner, 2026-10-22).** From here we only build, top to bottom. New ideas go to DECISIONS.md as one line and wait for the next planning round. Blockers and the ways to unblock them: [`docs/BLOCKERS_AND_OPTIONS.md`](docs/BLOCKERS_AND_OPTIONS.md).

**Date:** 2026-10-22 · **Source version:** 0.2.0 (owner label v2.0.0) · **Positioning:** student-first, local-first desktop pet + productivity.

This is the one page that says **what we build, in what order, and when each thing is done**. Detail lives elsewhere: full 13-point specs in [`docs/features/FR-v2-features.md`](docs/features/FR-v2-features.md) (FR-41…FR-58) and [`docs/features/FR-openpets-parity.md`](docs/features/FR-openpets-parity.md) (FR-59…FR-82, every OpenPets feature) and [`docs/features/`](docs/features/README.md); evidence in [`PROJECT_STATUS.md`](PROJECT_STATUS.md); reasons in [`DECISIONS.md`](DECISIONS.md); competitor in [`docs/competitors/OPENPETS_RESEARCH_2026-10-22.md`](docs/competitors/OPENPETS_RESEARCH_2026-10-22.md).

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
| FR-41 | Messages after add/edit — **above the pet only** (owner 2026-10-23, replaces the toast stack) | "Task saved", "Moved to Bin · click: Undo" as pet bubbles; errors 8 s; after add/edit the user returns to where they were | Every add/edit/delete says so above the pet; nothing pops up in the dashboard; tests for bubble text, pose, Undo by clicking the pet | M | **Built, Unverified** |
| FR-42 | Actionable task↔note links (Q5 confirmed) | "Open note" button on a task; "Linked tasks" list in the note; "Create note from task"; Links section inside Notes (V2-08) | Clicking a link opens the target; both sides show the link | M | **Built, Unverified** |
| FR-43 | Pop-ups above the pet, fixed (Q2) | Notifications and emote bubbles stay above the pet; positioned so they never go off-screen, one at a time, readable | Bubble visible at every screen edge; tests for placement | S | **Built, Unverified**: all messages above the pet; at screen edges the card/bubble takes the side with more room (tested) |
| FR-44 | Time tiles resizable, no empty space | Drag-to-resize with grid snap; tiles grow to fill the row | No gaps at any window size | M | **Built, Unverified** (snapped presets, not drag) |
| FR-45 | Date/time picker | Presets (Today, Tomorrow, This weekend, Next week, In 3 days), month grid, time list | Used in tasks, reminders, meetings | M | **Built, Unverified** (presets + system picker) |
| FR-46 | Auto-delete (Q3) | Per type: Time/activity history and completed tasks; Never / 30 / 90 days / 6 months / 1 year; preview first, goes to Bin | Older data moves to Bin on schedule; notes, meetings, open tasks never touched | M | **Built, Unverified** |
| FR-47 | Remove Logs rows from Settings | UI only, logging stays | Rows gone | XS | **Built, Unverified** |
| FR-48 | Editable pet-window shortcuts, default off | Record new keys, conflict check | Shortcut changes saved and work | S | **Built, Unverified** |
| FR-62 | Browser tabs on the dashboard (Q4) — **already built** (Time tab "Open tabs", `tabs.rs`), hidden unless app + website tracking are both on; remaining work: make it findable | List open tabs of Chrome/Edge/Firefox, click to switch, ✕ to close. **No extension**: Windows UI Automation. Off by default, titles never stored | A 1-day spike works on Windows; else reported back | L | **Built, Unverified** (always on Time; Windows lists the front window only) |
| FR-61 | **Rename links (V2-16, new)** | Edit a link's name (and URL) in place from the Links card and Notes | Rename saved and shown everywhere | S | **Built in the Links card, Unverified** (Notes Links section comes with FR-42) |
| FR-85 | **Daily routine tile + reminder** (owner 2026-10-23) | Checklist that resets daily, progress ring, streaks, "You have N daily routine tasks pending" once a day at a chosen time | Ticks reset; reminder fires once when pending | M | **Built, Unverified** |
| FR-52 | Meeting action items on Today (Q6 yes) | Converted tasks appear on Today with a "from: <meeting>" chip | Chip shown, click opens the meeting | S | **Built, Unverified** |

| FR-106…FR-109 | Task links, stars, chosen days, repeating tasks (owner 2026-10-23) | See `docs/features/FR-106-110-task-upgrades.md` | Built and tested; manual Windows check pending | M | **Built, Unverified** |
| FR-05 + FR-110 | Saved focus sessions; timer above/below the pet; hover card optional, bubble when off; cheer + break offer at the end | Same file | Built and tested; manual Windows check pending | M | **Built, Unverified** |

**Order inside FM-V2:** FR-47 → FR-61 → FR-42 → FR-41 → FR-43 → FR-52 → FR-45 → FR-44 → FR-46 → FR-48 → FR-62 spike.
**Release:** v0.2.1 for owner testing.

---

## P2 — Student release

### FM-ST Student pack (FR-58) + Diary (FR-86) + Now strip (FR-88) + Quiet modes (FR-89)
Specs: `docs/features/FR-84-87-owner-requests.md`; research: `docs/business/MARKET_RESEARCH_2026-10-23.md`.

| Feature | Defined as | Done when |
|---|---|---|
| Course label | Tag notes/tasks with a course; filter by course | Course filter on Notes and Tasks |
| Exam countdown | Exam dates with days-left on Today | Countdown tile |
| Weekly report | Hours studied per course, tasks done | Report screen, exportable |
| Focus linked to a task | Start focus from a task; time logged to it | Task shows focus time |
| Quick capture | One shortcut → new note or task from anywhere | Works while app is in the tray |
| Quiz from notes | Questions generated from notes | **On hold** (AI provider) |

### FM-GUIDE Guide (FR-51) + Role profiles (FR-83)
First run asks Student / Developer / Student who codes / General; each role sets which features start on or off (matrix in [`docs/features/FR-83-role-profiles.md`](docs/features/FR-83-role-profiles.md)); users can switch anything; privacy features off for every role.

Tour of each tab on first run, skippable at any step; Guide page in Settings; credit line "Built by QUORBIT TECHNOLOGIES". Done when a new user can finish or skip the tour and reopen it later.

### M8 Focus & wellbeing (FR-05, FR-69, FR-70)
| ID | Feature | Done when |
|---|---|---|
| FR-05 | Pomodoro focus with the pet reacting; daily/weekly summaries; goals | Session logged to a task; summary screen |
| FR-69 | Calm corner (breathing, grounding, relaxation, meditation, sounds), water reminder, mood check-in, morning/evening routines | Each works offline; only Calm corner on by default |
| FR-70 | Timer and quick reminders from the pet menu, snooze | Fires on time while minimised |
| FR-82 | Flashcards from notes (term : meaning, drag to match), usage buddy | Quiz runs from a note; usage nudge off by default |

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
| Cursor gaze (FR-59) | V2 format: 2 extra rows, 16 look directions | Pet eyes follow the cursor | Planned |
| Import any OpenPets/Codex pack (FR-63) | ZIP/folder/drag-drop, validated, preview, Codex folder scan | A real OpenPets pack runs in Loaf | **Partial, Unverified**: folder import, `~/.codex/pets` scan, preview, use as pet built; ZIP and drag-drop to do |
| Wardrobe with schedules (FR-64) | Outfits incl. graduation cap, pajamas; time/day/date rules | Outfit changes on schedule; loads in OpenPets | Planned |
| Pet gallery (FR-66) | Static catalog on **GitHub Pages** (owner-approved), install with one click, hash-checked | Install works; no request until opened | Planned |
| Export pack | Export the current character (+ outfits) as a pack ZIP | ZIP passes OpenPets validation | Planned |
| Personal photo characters | — | — | **On hold** |

### M6 Reminders & contextual pet (finish) · M13 Character customisation
| ID | Feature | Done when |
|---|---|---|
| FR-65 | Activities: emotes as one-shot animations, in the menu and in packs | All 8 emotes play and export |
| FR-60 | Drag, throw with physics, wander (off by default), multi-monitor | Throw always lands on screen |
| FR-68 | Size presets, Normal/Relaxed pace, "when X play Y" mapping | Applies without restart |
| FR-67 | Up to 3 pets; a pet per Project Space | RAM stays <100 MB |
| FR-71 | Care mode (productivity feeds the pet, no punishment), fortune cookie, magic 8-ball | Off by default |

**Release:** v0.4.0.

---

## P4 — Projects & developers (next after P3)

**In plain words:** make Loaf useful for people who work on projects: a student with a thesis or a developer with a repo. Everything here is opt-in and off by default, so nobody who does not want it sees it.

| Milestone | What you would see | How it is built (short) | Done when |
|---|---|---|---|
| FM-PS (FR-53) Project Spaces | A "Projects" sidebar item appears only when you switch it on. Each project gets its own notes, tasks, links and files in one place. A project can have its own pet (FR-67). | A project is a row that notes, tasks and links point to (the same side-table idea as courses). Files are links to paths on your disk, never copied. | Turn it on, make a project, see only its things; turn it off, nothing is lost. |
| M4 Quick Actions | One keyboard shortcut opens a command bar: new note, new task, search everything, open a saved link. | A small window over the existing search and create commands. No new data. | Shortcut works from any app (Windows tested by you, macOS only in CI). |
| M12 Developer reactions | The pet reacts to a git commit, a local build finishing or failing, CI going red or green. | Watches the project folders you pick (git state), never reads code. CI status needs a token you add yourself; without it that part is off. | Reactions fire on a test repo; nothing is read or sent without your choice. |
| FR-72 Launch Buddy | A saved "launch set" (apps, links, files) opens in one click from the pet, Quick Actions or a Project Space. | A list of things to open, run through the same safe link opener (http, https, mailto) plus app paths you add. | One click opens the whole set; a missing file is reported, not skipped silently. |
| FR-73 System resources | A small badge for CPU, RAM, disk and battery. | Read from the OS on a timer only while visible. | Off by default; no visible slowdown. |

**Order inside P4:** Project Spaces first (everything else hangs off it), then Quick Actions, Launch Buddy, developer reactions, resources badge last.
**Release:** v0.5.0 line (next number is set when we get there). **Needs from you:** nothing before starting; a GitHub token only if you want CI reactions.

---

## P5 — Platform

**In plain words:** reach more people and more situations: Linux, other apps talking to Loaf, your voice, your calendar, your language.

| Milestone | What you would see | Honest risk |
|---|---|---|
| FM-LIN (FR-57) + FR-81 Wayland | Loaf installs on Linux (AppImage and .deb), including the Wayland desktop. | Some pet behaviours (always on top, transparent window) are weaker on Wayland. Stays Unverified until run on real Linux; CI can build it but not judge it. |
| FM-INT (FR-54) local integrations | Other tools on your PC can tell the pet things (status, react, say) over a local-only door. | **On hold:** the shape of this door is an open decision (D-MCP-SHAPE). Never reachable from the network. |
| M9 Voice | Hold a key, speak, and it becomes a task, a note or a search. | Needs a speech engine choice; it must run on your PC, not send audio away. |
| M11 Privacy radar report | A page per site showing the evidence behind the privacy radar flag, exportable. | Builds on the radar already shipped. |
| FR-74 Calendar Airmail | Import an .ics file and get reminders for events; Google and Outlook later. | The online connectors wait for the connector work (M10) and are not local-first, so each needs your explicit opt-in. |
| FR-79 Languages | A language picker. **Hindi and Telugu first**, then the other six. | Every screen's text has to move into translation files; the largest hidden cost of P5. Needs a native reader to check wording. |
| FR-78 LAN mode | The pet walks between your own PCs on the same network. | Last, off by default; it is the only item that opens a network door, so it needs its own privacy review first. |

**Release:** v0.6.0. **Needs from you:** the D-MCP-SHAPE decision, and a Linux machine (or a friend) to test.

---

## P6 — AI (on hold: you pick the provider)

**In plain words:** features that need a language model. Nothing here starts until you choose how the AI runs, because it decides cost and privacy.

| Item | What you would see |
|---|---|
| FR-75 Talk to your pet | Chat or voice with the pet, which can add tasks and notes for you. |
| M5 Writing and prompt helper | Rewrite or tighten text inside a note. |
| M7 Meeting summaries | A summary and suggested actions from meeting notes. |
| Quiz from notes | Questions generated from your own notes (a student pack extra). |
| FR-12 Study companion, FR-16 Error translator | Explain a chapter step by step; turn an error message into plain words. |
| FR-80 AI Pet Studio | Turn a photo or an idea into a new pet pack (also needs the personal-character rules decided first). |

**The decision that unlocks it:** local model (private, free to you, uses your PC's power and about a day of spike work first), or your own key with a provider (better quality, text leaves the PC, you pay). The plan records "we never pay". **Needs from you:** that choice.

---

## P7 — Online (on hold: backend, privacy statement, plugin model, code signing)

**In plain words:** the first features that live outside your PC. This is a big step for a local-first app, so it waits for explicit approval of a privacy statement.

| Item | What you would see | What must be decided first |
|---|---|---|
| FM-BE (FR-56) accounts and uploads | Sign in and upload things you choose to share. | A backend (Supabase is chosen for the website, FR-84) and a written privacy statement. |
| Gallery and community site (FR-84) | A website where people share pet packs. | Moderation rules, and who may upload (likeness of real people is not allowed). |
| FM-PLUG / FR-77 Plugin SDK | Others write add-ons for Loaf. | Which parts a plugin may touch (no database, no network by default). |
| FR-76 Coding-agent MCP | Coding assistants show their progress through the pet. | Depends on FM-INT's shape (P5). |
| FR-97 Friends-only study groups | Share a study recap card with chosen friends; nothing public. | Accounts and privacy statement. |
| Sharing, referrals, leaderboards (FR-04, FR-10, FR-31) | Optional social features. | Only after the above, off by default. |
| Code signing | Windows and macOS stop warning when installing. | You buy the certificates; the build is already prepared for them. |

**Needs from you:** approve backend plus privacy statement, and the certificates.

## Blockers — see docs/BLOCKERS_AND_OPTIONS.md

| Open | Blocks | Recommended way out |
|---|---|---|
| Windows test of v2.0.0 | P0 → Complete | Owner runs RELEASE_0.2.0_TEST.md |
| AI runtime | P6 | Local (llama.cpp sidecar + small Apache model, Ollama if present) + BYOK; we never pay; 1-day spike |
| Code signing | installers | **Open source (decided)** → apply to SignPath Foundation once the repo is public |
| Backend | P7 only | Closed for now (owner) |
| Personal-photo characters | FR-80 | "Draw-your-own from parts" first; photos after AI |
| Product name | FR-34 | Owner gives 5-10 names; we check domains/trademarks |
| FR-62 tabs spike | FR-62 | Us, day 1 of build |

Closed 2026-10-22: open source (MIT) · plugins = art packs only · MCP shape approved · gallery on GitHub Pages · Hindi + Telugu first · role profiles (FR-83) · Q1 toast stack · Q2 bubbles above pet stay · Q3 auto-delete Time + completed tasks · Q4 browser tabs on dashboard · Q5 link plan · Q6 meeting tasks on Today · D-SIZE 192×208 (confirmed by OpenPets source) · D-LICENCE CC BY 4.0 · student-first order.

---

## OpenPets parity — every feature they have, where it lands

| OpenPets feature | Loaf ID | Phase |
|---|---|---|
| Sprite packs (V1) | FR-50 | P3 (built, Unverified) |
| Cursor gaze (V2) | FR-59 | P3 |
| Drag/throw, wander, multi-monitor | FR-60 | P3 |
| Import packs, Codex pets, install links | FR-63 | P3 |
| Wardrobe + schedules | FR-64 | P3 |
| Activities | FR-65 | P3 |
| Catalog/gallery | FR-66 | P3 |
| Pet per workspace / agent, multiple pets | FR-67 | P3 |
| Size presets, reaction pace, mapping | FR-68 | P3 |
| Anxiety Aid, Water, Mood, Routines | FR-69 | P2 |
| Simple Timer, Quick Reminders | FR-70 | P2 |
| Virtual Pet, Fortune Cookie, Magic 8-Ball | FR-71 | P3 |
| Launch Buddy | FR-72 | P4 |
| System Resources | FR-73 | P4 |
| Calendar Airmail | FR-74 | P5 |
| Talk to the pet (AI chat/voice) | FR-75 | P6 (on hold) |
| Coding-agent MCP + hooks | FR-76 | P7 (on hold) |
| Plugin SDK | FR-77 | P7 (on hold) |
| LAN mode | FR-78 | P5 (last) |
| 8 languages | FR-79 | P5 |
| AI Pet Studio | FR-80 | P6 (on hold) |
| Wayland | FR-81 | P5 |
| Vocabulary drag & drop, Usage Buddy | FR-82 | P2 |
| Spotify Buddy, Higgsfield Watch | — | Not copied (low value) |

**What Loaf has that OpenPets does not:** notes, tasks, meetings, daily progress, app/website time tracking, privacy radar, student pack, Project Spaces, typing-along pet, hand-drawn built-in characters (5 vs their 1), Tauri (lighter than Electron).

---

## Owner requests 2026-10-23
FR-84 community website + upload server (P7, backend reopened for it, **Supabase** chosen 2026-10-23) · FR-85 daily routine (built) · FR-86 private diary with task pick-up (FM-ST) · FR-87 per-event pet reactions with a feature audit (M6) · FR-88 now strip and FR-89 quiet modes (added from research, P2). Pet art spec + standard prompt: `docs/character/PET_ART_SPEC.md`. GTM: `docs/business/GTM_PLAN.csv`.

### Research rules from social research (2026-10-23, `docs/business/SOCIAL_RESEARCH_2026-10-23.md`)
- **No-guilt rule:** the pet never punishes or sulks at a missed day; streaks are forgiving (FR-90, planned: a missed day pauses, doesn't reset; weekly "best run" view).
- **Earned growth:** pet growth from finished focus sessions and routine ticks, paced per user, first milestone within a day; included in export/import (FR-91, planned, M13).
- **Study hours per subject** moves into the student pack (FR-58) as its headline feature.

---

## Companion principles (owner 2026-10-23) — `docs/features/FR-92-97-companion-principles.md`
Rules for every feature: **no-guilt rule** (FR-92, enforced by a test), **attention ladder** (ambient → glance → card → system notification only for user-set reminders), **notification budget** (FR-96: once per kind per day, ≤4/day, ≥1 h apart, quiet hours).
Built this phase (Unverified): FR-90 forgiving routine "N/7", FR-92 copy check, FR-93 pet age + birthdays, FR-94 hello once a day, FR-96 budget.
Planned: FR-91 earned growth + unlocks (M13), FR-95 full backup incl. pets (M0), FR-97 friends-only study groups and recap card (P7, Supabase).
Study hours: **partly solved** (app/site time + categories built; study hours per subject, timetable and sharing planned in FR-58/FR-97).

---

## 2026-10-23 (afternoon)
- Built (Unverified): Import ZIP for pets (owner's Kayadu pack imports), Settings → Pet notifications (budget and quiet hours adjustable).
- Diagnosed, not fixed: pet-visibility bugs B1-B6 and similar S1-S4 — **next to fix after owner review**.
- Planned: FR-98 festival outfits · FR-99 weekly recap · FR-100 study groups · FR-101 leaderboard visibility Off/Friends/Everyone · FR-102 monthly pet drops · FR-103 photo to pet (`docs/features/FR-98-103-growth-plan.md`).
- Student pack preview (study hours per subject, timetable, friends) published for owner review before building FR-58; redesigned 2026-10-23 night, with a now-strip board (FR-88, spec draft `docs/features/FR-88-now-strip.md`, 4 open questions).
- OS parity: `docs/OS_PARITY.md`.

## 2026-10-23 (evening)
- Fixed (Unverified): pet-visibility bugs B1-B6 + S1.
- Built (Unverified): macOS Arc / Firefox / Safari (opt-in) for website time and open tabs (FR-104).
- Planned: FR-105 real pack animations (`docs/character/ANIMATION_PLAN.md`), FR-106 UI redesign pass (audit with screenshots first).
