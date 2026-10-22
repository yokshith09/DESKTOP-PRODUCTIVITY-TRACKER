# Emote and Reactions System — feature specifications (FR-40)

> **Status: Planned. Nothing here is built.** No code, no assets, no dependencies were added. Written 2026-10-22 from a read of `src/features/shell/Bear.tsx`, `src/pet/PetApp.tsx`, `src/pet/reactions.ts` and `src-tauri/src/pet.rs`. Owner decisions (2026-10-22) that shape this file are in [DECISIONS.md](../../DECISIONS.md). Character format and player: [CHARACTER_FEATURE_SPECS.md](CHARACTER_FEATURE_SPECS.md) (CH-01, CH-02). Feasibility: [CHARACTER_PIPELINE_RESEARCH.md](../archive/CHARACTER_PIPELINE_RESEARCH.md) §14.

**Hierarchy:** Project goal → Phase → Milestone → Feature → Implementation tasks → Tests → Acceptance criteria.

- **Project goal:** an expressive, local-first desktop companion that the user controls.
- **Phase:** Companion (FEATURE_ROADMAP phase D).
- **Milestone:** **FM-8b Emotes** (proposed, after FM-8 characters; needs owner approval, D-EMOTE-ORDER).
- **Content rule:** playful, non-explicit cartoon motion only. Nothing sexualised; "butt shake" means a cartoon wiggle of a clothed or furry character, no nudity, no zoom on body parts. A character may mark an emote `blocked` in its manifest.

## 0. Uncomfortable truths first

1. **[Certain]** The current bear (`Bear.tsx`) is a front-facing SVG with 13 poses. It has no back, profile or three-quarter view. `back_turn_shake` **cannot** be played by it, and faking it with a CSS flip would show the front of the bear mirrored, not its back.
2. **[Certain]** Only 1 of the 8 emotes needs a new viewpoint. The other 7 can be built from the front view with transforms (squash, hop, spin as a scale-X flip, shake) but spins will look flat without extra frames.
3. **[Likely]** The emote engine is small (a state machine over what `PetApp.tsx` already does). The cost is **art**, not code: 8 emotes × 3 characters × 6–24 frames each.
4. **[Certain]** Contextual reactions to "focus session complete" depend on FR-05 Focus, which is Planned and not built. They cannot ship before it.
5. **[Guessing]** "Milestones" is not defined anywhere in the docs. See open decision D-EMOTE-MILESTONE.

## 1. System features

### EM-01 Emote registry
- **User story:** As an owner of a pet I want a list of emotes, each with a name, so I can play and manage them.
- **Behaviour:** `emotes.json` (built-in) lists entries. Each: `id` (snake_case, stable), `label`, `category` (dance / mood / action), `duration_ms` (min, typical, max), `loop` (false for all eight), `interruptible` (true), `triggers` (`manual`, `double_click`, `random`, `contextual`), `requires` (list of pose tags, e.g. `back`, `three_quarter`), `fallback` (an emote id, a pose, or `none`), `intensity` (1–3), `blocked` (character can refuse).
- **Character compatibility:** a character package (CH-01) lists the emotes it implements under `emotes`. The registry resolves "available" = in the character's manifest AND all `requires` present in its `pose_map`. Else **unavailable** (menu entry hidden or disabled with a reason, never faked).
- **IDs (reserved):** `back_turn_shake`, `chaotic_dance`, `tiny_tantrum`, `moonwalk_escape`, `dramatic_crying`, `smug_taunt`, `instant_sleep`, `over_the_top_celebration`.
- **Dependencies:** CH-01 manifest extension (`emotes` map, `pose_tags`), CH-02 player.
- **Tasks:** (1) schema for registry entry; (2) JSON Schema + validator in `loaf-core` (reuse CH-07); (3) loader that resolves availability per character; (4) generated TS type via `pnpm gen:types`; (5) docs in CH-01.
- **Tests:** unknown id rejected; duplicate id rejected; missing asset marks emote unavailable; `requires` unmet → unavailable; manifest with `blocked: true` hides it; schema round-trip.
- **Edge cases:** character removed mid-playback; emote id renamed in a later package version; two packages define the same id.
- **Risks:** registry drift from assets. Mitigation: validator runs on import.
- **Acceptance:** every built-in emote resolves to exactly one of {available, unavailable-with-reason}; zero faked entries.
- **DoD:** unit tests pass; types generated; `pnpm check:core-deps` clean; docs updated.
- **Checklist:** [ ] schema [ ] validator [ ] loader [ ] TS types [ ] tests [ ] docs. **Status: Planned.**

