# OpenPets parity — feature specifications (FR-59 … FR-82)

> Written 2026-10-22 after the owner asked for **every OpenPets feature** in Loaf. Source of each feature: [`../competitors/OPENPETS_RESEARCH_2026-10-22.md`](../competitors/OPENPETS_RESEARCH_2026-10-22.md) (OpenPetsHQ/openpets 4.1.0 source). Same 13 sections as `FR-v2-features.md`: 1 metadata · 2 story · 3 behaviour · 4 plain language · 5 technical · 6 choices · 7 tasks · 8 tests · 9 edge cases · 10 acceptance · 11 checklist · 12 docs · 13 dependencies/exclusions. **Nothing here is built.** Common **12 Docs** = this spec, MASTER_PLAN, FEATURE_ROADMAP, PROJECT_STATUS, CHANGELOG, DECISIONS, test results.
>
> **Rules that still apply to every feature:** local-first; no browser extension; no GPU; nothing sent off the PC unless the user turns it on; everything that needs a real OS stays Unverified until run on Windows. Features that depend on an on-hold owner decision say so in **13 Deps** and cannot start until it is lifted.

---

## FR-59 — Cursor gaze (pet's eyes follow the mouse)

**1 Metadata** — Group: Companion · Status: Planned · Milestone: FM-CS · Effort: M · OpenPets: V2 atlas rows 9-10.
**2 Story** — As a user I want the pet to look at where my mouse is, so it feels alive.
**3 Behaviour** — When idle, the pet's head and eyes turn toward the cursor in 16 directions (every 22.5°). Within 40 px of the pet it looks straight up at the user. Stops while the pet plays any other animation. Setting "Pet looks at the cursor" (on by default).
**4 Plain language** — The pet watches your mouse.
**5 Technical** — Draw 16 gaze frames per character (head turned, eyes shifted) into atlas rows 9-10 (OpenPets V2, 1536×2288). `pet.json` gets `spriteVersionNumber: 2` and `gazeAnchor {x,y}` (eye centre, 0-1). Pet window reads the cursor position from the shell on mouse-move events only (event-driven, no polling), throttled to 15 Hz, and picks the frame by angle.
**6 Choices** — Draw 16 frames (matches OpenPets, works in their app) vs move pupils in code (only works in Loaf). Chosen: draw frames.
**7 Tasks** — 1 gaze pose with an angle parameter for all 5 characters · 2 rows 9-10 in the exporter, V2 manifest · 3 cursor events from Tauri · 4 angle → frame · 5 setting.
**8 Tests** — T-59-01 unit: angle → frame index for 16 sectors · T-59-02 unit: V2 atlas is 1536×2288 · T-59-03 component: setting off = no gaze · T-59-04 Manual-Win: eyes follow on two monitors.
**9 Edge cases** — Cursor on another monitor; pet hidden; full-screen app; reduced motion (gaze still allowed, no smoothing).
**10 Acceptance** — Eyes point at the cursor in all 16 directions; CPU idle stays <1%.
**11 Checklist** — [ ] art · [ ] export · [ ] events · [ ] setting · [ ] tests
**13 Deps** — FR-50 packs. Excludes: head tracking with a camera.

---

## FR-60 — Drag, throw, wander, multi-monitor

**1 Metadata** — Group: Companion · Status: Planned · Milestone: M6 · Effort: M · OpenPets: `pet-throw-core.ts`, wander.
**2 Story** — As a user I want to pick the pet up, throw it, and have it walk around on its own.
**3 Behaviour** — Drag: pet plays `waving` while held. Release with speed: it flies, falls with gravity, bounces once on the taskbar edge, plays `jumping` on landing. Wander (setting, off by default): every 2-5 minutes when idle it walks left or right (`running-left`/`running-right`) a short distance along the bottom of the screen, never over the system tray. Can be dropped onto another monitor.
**4 Plain language** — Grab the pet, toss it, watch it land. Optionally it strolls around.
**5 Technical** — Physics in the pet window (velocity from the last 3 drag samples, gravity 2000 px/s², one bounce, 60 fps only while flying, then stops). Window moves via Tauri `setPosition`. Screen work areas from Tauri monitors API. Wander uses one-shot timers (no polling).
**6 Choices** — Physics in the renderer (simple) vs Rust (more work, no benefit). Chosen: renderer.
**7 Tasks** — 1 drag samples → velocity · 2 flight loop with stop condition · 3 work-area clamp · 4 wander timer + setting · 5 animations mapping.
**8 Tests** — T-60-01 unit: velocity from samples · T-60-02 unit: landing inside work area · T-60-03 unit: wander never targets the tray area · T-60-04 Manual-Win: throw across two monitors.
**9 Edge cases** — Monitor unplugged mid-flight; taskbar on the left/top; DPI differences; Wayland (no throw, drag only — OpenPets has the same limit).
**10 Acceptance** — Throw lands on screen every time; wander off by default; no CPU use when still.
**11 Checklist** — [ ] drag · [ ] throw · [ ] wander · [ ] tests
**13 Deps** — none. Excludes: pet walking across window title bars.