### EM-02 Animation state machine
- **User story:** I want an emote to start cleanly, stop when I ask, and leave the pet exactly as it was.
- **States (existing + new):** `idle`, `sleeping`, `reaction(pose)` (from `reactions.ts`), `dragging`, `emote(id, phase)`, `restoring`. Emote phases: `enter → body → exit`.
- **Rules:** (a) **Start allowed** only from `idle` or `reaction`-with-lower-priority. Not from `dragging`; from `sleeping` only `instant_sleep`-related wake-up (otherwise the pet wakes first, then plays). (b) **Priority:** a real notification (reminder due) > a contextual reaction > manual emote > random emote. Higher priority interrupts lower after a clean exit frame (max 200 ms) or at once if `safe_cut` is set. (c) **Cancel:** click, drag start, Esc on the menu, another emote, a window hide, a setting change. Cancel plays `exit` fast (≤150 ms) or snaps to rest frame, never freezes mid-pose. (d) **Restore:** on entry the player stores `{pose, position, flip, opacity, sleeping}`; on exit or cancel it restores them. Window position never changes during an emote unless the emote declares `moves: true`, and then only within the visible screen bounds and returns to the stored position.
- **Moonwalk Escape** is the only moving emote; it gets a bounds check (see EM-09).
- **Dependencies:** CH-02 state engine, `PetApp.tsx` drag logic, `reactions.ts` queue.
- **Tasks:** (1) define a pure reducer `(state, event) → state` in TS; (2) table of legal transitions; (3) snapshot/restore helper; (4) priority resolver reusing `enqueue(queue, r, max = 3)`; (5) timers cleared on unmount; (6) mock-shell support.
- **Tests (pure, no OS):** every illegal transition rejected; cancel from each phase restores snapshot; priority matrix; timer cleanup; drag during emote; hide window during emote; two start events in 1 ms; reduced motion path.
- **Edge cases:** system sleep/resume mid-emote; display change; pet hidden; app quit; low-battery mode.
- **Risks:** state drift between `reactions.ts` and emotes. Mitigation: one reducer, one queue.
- **Acceptance:** no sequence of events leaves the pet in a state not in the transition table; restore is exact.
- **DoD:** 100% of transition table tested; no new idle CPU (timers only while an emote runs).
- **Checklist:** [ ] reducer [ ] table [ ] snapshot [ ] priority [ ] tests. **Status: Planned.**

### EM-03 Manual playback (right-click Emotes menu)
- **User story:** I right-click the pet, choose Emotes, pick one, and it plays.
- **Behaviour:** the pet's context menu gets an **Emotes** submenu: favourites first, then the rest grouped by category. Unavailable emotes are shown disabled with a one-line reason ("This character has no back view"), or hidden if the user turns on "Hide unavailable". Selecting plays once. Selecting again while playing cancels. Keyboard: arrow keys and Enter; the menu is a Radix menu already used elsewhere.
- **Dependencies:** EM-01, EM-02; existing pet context menu (verify where it lives before building).
- **Tasks:** menu component; availability reason strings; favourites section; a11y labels; e2e via mock shell.
- **Tests:** menu lists exactly the registry; disabled reason shown; click plays; second click cancels; keyboard path; screen-reader names.
- **Edge cases:** menu open when a reaction fires; pet near screen edge (menu clipping); 96 px pet size.
- **Risks:** pet window is small (96–160 px, hover card 300×296); the menu may need a native or separate window. Verify on Windows. **Unverified** until run.
- **Acceptance:** all available emotes can be started and cancelled by mouse and keyboard.
- **DoD:** component tests pass; manual Windows check logged in PROJECT_STATUS §8.
- **Checklist:** [ ] menu [ ] reasons [ ] a11y [ ] tests [ ] Windows check. **Status: Planned.**

### EM-04 Preview in character customisation
- **User story:** While I customise or import a character I want to see every emote it supports before I pick it.
- **Behaviour:** the character studio (FR-01/FR-39) shows a grid of emotes with a play button. Preview runs in the studio panel, not on the desktop pet. Shows frame count, duration, and any **fallback in use** or **missing pose** warning. Previews respect reduced motion (static key frame + "Play anyway" button).
- **Dependencies:** CH-04 library, CH-07 QA tool, EM-01.
- **Tasks:** preview component reusing the CH-02 player; warning list; "Play anyway".
- **Tests:** preview of each state; missing-pose warning; no desktop-pet side effects; reduced-motion default.
- **Acceptance:** preview shows the same frames the pet would show.
- **Checklist:** [ ] component [ ] warnings [ ] tests. **Status: Planned.**

### EM-05 Optional triggers: double-click, random, favourites
- **Double-click (off by default).** `PetApp.tsx` already treats a double-click (`DOUBLE_CLICK_MS = 260`) as an action; check what it does today before changing it. A setting `pet.double_click_action` = `none | open | emote:<id>`. Default stays as today (**to verify**); the emote is opt-in. A drag (≥ `DRAG_PX = 4`) is never a click.
- **Random emote (off by default).** Setting `pet.random_emotes` with a frequency (rare = 1/hour, normal = 1/20 min, lively = 1/5 min), a pool (favourites only / all available), quiet hours, and "not while a fullscreen app or presentation is active" (**Unverified**, OS-dependent). One-shot timer rearmed after each play; no polling.
- **Favourites.** Star an emote in the menu or studio; stored in settings `pet.emote_favorites` (list of ids). Missing ids are ignored, not deleted.
- **Tasks:** three settings keys; settings UI (Companion page); timer service using a single `setTimeout`; tests with a fake clock.
- **Tests:** default off; double-click vs drag; random respects quiet hours; frequency bounds; favourites survive character change; unavailable favourites skipped.
- **Edge cases:** double-click mapped to an unavailable emote → silent fallback to default action.
- **Risks:** random emotes annoy at work. Mitigation: default off, snooze 1 h from the menu, auto-off during focus sessions.
- **Acceptance:** with all three off, behaviour is identical to today (regression test).
- **Checklist:** [ ] settings [ ] UI [ ] timer [ ] tests. **Status: Planned.**