---

## FR-61 — Rename links (V2-16)

**1 Metadata** — Group: Links · Status: Planned · Milestone: FM-V2 · Effort: S · Origin: owner 2026-10-22.
**2 Story** — As a user I want to change a link's name after I added it.
**3 Behaviour** — Each link row in the Links card (and the Notes Links section, FR-42) gets an edit (pencil) button: name and URL become editable in place; Enter saves, Esc cancels. Empty name falls back to the site name.
**4 Plain language** — Click the pencil, type a new name.
**5 Technical** — `useShortcuts` gains `rename(id, name, url)`; settings store update; URL re-validated with `validate_external_url` (core).
**6 Choices** — Inline edit vs dialog: inline (faster).
**7 Tasks** — 1 rename in hook/store · 2 inline editor · 3 validation · 4 tests.
**8 Tests** — T-61-01 component: rename saves · T-61-02 component: Esc cancels · T-61-03 unit: invalid URL refused.
**9 Edge cases** — Duplicate names (allowed); very long names (40 char limit, same as add).
**10 Acceptance** — Rename shows everywhere the link appears.
**11 Checklist** — [ ] hook · [ ] UI · [ ] tests
**13 Deps** — none.

---

## FR-62 — Browser tabs on the dashboard (was FR-49a, owner Q4)

**1 Metadata** — Group: Time · Status: Planned, spike first · Milestone: FM-V2 · Effort: L.
**2 Story** — As a user I want to see the tabs open in my browsers, jump to one, and close ones I do not need, from Loaf's dashboard.
**3 Behaviour** — Tile "Open tabs": grouped by browser window, shows title and site icon letter. Click = bring that browser forward on that tab. ✕ = close the tab. Off by default (Settings → Privacy → "Show browser tabs"). Titles are read live and **never stored**.
**4 Plain language** — Your browser tabs, listed in Loaf; click to open, ✕ to close.
**5 Technical** — No extension (locked). Windows UI Automation (`windows` crate, `IUIAutomation`): find Chrome/Edge/Firefox top-level windows, walk to the tab strip (`TabItem` controls), read `Name`; switch via `SelectionItemPattern.Select` + `SetForegroundWindow`; close via the tab's close button `InvokePattern`. Event-driven: UIA structure-changed events, not polling.
**6 Choices** — UI Automation (no install, fragile when browsers change UI) vs extension (forbidden) vs browser debug port (needs browser flags, unsafe). Chosen: UIA, behind a spike.
**7 Tasks** — 1 **spike (1 day): list tabs of Chrome and Edge on Windows** · 2 core trait `TabSource` · 3 switch/close · 4 tile · 5 setting + privacy text.
**8 Tests** — T-62-01 unit: grouping/ordering with a fake `TabSource` · T-62-02 component: close asks nothing, removes row · T-62-03 Manual-Win: Chrome, Edge, Firefox list/switch/close.
**9 Edge cases** — 200+ tabs; incognito (shown? default: hidden); browser not responding; pinned tabs; tab groups.
**10 Acceptance** — Spike result recorded; if it works, all three actions work on Chrome and Edge.
**11 Checklist** — [ ] spike · [ ] trait · [ ] actions · [ ] tile · [ ] tests
**13 Deps** — none. Excludes: macOS/Linux (separate work), storing history.

---

## FR-63 — Import any OpenPets / Codex pet pack

**1 Metadata** — Group: Companion · Status: Planned · Milestone: FM-CS · Effort: L · OpenPets: install-pet, `openpets://install`.
**2 Story** — As a user I want to use any pet made for OpenPets or Codex in Loaf.
**3 Behaviour** — Character page → "Add pet": choose a ZIP or folder, or drop it on the window. Loaf checks it, shows a preview of every row, then installs it to the app data folder. Also lists pets already found in `~/.codex/pets/`. Optional link handler `loaf://install?url=…` (asks before downloading, 25 MB cap).
**4 Plain language** — Download a pet from anywhere, drop it in, it works.
**5 Technical** — Rust validator in core: `pet.json` required fields; one `spritesheet.webp|svg`; size 1536×1872 (V1) or 1536×2288 (V2); outfits/activities folders exactly match the manifest; ZIP: stored/deflate only, no symlinks, no `..`, atomic extract. SVG sheets rendered as images only (never inline). Renderer plays rows by OpenPets frame counts and durations.
**6 Choices** — Same rules as OpenPets so packs move both ways. Link handler: optional, off until code signing (unsigned apps registering URL schemes look suspicious).
**7 Tasks** — 1 validator + tests with good/bad fixtures · 2 importer · 3 sprite player (frame timing table) · 4 Character page UI · 5 Codex folder scan · 6 link handler (later).
**8 Tests** — T-63-01 unit: valid V1 and V2 accepted · T-63-02 unit: zip-slip, symlink, wrong size rejected · T-63-03 unit: frame timing table matches OpenPets · T-63-04 component: preview shows 9 rows · T-63-05 Manual-Win: import a real OpenPets pack.
**9 Edge cases** — Huge files; corrupt WebP; duplicate id (rename or replace); pack with outfits but no schedule.
**10 Acceptance** — A pack from the OpenPets catalog runs as the Loaf pet; bad packs are refused with a reason.
**11 Checklist** — [ ] validator · [ ] importer · [ ] player · [ ] UI · [ ] tests
**13 Deps** — FR-50. Excludes: running any code from a pack (packs are art only).

---

## FR-64 — Wardrobe: outfits and outfit schedules (replaces FR-49 accessories)

**1 Metadata** — Group: Companion · Status: Planned · Milestone: FM-CS · Effort: L · OpenPets: `docs/wardrobe.md`.
**2 Story** — As a user I want to dress my pet (hat, scarf, glasses, headphones, pajamas) and have outfits change by themselves (pajamas at night, scarf in December).
**3 Behaviour** — Wardrobe panel: grid of outfits for the current pet; click to wear; "Always wear" or "Use schedule". Schedule rules: time range, days of week, date range; first match wins; no match = default. Built-in outfits for our 5 characters: hat, glasses, scarf, bow, headphones, pajamas, graduation cap (student theme).
**4 Plain language** — Dress-up for your pet, and it can change clothes on a timetable.
**5 Technical** — OpenPets `wardrobe` schema: up to 16 outfits `{id, displayName, spritesheetPath: outfits/<id>.webp}`; up to 32 rules `{outfit, when{time{from,to}, days[], dates{from,to}}, enabled}`. Our exporter draws each accessory on top of every frame and writes a full outfit sheet. Schedule check on a one-shot timer set to the next rule boundary (no polling). User choice stored in settings.
**6 Choices** — Full outfit sheets (OpenPets-compatible, bigger files) vs live layered accessories (smaller, Loaf-only). Chosen: full sheets for export, layered drawing internally to generate them.
**7 Tasks** — 1 accessory art per character · 2 outfit sheet export · 3 schedule evaluator · 4 Wardrobe UI · 5 settings.
**8 Tests** — T-64-01 unit: schedule rules incl. past-midnight and new-year wrap · T-64-02 unit: manifest limits (16 outfits, 32 rules, id regex) · T-64-03 component: wear/always/schedule · T-64-04 Manual-Win: outfit changes at the set time.
**9 Edge cases** — Clock change/DST; PC asleep through a boundary (re-check on wake); imported pet with no outfits (panel shows "none").
**10 Acceptance** — Outfits switch by click and by schedule; exported pack's wardrobe loads in OpenPets.
**11 Checklist** — [ ] art · [ ] export · [ ] schedule · [ ] UI · [ ] tests
**13 Deps** — FR-50, FR-63.

---

## FR-65 — Activities: one-shot animations (emotes as packs)