### EM-06 Contextual reactions (off by default)
- **User story:** Optionally the pet celebrates a finished focus session or a milestone.
- **Behaviour:** setting `pet.auto_reactions` = off (default). When on, per-trigger switches: `focus_complete`, `milestone`. Mapping (editable): focus complete → `over_the_top_celebration` (or a smaller reaction), milestone → `chaotic_dance`. Cooldown 10 min; max 3 per day by default; suppressed during meetings/quiet hours and when emotes are disabled.
- **Dependencies:** **FR-05 Focus (Planned, not built)** for `focus_complete`. The existing `reactions.ts` already reacts to task events (`TaskCreated→catch`, done→`cheer`/`party`, `ReminderDue→ring`); those stay as they are and are not emotes.
- **Milestone definition (D-EMOTE-MILESTONE, planned by Claude on the owner's instruction 2026-10-22; owner may still tune the numbers):**
  - **Counted milestones (lifetime, local data only):** the 10th, 50th, 100th and then every 100th task completed; and a 7-day, 30-day streak (a day counts if at least one task was completed).
  - **Not milestones:** a single task (already handled by `cheer`/`party`), tasks created, tasks deleted, anything the user did while the pet was hidden.
  - **Fires once per milestone:** the last celebrated milestone is stored, so a deleted and re-completed task never re-triggers it.
  - **Gates:** `pet.emotes_enabled` on, `pet.auto_reactions` on, `milestone` switch on, not dragging, not in quiet hours; shared cooldown 10 min and 3 per day with `focus_complete`. A milestone that is suppressed is dropped, never queued for later.
  - **Priority:** a milestone replaces the normal `cheer` for that task (one winner), it does not play after it.
  - **Order of reaction size:** 10th → `chaotic_dance` short; 50th/100th/streaks → `over_the_top_celebration`. Mapping editable later in the character studio.
  - **`focus_complete`** is defined here but cannot ship before FR-05 Focus exists.
- **Tasks:** event→emote rule table beside `RULES` in `reactions.ts`; cooldown + daily cap; settings; tests.
- **Tests:** default off; each switch; cooldown; daily cap; suppressed while `dragging`; no reaction when emote unavailable (silently use the existing reaction).
- **Risks:** double-firing with existing `party` pose. Mitigation: one winner by priority.
- **Acceptance:** with auto reactions off no event triggers an emote.
- **Checklist:** [ ] rules [ ] cooldown [ ] settings [ ] tests [ ] Focus integration (blocked on FR-05). **Status: Planned; Blocked for focus_complete.**

### EM-07 Fallback for unsupported animations
- **Order:** (1) the character's own `fallback` for that emote; (2) a registry-level fallback pose (e.g. `back_turn_shake` → none; `dramatic_crying` → `worried`; `over_the_top_celebration` → `party`); (3) nothing: the action is refused with a one-line message ("This character cannot do that").
- **Rule:** a fallback must be an **honest, existing** pose. Mirroring the front to imitate a back view is forbidden. Fallbacks are shown in the studio preview (EM-04).
- **Tests:** each emote with missing frames; missing manifest entry; fallback loop (A→B→A) rejected by the validator.
- **Acceptance:** an unsupported emote never plays a wrong or empty frame, never crashes.
- **Checklist:** [ ] fallback table [ ] validator rule [ ] tests. **Status: Planned.**

### EM-08 Dragging, input and shutdown
- **Dragging:** drag start cancels any emote (restore, then drag). While dragging, emotes are not started. After drop the pet is at its new position and idle.
- **Input:** while an emote plays, click = cancel; hover card is suppressed; keyboard shortcuts unaffected; the pet never steals focus.
- **Shutdown:** on app quit or pet-window close all timers and rAF handles are cleared, state is restored, nothing is written to disk mid-emote except settings. Hidden window → emote cancelled and not resumed.
- **Tests:** drag-during-emote; unmount cleanup (no leaked timers); quit during emote; window hidden/shown; minimise.
- **Acceptance:** no timer survives unmount (checked by a fake-timer test); position restored after Moonwalk.
- **Checklist:** [ ] cancel on drag [ ] cleanup [ ] tests. **Status: Planned.**

### EM-09 Performance
- Budgets from the project: idle CPU < 1 %, RAM < 100 MB, event-driven (no polling).
- **During an emote:** target ≤ 12 fps sprite step, one canvas or one `<img>` swap, no layout thrash. **Idle:** zero timers when no emote runs and random emotes are off.
- **Frames:** budget ≤ 24 frames per emote at 128–256 px; per character ≤ ~8 emotes ≈ 200 frames; compressed PNG/WebP < 4 MB per character (**target, not measured**). Decode lazily on first play, free after 60 s.
- **Moonwalk** moves the window: use one `setPosition` per frame at ≤ 30 Hz or, better, animate inside a larger transparent window (decide by trial; **Unverified** on Windows).
- **Tests:** profiling checklist (manual) + a unit test that no timers exist when idle.
- **Acceptance:** measured CPU during emote < 5 % of one core on the owner's PC, idle unchanged. **Not measured yet.**
- **Checklist:** [ ] budgets [ ] profile on Windows. **Status: Planned.**

### EM-10 Accessibility, reduced motion, privacy, disable
- **Reduced motion:** respects OS setting (`prefers-reduced-motion`) as `Bear.tsx` already does. Emotes become a single static key frame for 1.5 s plus the speech bubble, or are skipped (user choice). No flashing: no more than 3 flashes per second. Spin/shake amplitude capped.
- **Disable:** `pet.emotes_enabled` (master, default **on** for manual playback, since the user asks for it). With it off the menu entry is hidden and no trigger can run. Separate switches already listed in EM-05/EM-06.
- **Screen reader:** the menu is labelled; a live-region announces "Playing <label>" and "Stopped"; bubbles have text.
- **Contrast:** bubble text meets the app's contrast target.
- **Privacy:** emote use is **not** logged, counted, synced or sent anywhere. Favourites live only in local settings. The only event data read is what the pet already receives (task/focus events); nothing new is collected.
- **Tests:** reduced-motion path; master switch; no network calls (existing privacy test pattern); a11y names.
- **Acceptance:** with reduced motion on, no animation > 1 s of movement.
- **Checklist:** [ ] reduced motion [ ] switches [ ] a11y [ ] privacy test. **Status: Planned.**

## 2. The eight emotes

Common to all: manual trigger from EM-03; cancellable at any time; restore on exit; hidden/disabled when unsupported; playful cartoon, no explicit content; all **Planned**. Durations are design targets, **not measured**. Frame counts assume 12 fps.

| ID | Label | Typical duration | Frames (target) | Needs | Fallback |
|---|---|---|---|---|---|
| `back_turn_shake` | Back-Turn Shake | 2.5 s | 24–30 | `back`, `three_quarter` poses | none (unavailable) |
| `chaotic_dance` | Chaotic Dance | 4 s (random 3–6) | 36–48 or procedural | front; optional arms layer | `party` |
| `tiny_tantrum` | Tiny Tantrum | 3.5 s | 28–36 | front; optional sit pose | `worried` |
| `moonwalk_escape` | Moonwalk Escape | 3 s | 24–30 | side/three-quarter; window moves | none |
| `dramatic_crying` | Dramatic Crying | 4 s | 30–40 | front; tear overlay | `worried` |
| `smug_taunt` | Smug Taunt | 3 s | 24–30 | front + side walk | `cheer` |
| `instant_sleep` | Instant Sleep | 5 s | 36–48 | front; closed-eye frame | `sleep` |
| `over_the_top_celebration` | Over-the-Top Celebration | 3.5 s | 28–36 | front; jump frames | `party` |

### 2.1 `back_turn_shake` — Back-Turn Shake
- **User story:** I trigger a cheeky little wiggle: the pet turns its back to me and shakes its tail end, then turns back.
- **Behaviour:** stand → bend slightly forward (anticipation) → turn to show its back (three-quarter, then back view) → look over the shoulder → shake the backside side-to-side 3–4 times (playful, cartoon, clothed/furry) → turn back via three-quarter → return smoothly to the stored pose. No zoom, no close-up, fully non-explicit.
- **Requires:** frames for `three_quarter_l/r` and `back`. **The bear now has them (2026-10-22):** `turn` (three-quarter), `back` and `back_look` (back body, head turned over the shoulder), drawn as separate views in `src/features/shell/BearViews.tsx`, not mirrored. Only the right-facing three-quarter exists; left is not drawn. Other characters still have none. Do not mirror the front.
- **Built so far (Unverified on a real PC):** the views, the sequence runner `playEmote` (`src/pet/emotes.ts`: turn, back, look back and shake, back, turn, restore; cancel plays a quick exit; reduced motion shows one static pose), and a preview button on the Character page. Not yet wired to the pet window, the right-click menu, or the registry (FM-8b-0/1).
- **Feasibility:** see research doc §14. Sprite-sheet route needs ~8 new frames per character; Rive route needs a rig with a rotating body (Y-turn is hard in 2D and normally done by swapping art). **Result: unavailable until art exists.**
- **Dependencies:** EM-01, EM-02, CH-01 `pose_tags`, art from CH-03 (new brief: add back + three-quarter turnaround to each built-in character).
- **Tasks:** art brief for turnaround sheet; manifest `requires` tags; availability check; frame set; timing; tests.
- **Tests:** unavailable with front-only character (menu shows reason); no CSS fake; cancel at each phase restores facing; reduced motion; double-click mapping falls back silently.
- **Edge cases:** a user-uploaded photo character (CH-05) has no back view → permanently unavailable; humans (CH-06) likewise.
- **Risks:** art cost; turnaround consistency; content taste. **Acceptance:** plays only with all required poses; otherwise cleanly unavailable; ends exactly in the starting pose.
- **DoD:** feature flag; tests green; art reviewed by owner. **Checklist:** [ ] art brief [ ] frames [ ] manifest [ ] tests [ ] owner review. **Status: In progress for the bear only: art and sequence built and tested in jsdom; owner has not seen it on a real screen, so Unverified. Not wired into the pet window yet.**

### 2.2 `chaotic_dance` — Chaotic Dance
- **User story:** I want a silly burst of random dance.
- **Behaviour:** a sequence of 4–8 random **moves** drawn from a pool (spin, hop, arm wave, hip wiggle, head bob), each 400–700 ms, never the same move twice in a row, seeded RNG so tests are deterministic; ends with a settle pose. Spin = horizontal scale flip pair (honestly a "turn", no back view claimed).
- **Dependencies:** EM-01/02; sprite frames per move or procedural transforms on layers (Rive/CH-08 better).
- **Tests:** seed gives fixed sequence; no repeats back-to-back; total duration within min/max; cancel mid-move restores; reduced motion shows one pose.
- **Risks:** randomness looks broken; flashing. **Acceptance:** 3–6 s, ends at rest. **Checklist:** [ ] move pool [ ] sequencer [ ] tests. **Status: Planned.**

### 2.3 `tiny_tantrum` — Tiny Tantrum
- **Behaviour:** stomp left/right (two bounces), arms crossed, head shake, drop into a dramatic sit, small puff, recover. Bubble optional ("hmph").
- **Needs:** crossed-arms pose and a sit pose (new art; arms are drawn in `Bear.tsx` per pose, so crossed arms is a new variant).
- **Tests:** phases in order; cancel during sit stands up first; fallback `worried`. **Acceptance:** returns to idle pose. **Risks:** clipping at window edge when stomping (keep inside the cell). **Status: Planned.**

### 2.4 `moonwalk_escape` — Moonwalk Escape
- **Behaviour:** slide backwards (feet shuffle, torso upright) → spin → slide back to the starting spot.
- **Needs:** side/three-quarter feet frames; **moves the window** (the only emote that does): stays within the monitor work area; multi-monitor and DPI-scaling handling; returns to the exact stored position.
- **Tests:** bounds clamp at all four edges; returns to origin ±0 px; cancel returns immediately to origin; no move when "reduce motion" or when position is user-locked. **Risks:** window moves are OS-dependent (Unverified on Windows/macOS); jitter. **Acceptance:** back at the stored position within 1 px. **Status: Planned.**

### 2.5 `dramatic_crying` — Dramatic Crying
- **Behaviour:** inhale → exaggerated sobbing (shoulder bounce, tear streams as an overlay) → sniff → recover with a small smile. Tears are a separate overlay so it works on any front-facing character.
- **Content:** comedic, not distressing; no text implying real sadness; user can disable via `blocked`.
- **Tests:** overlay removed on exit; no sticky tear after cancel. **Fallback:** `worried`. **Status: Planned.**

### 2.6 `smug_taunt` — Smug Taunt
- **Behaviour:** confident hands-on-hips pose, wink, short bubble ("heh"), a swaggering walk-away to the side and back.
- **Content rule:** teasing is playful and generic; never insulting text, never aimed at the user by name.
- **Tests:** wink frame; walk stays inside the window cell unless `moves`. **Fallback:** `cheer`. **Status: Planned.**

### 2.7 `instant_sleep` — Instant Sleep
- **Behaviour:** abrupt drop into sleep (head nod), snore bubbles ("zzz") with a short breathing loop, then wake **startled** (jump, wide eyes) and recover.
- **Interaction:** reuses the existing `sleep` pose and the 15-minute idle sleep (`SLEEP_AFTER_MS`); does **not** change that timer; a click wakes it (cancel path).
- **Tests:** snore loop ends after N breaths; cancel wakes; works when pet is already sleeping (no-op with message). **Status: Planned.**

### 2.8 `over_the_top_celebration` — Over-the-Top Celebration
- **Behaviour:** crouch → big jump → mid-air spin → landing → confetti burst → victory pose held 1 s.
- **Related:** existing `party` and `cheer` poses (task done). The emote is a longer, opt-in, bigger version; do not replace the existing reaction.
- **Tests:** confetti particles cleaned up; no leftover particles on cancel; capped particle count (≤ 40). **Status: Planned.**

## 3. Phases and milestones (proposed, all Planned)

| Phase | Milestone | Scope | Gate |
|---|---|---|---|
| D1 | FM-8b-0 | EM-01 registry + EM-02 state machine (pure logic, tests only) | tests green |
| D1 | FM-8b-1 | EM-03 menu + EM-10 settings + 3 simple front-view emotes (`instant_sleep`, `over_the_top_celebration`, `dramatic_crying`) | owner Windows check |
| D2 | FM-8b-2 | `chaotic_dance`, `tiny_tantrum`, `smug_taunt` | owner review |
| D2 | FM-8b-3 | EM-05 triggers (double-click, random, favourites) | regression: off = unchanged |
| D3 | FM-8b-4 | `moonwalk_escape` (window move) | Windows + multi-monitor check |
| D3 | FM-8b-5 | `back_turn_shake` (**needs turnaround art**) | owner art approval |
| D4 | FM-8b-6 | EM-06 contextual reactions (**needs FR-05 Focus**) | Focus shipped |

Dependencies: CH-01/CH-02 (format, player) before FM-8b-1; CH-03 art for any real frames; CH-08 Rive trial result before choosing the production renderer for `chaotic_dance` and `back_turn_shake`.

## 4. Test and risk summary
- **Pure logic (no OS):** reducer, registry, priority, cooldowns, fallback resolution, seeded random.
- **UI (mock shell):** menu, studio preview, settings.
- **Needs a real PC, mark Unverified until run:** window movement, multi-monitor, fullscreen detection, performance numbers, always-on-top interaction.
- **Top risks:** (1) art volume; (2) back/three-quarter art missing; (3) Moonwalk window motion on real OSes; (4) irritation from random/auto reactions (defaults off); (5) double-click collisions with existing behaviour; (6) renderer choice not yet decided (CH-08).

## 5. Open decisions
Decisions of 2026-10-22 (owner):
- **D-EMOTE-ORDER: closed.** FM-8b order in §3 approved.
- **D-EMOTE-MASTER: closed.** `pet.emotes_enabled` defaults **on**. How a character looks, behaves and what it can do will be designed later in the character studio.
- **D-EMOTE-DOUBLECLICK: closed.** Keep today's behaviour: double-click hides the main window (`pet_double_click` → `hide_main`). Remapping is not planned.
- **D-EMOTE-MILESTONE: closed.** Defined in EM-06 (Claude's plan; numbers tunable).
- **D-EMOTE-ART: partly closed.** Bear back and three-quarter views built. The other two built-in characters still need them; a personal photo character never will.
- Detailed per-feature docs wait until the character system is consistent and final (owner).

## Addendum 2026-10-22: back-turn shake coverage

Built (Unverified on a real PC): drawn `turn`, `back` and `back_look` views for the bear and for Mochi, Pip, Bolt and Ghosty, played by the same `BACK_TURN_SHAKE` sequence. Personal-photo characters (CH-05, CH-06) are excluded by owner decision: `back_turn_shake` is not offered for them. Not yet wired to the pet window, the right-click Emotes menu or the registry (FM-8b-0/1).