**1 Metadata** — Group: Companion · Status: Planned · Milestone: M6 · Effort: M · OpenPets: `activities`.
**2 Story** — As a user I want my pet's special moves (dance, tantrum, back-turn shake) to play on demand and travel with the pack.
**3 Behaviour** — Right-click pet → Emotes / Activities → pick one; it plays once and returns to idle. Our FR-40 emotes are exported as activities; imported packs' activities appear in the same menu.
**4 Plain language** — Make the pet do a trick.
**5 Technical** — Up to 16 activities: id regex, name ≤40, `activities/<id>.webp` strip of 192×frames × 208, 4-32 frames, 1-12 fps, 1-12 s total, ≤2 MiB each.
**6 Choices** — Map each FR-40 emote 1:1 to an activity.
**7 Tasks** — 1 render emote frames to strips · 2 manifest · 3 menu · 4 player.
**8 Tests** — T-65-01 unit: limits enforced · T-65-02 component: menu lists pack activities · T-65-03 Manual-Win: play each.
**9 Edge cases** — Activity requested while dragging (queue); reduced motion (show first frame only).
**10 Acceptance** — All 8 FR-40 emotes play from the menu and exist in exported packs.
**11 Checklist** — [ ] strips · [ ] menu · [ ] tests
**13 Deps** — FR-40, FR-63.

---

## FR-66 — Pet gallery / catalog (browse and install online pets)

**1 Metadata** — Group: Companion · Status: Planned · Milestone: FM-BE · Effort: L · OpenPets: `catalog.v3.json`, zip.openpets.dev.
**2 Story** — As a user I want to browse many pets and install one with a click.
**3 Behaviour** — Gallery screen: categories, featured, search, preview animation, "Install". Works offline with built-in pets; online list only when the user opens the gallery (one request, no tracking).
**4 Plain language** — A pet shop, free.
**5 Technical** — Static JSON catalog + ZIPs on a static host (e.g. GitHub Pages / releases); same format as OpenPets catalog v3 so we could also read theirs if their licence allows. Install via FR-63 validator. SHA-256 per ZIP in the catalog.
**6 Choices** — Own static catalog (no server, no accounts) vs reading OpenPets' catalog (1000s of pets instantly, but their pets' art rights belong to creators — must check per pet). Proposed: own static catalog first; OpenPets catalog only after a licence check.
**7 Tasks** — 1 catalog schema · 2 hosting · 3 gallery UI · 4 install · 5 hash check.
**8 Tests** — T-66-01 unit: catalog parse, bad hash rejected · T-66-02 component: offline shows built-ins · T-66-03 Manual-Win: install from gallery.
**9 Edge cases** — No internet; host down; catalog too large (paginate).
**10 Acceptance** — Install from the gallery works; no request is made until the gallery is opened.
**11 Checklist** — [ ] schema · [ ] host · [ ] UI · [ ] tests
**13 Deps** — FR-63; owner said gallery YES; hosting choice (owner). Excludes: uploads by users (needs backend, P7).

---

## FR-67 — Pets per workspace and multiple pets

**1 Metadata** — Group: Companion · Status: Planned · Milestone: M13 · Effort: L · OpenPets: per-workspace/agent pets, pool pets.
**2 Story** — As a user I want a different pet per Project Space, or two pets on screen.
**3 Behaviour** — Up to 3 pets at once (setting). Each Project Space (FR-53) can choose its pet; switching space switches pet. Reactions go to the pet of the space where they happened.
**4 Plain language** — Different pets for different projects.
**5 Technical** — One window per pet; pet registry in core; events carry a space id.
**6 Choices** — Max 3 to keep RAM <100 MB.
**7 Tasks** — 1 multi-window pet · 2 space→pet setting · 3 routing.
**8 Tests** — T-67-01 unit: routing · T-67-02 Manual-Win: 3 pets RAM check.
**9 Edge cases** — Space deleted; pets overlapping.
**10 Acceptance** — 3 pets run within the RAM budget.
**11 Checklist** — [ ] windows · [ ] routing · [ ] tests
**13 Deps** — FR-53.

---

## FR-68 — Pet behaviour settings: size presets, reaction pace, reaction mapping

**1 Metadata** — Group: Companion · Status: Planned · Milestone: M6 · Effort: S · OpenPets: size presets, Normal/Relaxed pace, per-reaction row override.
**2 Story** — As a user I want to choose how big the pet is, how lively it is, and which animation it plays for each event.
**3 Behaviour** — Size XS/S/M/L/XL; pace Normal or Relaxed (animations play slower, fewer reactions); table "When … play …" (task done → jumping, error → failed, reminder → waving…), each changeable.
**4 Plain language** — Tune your pet.
**5 Technical** — Settings keys; reaction→row map with defaults matching OpenPets.
**7 Tasks** — 1 settings · 2 mapping table UI · 3 apply.
**8 Tests** — T-68-01 unit: default map · T-68-02 component: override saved.
**10 Acceptance** — Changes apply without restart.
**6/9/11** — Small; no open choices. **13 Deps** — FR-63 player.

---

## FR-69 — Wellbeing tools: breathing, calm-down, water, mood, routines

**1 Metadata** — Group: Wellbeing · Status: Planned · Milestone: M8 · Effort: L · OpenPets: Anxiety Aid Tools, Water Reminder, Mood Check-in, Morning & Evening Routine.
**2 Story** — As a student under exam stress I want quick calming exercises and gentle healthy-habit nudges from my pet.
**3 Behaviour** — (a) **Calm corner**: guided breathing 4-6 and box breathing (pet breathes with you), 5-4-3-2-1 grounding, muscle relaxation, 3-minute meditation, background sounds. (b) **Water reminder** every N minutes in work hours. (c) **Mood check-in** once a day (5 faces + note), weekly mood chart. (d) **Morning/evening routine** checklists. All off by default except Calm corner.
**4 Plain language** — Your pet helps you breathe, drink water and check how you feel.
**5 Technical** — Local only; mood stored in SQLite (new table, retention FR-46); sounds bundled (CC0); one-shot timers.
**6 Choices** — Built-in (not plugins) because plugins are on hold.
**7 Tasks** — 1 calm corner screens + pet sync · 2 water reminder · 3 mood table + chart · 4 routines.
**8 Tests** — T-69-01 unit: breathing timing · T-69-02 unit: reminders respect quiet hours · T-69-03 component: mood saved · T-69-04 Manual-Win: sounds.
**9 Edge cases** — Meetings in progress (no nudges); quiet hours; muted PC.
**10 Acceptance** — Each tool works offline; nothing on by default except Calm corner.
**11 Checklist** — [ ] a · [ ] b · [ ] c · [ ] d · [ ] tests
**13 Deps** — M8. Excludes: medical advice; always says "not a substitute for professional help".

---

## FR-70 — Timer and quick reminders on the pet

**1 Metadata** — Group: Productivity · Status: Planned · Milestone: M8 · Effort: S · OpenPets: Simple Timer, Quick Reminders.
**2 Story** — As a user I want to start a countdown or a "remind me in 10 minutes" straight from the pet.
**3 Behaviour** — Right-click pet → Timer (5/10/25/custom) shows a small countdown badge beside the pet; Quick reminder → text + time; ends with a bubble (FR-43) + sound; Snooze 5 min / Done.
**4 Plain language** — Ask your pet to time things.
**5 Technical** — Reuses reminders service in core; badge in the pet window.
**7 Tasks** — 1 menu · 2 badge · 3 snooze.
**8 Tests** — T-70-01 unit: snooze reschedules · T-70-02 component: badge counts down.
**10 Acceptance** — Fires on time with the app minimised.
**6/9/11** — Edge: PC asleep at fire time (fire on wake, say "late"). **13 Deps** — existing reminders.

---

## FR-71 — Fun pack: virtual-pet care, fortune cookie, magic 8-ball

**1 Metadata** — Group: Companion · Status: Planned · Milestone: M13 · Effort: M · OpenPets: Virtual Pet, Fortune Cookie, Magic 8-Ball.
**2 Story** — As a user I want small playful moments with my pet.
**3 Behaviour** — (a) **Care mode** (off by default): hunger, energy, happiness bars that go up when you finish tasks and focus sessions (productivity feeds the pet — not a guilt machine: bars never hit zero, no death). (b) **Fortune cookie** once a day (study tips and kind messages). (c) **Magic 8-ball**: ask a question, pet answers.
**4 Plain language** — Look after your pet by getting work done; small daily surprises.
**5 Technical** — Local stats; texts bundled.
**6 Choices** — Tie care to productivity (our twist) vs time-based decay (OpenPets). Chosen: productivity, no punishment.
**7 Tasks** — 1 stats model · 2 HUD · 3 texts.
**8 Tests** — T-71-01 unit: stats rise on task done, floor > 0.
**10 Acceptance** — Off by default; never blocks work.
**9/11** — Edge: many tasks at once (cap per day). **13 Deps** — none.

---

## FR-72 — Launch Buddy (open apps, sites and files from the pet)

**1 Metadata** — Group: Productivity · Status: Planned · Milestone: M4 · Effort: M · Merges FR-09 One-Click Workspace Launcher. OpenPets: Launch Buddy.
**2 Story** — As a user I want to open my study set-up (apps, links, files) with one click.
**3 Behaviour** — Saved "launch sets" (e.g. "Physics": PDF, browser link, notes app). Start from the pet menu, Quick Actions, or a Project Space.
**4 Plain language** — One click opens everything you need.
**5 Technical** — Allow-list of paths/URLs chosen by the user; opened via OS shell; nothing launched without a user-created set.
**7 Tasks** — 1 set model · 2 editor · 3 launcher.
**8 Tests** — T-72-01 unit: only listed items launch · T-72-02 Manual-Win.
**10 Acceptance** — A set opens all items.
**6/9/11** — Edge: missing file (skip, report). **13 Deps** — FR-61 links.

---

## FR-73 — System resources badge

**1 Metadata** — Group: Utilities · Status: Planned · Milestone: M12 · Effort: S · OpenPets: System Resources.
**2 Story** — As a developer I want to glance at CPU, RAM, disk and battery near my pet.
**3 Behaviour** — Off by default; small badge next to the pet; pet looks tired above 90% CPU for 1 minute.
**5 Technical** — `sysinfo` crate (MIT), sampled every 5 s **only while the badge is visible**. GPU omitted (no-GPU rule).
**7/8** — T-73-01 unit: threshold logic · T-73-02 Manual-Win: idle CPU of Loaf stays <1% with badge on.
**4/6/9/10/11** — Plain: "how busy your PC is". Acceptance: off by default, budget kept. **13 Deps** — none.

---

## FR-74 — Calendar reminders (Google / Outlook)

**1 Metadata** — Group: Integrations · Status: Planned, **depends on M10 connectors** · Effort: L · OpenPets: Calendar Airmail.
**2 Story** — As a student I want my calendar events to arrive as pet reminders and in Today.
**3 Behaviour** — Connect a calendar (read-only); upcoming events on Today; pet delivers "class in 10 minutes" (a little courier animation).
**5 Technical** — OAuth PKCE, token in OS keychain, read-only scope; or local `.ics` file/URL import as the no-account option.
**6 Choices** — `.ics` first (no account, local-first), OAuth later.
**7/8** — T-74-01 unit: ics parse, recurring events · T-74-02 Manual-Win: Google.
**9/10/11** — Edge: time zones, all-day events. Acceptance: reminders on time. **13 Deps** — M10; network opt-in.

---

## FR-75 — Talk to your pet (AI chat and voice assistant)

**1 Metadata** — Group: AI · Status: **On hold (AI provider)** · Milestone: M5/M9 · Effort: XL · OpenPets: v4 assistant.
**2 Story** — As a user I want to tell my pet "add a task: finish lab report Friday" or "start a 25-minute focus" by typing or speaking.
**3 Behaviour** — Chat box on the pet / push-to-talk key; pet shows listening → thinking → done/failed; it can only do listed actions (add task/note/reminder, start focus, open launch set, search notes); asks before anything that deletes. Editable personality (tone only). History local, 200 messages / 30 days.
**5 Technical** — Provider roles: text, speech-to-text, text-to-speech chosen separately, local first (e.g. Ollama, whisper.cpp, Piper — all open source); typed "capabilities" registry in core.
**6 Choices** — Provider is the owner's on-hold decision.
**7/8** — Tasks and tests written when the hold lifts; capability registry can be built earlier (used by Quick Actions).
**9/10/11** — Edge: no mic, wrong transcription (always confirm before saving). **13 Deps** — AI provider; M9 voice.

---

## FR-76 — Coding-agent integration (Claude Code, Cursor, …)

**1 Metadata** — Group: Developers · Status: **On hold (D-MCP-SHAPE)** · Milestone: M12/FM-INT · Effort: L · OpenPets: MCP `status/react/say`, hooks, per-session pets.
**2 Story** — As a developer I want my pet to show what my coding agent is doing (thinking, editing, tests failed, done).
**3 Behaviour** — Agent events map to rows: thinking→review, editing/running→running, testing/waiting→waiting, success→jumping, error→failed; short safe bubbles ("Tests passed"). One pet per agent session (FR-67).
**5 Technical** — Local MCP server (stdio), tools `loaf_status`, `loaf_react`, `loaf_say` (refuses code, paths, URLs, secrets, multi-line); hook installers for Claude Code, Cursor, OpenCode. Local socket with per-run token.
**6/7/8** — Written in full when D-MCP-SHAPE is lifted; OpenPets is the reference design.
**13 Deps** — FR-54, D-MCP-SHAPE.

---

## FR-77 — Plugin SDK (sandboxed plugins)

**1 Metadata** — Group: Platform · Status: **On hold (D-PLUGIN-MODEL, code signing)** · Milestone: FM-PLUG · Effort: XL · OpenPets: SDK v3. Extends FR-55.
**3 Behaviour** — Plugins add menus, small panels, bubbles, timers; permissions shown at install; network only to declared hosts; app draws plugin UI (no raw HTML).
**5 Technical** — Reference: OpenPets sandbox (separate process, declared permissions, host-rendered UI, keys never given to plugins).
**13 Deps** — owner holds. Until then FR-69…FR-73 are built in, not plugins.

---

## FR-78 — LAN mode (one pet walks between your PCs)

**1 Metadata** — Group: Companion · Status: Planned, **last** · Milestone: P5 · Effort: L · OpenPets: experimental LAN mode.
**3 Behaviour** — Off by default; pair two PCs with a code; drag the pet to the screen edge and it appears on the other PC.
**5 Technical** — Local network only, token pairing, no internet.
**6 Choices** — Low value for students; placed last. **13 Deps** — FR-60.

---

## FR-79 — Languages (8)

**1 Metadata** — Group: Shell · Status: Planned · Milestone: P5 · Effort: L · OpenPets: en, es-419, fr, ja, ko, pt-BR, zh-Hans, zh-Hant.
**3 Behaviour** — Language picker in Settings; follows the OS by default.
**5 Technical** — i18n library (e.g. i18next, MIT); all strings extracted; dates via `Intl`.
**7/8** — 1 extract strings · 2 picker · 3 translations · T-79-01 unit: no missing keys.
**6 Choices** — Owner to pick the first extra languages (suggest Hindi + Telugu for the home market, then the OpenPets 8). **13 Deps** — none.

---

## FR-80 — AI Pet Studio (make a pet from a photo or an idea)

**1 Metadata** — Group: Companion · Status: **On hold (AI provider, personal characters)** · Milestone: FM-CS later · Effort: XL · OpenPets: web Studio.
**3 Behaviour** — Describe or upload → generated character in our style → all 9 rows + outfits → preview → save as pack.
**5 Technical** — Needs an image model; no GPU rule means cloud only; personal photos → privacy review.
**13 Deps** — both holds.

---

## FR-81 — Linux Wayland support

Part of FR-57. Drag uses native window move (no throw on Wayland, same as OpenPets); secrets via KDE/GNOME keyring. Unverified until run on Linux.

---

## FR-82 — Study fun: vocabulary drag & drop, usage buddy

**1 Metadata** — Group: Students · Status: Planned · Milestone: FM-ST · Effort: M · OpenPets community: Vocabulary Drag & Drop, Usage Buddy.
**3 Behaviour** — (a) **Flashcards from notes** (manual, no AI): mark lines in a note as term : meaning; pet quizzes you with drag-to-match. (b) **Usage buddy**: pet comments gently on long app sessions using our existing time data ("2 h on YouTube — break?"), off by default.
**8 Tests** — T-82-01 unit: term:meaning parsing · T-82-02 unit: usage thresholds.
**13 Deps** — notes, M3 time data. Excludes: AI quiz (FR-58, on hold).

---

### Not copied, on purpose
- Spotify Buddy, Higgsfield Watch (third-party, low value for students).
- OpenPets' unsigned-on-Mac distribution and Electron (we stay on Tauri: smaller, lower RAM).
