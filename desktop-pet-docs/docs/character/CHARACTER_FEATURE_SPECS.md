# Character system — detailed feature specifications

**Parent:** FR-39 in [`FEATURE_ROADMAP.md`](../../FEATURE_ROADMAP.md) · **Research:** [`CHARACTER_PIPELINE_RESEARCH.md`](CHARACTER_PIPELINE_RESEARCH.md) · **Status of all specs below:** **Planned** (no code written). **Date:** 2026-10-22.

**Owner decisions these specs rely on (2026-10-21):** personal photo upload is **allowed** (with consent and local processing); the package format is **approved as a starting point** and will be found by trial and error; a **Rive trial** on one character goes ahead; the owner supplies **reference images** and Claude designs the built-in characters; **open-source tools are preferred**; external tool licences may be open-source, checked version by version.

**Tags:** [Fact] seen in code or a source this session could read · [Inference] reasoned, not tested · [Assumption] must be checked before we rely on it · [Decision] owner-approved · [Open] needs a decision.

**Spec sections (per the owner's standard):** 1 metadata · 2 user story · 3 behaviour · 4 plain summary · 5 technical design · 6 choices · 7 ordered tasks · 8 tests · 9 edge cases · 10 acceptance · 11 checklist · 12 doc updates · 13 dependencies/exclusions.

| ID | Feature | Phase |
|---|---|---|
| CH-01 | Character package format (`loaf-character`) | A |
| CH-02 | Sprite player and state engine in the pet window | A |
| CH-03 | Built-in character set (three characters) | A |
| CH-04 | Character library and selection (appearance, FR-01) | B |
| CH-05 | Personal character from one photo (upload → preview → save) | B |
| CH-06 | Personal human character (face-aware motion) | C |
| CH-07 | Character QA and validation tool | A |
| CH-08 | Rive trial (one character) | A (time-boxed) |

Phase A = prototype (built-in only). Phase B = personal characters that need no generative model. Phase C = face-aware and generative options, each behind an opt-in. Local features before cloud/AI (owner, 2026-10-21).

---

## CH-01 — Character package format (`loaf-character`)

**1 Metadata** — Group: Companion · Status: **Planned** · Milestone: FM-8 · Effort: M · Decision: format approved as starting point, trial-and-error [Decision] · Origin: owner request (FR-39) · Evidence: no format exists in code (research §1.1).

**2 User story** — As a user, I want a character to be a single self-contained package that the app can check, install and remove without knowing which tool made the art.

**3 Behaviour** — A package is a folder or a `.loafpack` zip with `manifest.json`, PNG frames and a licence file. The app validates it before installing. Invalid packages are refused with the reason. A valid package appears in the character library (CH-04).

**4 Plain summary** — A character is a folder of pictures plus a short description of what each action looks like. Any tool can make one.

**5 Technical design** — Manifest `schema_version = 1` (see research §6 for the fields). Parsing and validation live in `loaf-core` (no Tauri dependency, per `pnpm check:core-deps`). The shell unpacks zips with path checks and size limits. Frames are RGBA PNG with identical dimensions per package. Files are checked with SHA-256 from the manifest.

**6 Choices and trade-offs** — *Frames as PNG* (simple, debuggable, larger files) versus *one atlas per package* (fewer files, harder to edit). Chosen: per-state folders for trial and error; an atlas can be added later as an optimisation without changing the manifest's meaning. *JSON manifest* versus *TOML*: JSON, because the webview reads it directly. *Trial and error* means `schema_version` stays `1` only while we iterate inside the prototype; it becomes stable at the end of Phase A.

**7 Ordered tasks**
1. Write the manifest schema as a Rust type with `serde` and export it with `pnpm gen:types` (only if the UI reads it).
2. Implement validation: required files, `idle` present with ≥ 8 frames, identical frame sizes, checksum, no path escapes, size limits.
3. Write fixtures: one valid package, one per refusal reason.
4. Unpack zips safely in the shell (no absolute paths, no `..`, no symlinks, total size cap).
5. Document the manifest in the research doc and a changelog line.

**8 Tests**
- T-CH01-01 · Unit · valid package parses · `cargo test --workspace` · missing
- T-CH01-02 · Unit · each refusal reason has its own test (missing file, bad checksum, size mismatch, missing `idle`, unknown major version, traversal path, symlink) · `cargo test` · missing
- T-CH01-03 · Unit · zip with `../` entry is refused without writing outside the target folder · `cargo test` · missing
- T-CH01-04 · Property · random manifest fields never panic the parser · `cargo test` (proptest, MIT/Apache-2.0 crate — to verify) · missing

**9 Edge cases** — Frames with alpha only in the border; a `frames` list that names a file twice; an `fps` of 0; a 200 MB zip bomb (compression ratio check); Windows path separators inside the zip; a package whose id matches an installed one.

**10 Acceptance** — All refusal reasons have tests and readable messages. A traversal zip never writes outside the install folder (test with a temporary directory). Parser never panics on fuzz input (property test passes with ≥ 10 000 cases; count recorded). Docs updated in the same change.

**11 Checklist** — [ ] manifest type [ ] validator [ ] fixtures [ ] safe unzip [ ] T-CH01-01…04 run and results recorded [ ] docs updated.

**12 Doc updates** — This spec; FR-39 row in `FEATURE_ROADMAP.md`; research §6; `DECISIONS.md` if the schema changes; `CHANGELOG.md` (Unreleased); `PROJECT_STATUS.md` test counts.

**13 Dependencies / exclusions** — Depends on: nothing built yet; uses `serde`, `serde_json`, a zip reader (crate to verify, MIT/Apache-2.0 expected), `sha2`. Excludes: image generation, cloud upload, online sharing (FR-31).

---

## CH-02 — Sprite player and state engine

**1 Metadata** — Group: Companion · Status: **Planned** · Milestone: FM-8 · Effort: M–L · Decision: none beyond owner's approval of format · Origin: owner request · Evidence: current renderer is `src/features/shell/Bear.tsx` (SVG + CSS, 13 poses; research §1.1).

**2 User story** — As a user, I want my character to breathe, blink, sleep, react to clicks and show focus, using the same behaviour I already see with the bear.

**3 Behaviour** — The pet window plays the states in research §5 (idle + blink, sleep, happy, click reaction, focus, worried). Reactions interrupt looping states; sleep wakes on click or activity. Reactions queue up to 3. A missing optional state uses its fallback. The sprite is paused when the pet is hidden or minimised. If the sprite fails, the built-in SVG bear is shown and the error is logged.

**4 Plain summary** — The pet moves smoothly and stops moving when you can't see it.

**5 Technical design** — A `CharacterPlayer` React component in `src/pet/` loads frames through a Tauri asset-protocol URL. The state engine is a pure function `(state, event, time) → frame` so it can be tested without a DOM. Timers use `requestAnimationFrame` or `setTimeout` only while visible. Frames are decoded once per character (≤ 2 MB decoded at default size). The existing `reactions.ts` queue is reused.

**6 Choices and trade-offs** — *Canvas 2D* versus *`<img>` swapping*: `<img>` swap is simpler and uses the browser's decoder; canvas gives smoother control. Chosen: `<img>` swap for the prototype, measured against canvas. *Sprite player behind a flag* versus replacing the bear: behind a flag, so nothing that works today breaks.

**7 Ordered tasks**
1. Write the pure state engine and its unit tests.
2. Write the player component using `<img>` swap; add a `pet.character` setting (default: bear) and feature flag.
3. Pause rules: hidden, minimised, asleep.
4. Fallback to the SVG bear on any load or decode error.
5. Measure CPU and memory on Windows (manual, Unverified until done).

**8 Tests**
- T-CH02-01 · Unit · state transitions: idle→blink→idle; reaction returns to idle; sleep wake on click · `pnpm test` · missing
- T-CH02-02 · Unit · queue limit 3, oldest dropped · `pnpm test` · missing (existing `reactions.test.ts` covers the queue; extend)
- T-CH02-03 · Component · player pauses when `document.hidden` or pet window hidden · `pnpm test` (fake timers) · missing
- T-CH02-04 · Component · load error falls back to bear and logs once · `pnpm test` · missing
- T-CH02-05 · Manual Windows · idle CPU < 1 % with pet visible; ≈ 0 when hidden · checklist · missing
- T-CH02-06 · Manual Windows and macOS · transparency and no halo · checklist · missing (macOS **Unverified**)

**9 Edge cases** — Pet resized while a reaction plays; DPI scaling 150 %+; sleep and reaction at the same time; frame file deleted while the pet is running; very fast clicks; system sleep/resume.

**10 Acceptance** — Every state in research §5 plays with the specified duration (test uses fake timers). Fallback test passes. Windows manual check recorded with numbers (not "looks fine"). Feature flag off = behaviour identical to today (regression test on the bear).

**11 Checklist** — [ ] state engine [ ] player [ ] pause rules [ ] fallback [ ] tests T-CH02-01…04 [ ] Windows CPU check [ ] macOS check [ ] docs.

**12 Doc updates** — This spec; FR-01/FR-39 status; `PROJECT_STATUS.md` (renderer status, Unverified); `CHANGELOG.md`; `docs/04-design/ui-ux-brief.md` if pet visuals change.

**13 Dependencies / exclusions** — Depends on: CH-01. Excludes: Rive runtime (CH-08), face-aware motion (CH-06), changing the bear's look.

---

## CH-03 — Built-in character set (three characters)

**1 Metadata** — Group: Companion · Status: **Planned** · Milestone: FM-8 · Effort: L (art time dependent) · Decision: owner supplies references; Claude designs (owner, 2026-10-21) · Origin: owner request.

**2 User story** — As a user, I can pick from several characters so the pet suits my taste.

**3 Behaviour** — Three packs ship with the app: (1) the existing Loaf bear, exported from its SVG poses; (2) and (3) new characters designed from the owner's reference images. Each has the states in research §5. The default stays the bear.

**4 Plain summary** — Three ready-made pets to choose from.

**5 Technical design** — Built-in packs are stored in the app's resources folder, not in the user's data folder, and are read-only. Their manifests use the same format as personal packs (CH-01). Export of the bear uses a script that renders the SVG poses to PNG at the chosen canvas size (research §7.5 T2).

**6 Choices and trade-offs** — *Designing from owner references* (fast, consistent with the owner's taste) versus *generated art* (cheaper, but licence and quality uncertain). Chosen: owner references, with generation only if the owner asks and the licence is clear. *Keeping the bear as a built-in pack* versus *removing it*: kept, so nothing is lost.

**7 Ordered tasks**
1. Owner sends reference images for characters 2 and 3 (and any style notes).
2. Claude drafts a design brief per character (pose list, palette, proportions) for owner approval.
3. Export bear frames from SVG; check against the SVG at three sizes.
4. Produce character 2 and 3 frames; contact sheets for approval.
5. Package and validate all three (CH-01, CH-07).

**8 Tests**
- T-CH03-01 · Integration · each built-in pack installs and plays every state · `pnpm test` + fixture · missing
- T-CH03-02 · Visual · contact sheet approved by owner per character · manual · missing
- T-CH03-03 · Visual · bear export matches SVG within a pixel tolerance at 96/128/160 px · script test · missing

**9 Edge cases** — Reference image has a busy background; a character needs a pose that the references don't show; palette fails contrast on light or dark desktops; characters look too alike at 96 px.

**10 Acceptance** — Three packs pass CH-07 validation. Owner approves each contact sheet in writing (recorded in the research doc). Bear export has a recorded tolerance result.

**11 Checklist** — [ ] references received [ ] brief approved per character [ ] bear exported [ ] characters 2 and 3 frames [ ] validation passes [ ] owner approvals recorded.

**12 Doc updates** — This spec; research §7; `CHANGELOG.md` with the character names; `ui-ux-brief.md` pet section.

**13 Dependencies / exclusions** — Depends on: CH-01, CH-02, CH-07, owner references. Excludes: personal characters (CH-05), new poses beyond research §5.

---

## CH-04 — Character library and selection (FR-01)

**1 Metadata** — Group: Companion · Status: **Partial** in code (Character page previews poses; no selection of a whole character) · Milestone: FM-8 · Effort: M · Origin: owner request (FR-01, existing item in inventory) · Evidence: `src/features/character/CharacterPage.tsx`.

**2 User story** — As a user, I can see every installed character and choose one for my pet.

**3 Behaviour** — The Character page lists built-in and installed packs with their preview. Selecting one sets `pet.character`. The pet switches on the next frame. Removing a personal pack falls back to the bear and asks for confirmation.

**4 Plain summary** — Pick your pet from a list.

**5 Technical design** — Library is a list from the core (`characters::list()`) read from the built-in folder and the user's data folder. Setting `pet.character` stores the package id. Installing or removing a pack is an IPC command that returns the new list; the UI uses React Query.

**6 Choices and trade-offs** — *Storing the id* versus *storing the path*: id, so moving the data folder does not break the choice. *Auto-switching when a pack is removed* versus *blocking the removal*: auto-switch with confirmation.

**7 Ordered tasks**
1. Core: list and select functions with tests.
2. IPC commands and mock-shell parity (`src/ipc/mock.ts`).
3. Character page list, selection and remove-with-confirm.
4. Settings key `pet.character` with default `bear`.

**8 Tests**
- T-CH04-01 · Unit · list reads both folders; duplicate ids are refused · `cargo test` · missing
- T-CH04-02 · Component · selecting a pack changes the setting · `pnpm test` · missing
- T-CH04-03 · Component · removing the active pack falls back to bear after confirm · `pnpm test` · missing

**9 Edge cases** — Pack removed from disk while selected; two packs with the same id; a broken pack in the list (shown as error, not hidden).

**10 Acceptance** — Selection persists across restart (Windows manual check). Removing the active pack never leaves the pet blank (test).

**11 Checklist** — [ ] list [ ] select [ ] remove [ ] mock shell [ ] tests [ ] docs.

**12 Doc updates** — This spec; FR-01 row; `PROJECT_STATUS.md`; `CHANGELOG.md`; `TRD.md` if IPC commands are listed there.

**13 Dependencies / exclusions** — Depends on: CH-01, CH-03. Excludes: sharing, gallery (FR-31).

---

## CH-05 — Personal character from one photo

> **2026-10-22 (owner):** a limited first release (few states from one photo, honestly labelled) is accepted. Peekoo is the reference competitor.

**1 Metadata** — Group: Companion · Status: **Planned** · Milestone: FM-8 · Effort: XL · Decision: upload **allowed** [Decision]; generation method **open** (see research §13 and the upload-method analysis) · Origin: owner request ("upload image → automatic generation → animated preview → approve and save").

**2 User story** — As a user, I upload one photo and get an animated character I can approve and save, without drawing frames or choosing poses.

**3 Behaviour** — (a) The user picks an image (PNG, JPEG or WebP, ≤ 10 MB, ≥ 512 px on the short side). (b) The app shows a consent screen: the photo is processed on this PC; nothing leaves it unless the user turns on a cloud option (later phase). (c) The app removes the background and shows a mask to check. (d) The app builds the states it can (see the method table in research §13). (e) The user sees an animated preview with a per-state quality badge (good / limited / not available). (f) The user approves, names the character (optional), and saves it as a pack (CH-01). Missing states use fallbacks and are shown as such.

**4 Plain summary** — Upload one picture; the app makes a pet from it and shows you how it moves before you keep it.

**5 Technical design** — Processing runs in a background task in the shell with cancel support; progress is an event on the bus (no polling). Stages: decode and EXIF strip → background mask (open-source segmentation model, to be chosen, CPU or small GPU) → part extraction → state generation (method chosen below) → package writer (CH-01) → validation (CH-07). Working files live in a temporary folder and are deleted on cancel or failure.

**6 Choices and trade-offs** — *Generative model* versus *deformation only*: deformation is local, has no licence risk for the outputs and no VRAM need, but produces fewer states. *One photo only* versus *optional extra photos*: one required, extras optional for side view and closed eyes. Chosen: one required photo; extra photos only improve states, never required.

**7 Ordered tasks**
1. Consent screen and image checks (size, format, dimensions) with tests.
2. EXIF strip and re-encode with tests (no location data in outputs).
3. Background mask with a fixture set (busy and plain backgrounds); accept/reject thresholds recorded.
4. Part extraction and deformation for idle, blink, breathing; quality badges.
5. Package writer and validator (CH-01, CH-07).
6. Preview and approve/save UI; cancel and failure paths.
7. Measure time and peak memory on this PC (6 GB VRAM, CPU fallback).

**8 Tests**
- T-CH05-01 · Unit · rejects non-image, too-small, too-large, and images with embedded scripts or polyglot data · `cargo test` · missing
- T-CH05-02 · Unit · output contains no EXIF GPS or camera serial · `cargo test` · missing
- T-CH05-03 · Integration · fixture photo → package → validates → plays idle · `cargo test` + `pnpm test` · missing
- T-CH05-04 · Integration · cancel mid-process deletes temporary files · `cargo test` · missing
- T-CH05-05 · Quality · fixture set of 10 photos: mask acceptance rate recorded; target ≥ 8/10 usable (to confirm with owner) · manual + script · missing
- T-CH05-06 · Performance · processing time and peak RAM on this PC recorded; idle app stays < 100 MB · manual · missing

**9 Edge cases** — Photo of two people; face partly hidden; hair crossing the outline; a photo of a pet (scope: humans and characters first); low light; transparent PNG input; rotated EXIF; a very wide or tall image; the user cancels during the mask step.

**10 Acceptance** — Every refusal has a message. No output contains location metadata (test). Cancel leaves no temporary files (test). Preview shows the quality badge per state honestly (a state that is not generated is never shown as animated). Measured numbers recorded for the fixture set.

**11 Checklist** — [ ] consent [ ] checks [ ] EXIF [ ] mask [ ] parts [ ] states [ ] package [ ] preview/approve [ ] cancel [ ] fixture set [ ] numbers recorded [ ] docs.

**12 Doc updates** — This spec; research §13; `PRIVACY` text in the app and `docs/02-prd/PRD.md` if processing wording changes; `DECISIONS.md` for the chosen method; `CHANGELOG.md`.

**13 Dependencies / exclusions** — Depends on: CH-01, CH-02, CH-07. Open: [Open] the segmentation model and the generation method (§13 of research). Excludes: cloud processing (later phase, opt-in), pet animals, 3D.

---

## CH-06 — Personal human character (face-aware motion)

> **Revised 2026-10-22 (owner):** motion is **not faces-only**; it may use the whole image. Built **after the character studio has more characters**. **No GPU:** the learned-animator (LivePortrait-style) option is dropped; CPU-only local 2D warp remains. Emotes (FR-40) do not apply to personal characters unless the needed poses exist, see [EMOTE_FEATURE_SPECS.md](EMOTE_FEATURE_SPECS.md).

**1 Metadata** — Group: Companion · Status: **Planned** · Milestone: FM-8 (phase C) · Effort: XL · Decision: [Open] which face-motion method; licence of model weights unverified · Origin: owner request (personalised humans).

**2 User story** — As a user, I want my own face to blink, look around and smile on my pet, not just a generic character.

**3 Behaviour** — On top of CH-05, the app detects the face and adds: blink, head tilt, gaze shift, and a smile state. Motion is limited to the face region; the body stays as produced by CH-05. Users can turn face motion off and keep the static character.

**4 Plain summary** — Your own face moves on the pet: blinks, tilts, smiles.

**5 Technical design** — Face landmarks from an open-source detector (MediaPipe, Apache-2.0 code) on CPU. Face motion is a warp of the face region using the landmarks (2D warp, local) for blink/tilt/gaze. An optional learned face animator (LivePortrait-style, MIT code; **weights licence unverified**) is evaluated as an opt-in add-on requiring a GPU; it is not part of the default path.

**6 Choices and trade-offs** — *Local 2D warp* (CPU, predictable, limited motion range) versus *learned animator* (natural motion, GPU needed, weights licence to check). Chosen: local warp by default; learned animator only as a measured, licence-cleared option.

**7 Ordered tasks**
1. Landmark detection on fixtures; accept/reject rules.
2. Blink and tilt warps with a maximum displacement cap.
3. Smile state from one photo (warp of the mouth region) — quality checked.
4. Evaluate the learned animator on this PC; record VRAM and speed; decide.
5. Owner approval of face motion quality on fixtures.

**8 Tests**
- T-CH06-01 · Unit · no landmarks → face motion disabled with a message · `cargo test` · missing
- T-CH06-02 · Unit · warp displacement never exceeds the cap · `cargo test` · missing
- T-CH06-03 · Quality · owner review of blink and smile on 5 fixtures · manual · missing
- T-CH06-04 · Performance · face motion adds < 1 % idle CPU · manual · missing

**9 Edge cases** — Glasses; hands over the face; side profile; closed eyes in the photo; a group photo; very dark skin tones and lighting (detector accuracy varies; test and report it, do not assume).

**10 Acceptance** — Face motion can be turned off and the character still works (test). Displacement cap enforced (test). Owner approves quality on 5 fixtures in writing. Detector fairness limits are written down, not hidden.

**11 Checklist** — [ ] detector [ ] warps [ ] smile [ ] learned animator evaluation [ ] owner approval [ ] tests [ ] docs.

**12 Doc updates** — This spec; research §13 method table; `DECISIONS.md`; `PRIVACY` text (face analysis is local).

**13 Dependencies / exclusions** — Depends on: CH-05. Open: learned-animator weights licence. Excludes: face recognition or identity matching of any kind; cloud face processing.

---

## CH-07 — Character QA and validation tool

**1 Metadata** — Group: Companion · Status: **Planned** · Milestone: FM-8 · Effort: M · Origin: research §5 and §6 (not a user feature; developer and quality tool, but also used by CH-05 at runtime).

**2 User story** — As the owner and as a user, I can see whether a character is valid and how it looks before I use it.

**3 Behaviour** — A validator runs on any pack and produces a report (pass/fail per rule) and a contact sheet (all frames of each state in a grid) with a motion preview (GIF or frame list). The same validator runs at install and in CI for built-in packs.

**4 Plain summary** — A check that tells you if a character is complete and sized right, with a picture of every frame.

**5 Technical design** — Core validator (`loaf-core`, CH-01 rules) returns structured results. A dev-only script (`scripts/`) renders contact sheets with Pillow or the Rust `image` crate (licence to verify). Hatch-pet's `make_contact_sheet.py` logic is Apache-2.0; if reused, keep the licence and notice.

**6 Choices and trade-offs** — *Python script* (quick, uses Pillow, a second runtime for developers) versus *Rust tool* (one runtime, more work). Chosen: Rust for runtime validation; Python allowed only as a dev-only contact-sheet script until the Rust version exists.

**7 Ordered tasks**
1. Rule list from CH-01 as a table of checks.
2. Core report type and tests.
3. Contact sheet script and a fixture run.
4. CI job that validates built-in packs (`ci.yml`).

**8 Tests**
- T-CH07-01 · Unit · each rule has a passing and a failing fixture · `cargo test` · missing
- T-CH07-02 · Integration · report for the built-in set is all pass in CI · CI · missing
- T-CH07-03 · Visual · contact sheet generated for a fixture pack and checked by eye · manual · missing

**9 Edge cases** — Very large packs (report must still finish); a pack with a missing licence file; Windows line endings in manifest.

**10 Acceptance** — Every rule has tests; CI fails on an invalid built-in pack; contact sheets generated for all three built-in characters.

**11 Checklist** — [ ] rules table [ ] report type [ ] contact sheet [ ] CI job [ ] tests [ ] docs.

**12 Doc updates** — This spec; research §6; `ci.yml` description in `PROJECT_STATUS.md`; `CHANGELOG.md`.

**13 Dependencies / exclusions** — Depends on: CH-01. Excludes: a public online validator.

---

## CH-08 — Rive trial (one character, time-boxed)

**1 Metadata** — Group: Companion · Status: **Planned (trial approved by owner 2026-10-21)** · Milestone: FM-8 (trial, phase A) · Effort: M, two days cap · Origin: owner decision D-RIVE "yes, test". · Evidence: `@rive-app/canvas` on npm, licence MIT, latest 2.45.0 (2026-10-22 check); Rive skill MIT.

**2 User story** — As the owner, I want to know whether Rive gives a better result than frame sheets before we commit to one.

**3 Behaviour** — One character (the bear) is rebuilt as a `.riv` file with the same states as CH-02 and played in the pet window through the web runtime. The trial answers two questions: is the quality better, and is the setup cost acceptable.

**4 Plain summary** — A test of a second way to animate, on one character only.

**5 Technical design** — Web runtime `@rive-app/canvas` inside the pet webview; no Rust runtime needed for the trial. The `.riv` file is authored in the Rive editor (owner needs an account; editor terms **unverified**). State machine inputs mirror CH-02's state names. The trial lives on its own branch of work and is not merged unless it wins.

**6 Choices and trade-offs** — *Webview runtime* (MIT, fits our webview) versus *Rust runtime* (no evidence it is maintained for Tauri; **unverified**). Chosen: webview runtime for the trial only.

**7 Ordered tasks**
1. Owner confirms an editor account and the editor's licence terms.
2. Author the bear's states as a `.riv` (state machine with the CH-02 names).
3. Play it in the pet window; measure CPU, memory, file size, and visual quality at 96/128/160 px.
4. Write a go / no-go with measured numbers.

**8 Tests**
- T-CH08-01 · Integration · the `.riv` loads, every state plays, and a missing file falls back to the bear · `pnpm test` · missing
- T-CH08-02 · Performance · idle CPU and RAM vs frame-sheet version, same machine, numbers recorded · manual · missing
- T-CH08-03 · Visual · owner compares both versions side by side · manual · missing

**9 Edge cases** — Runtime version mismatch with the editor; font or shader features the runtime lacks; transparency on Windows.

**10 Acceptance** — A written go/no-go with numbers and a list of problems. If go: a follow-up spec. If no-go: the reason is recorded in `DECISIONS.md`.

**Trial status (2026-10-22): Blocked, not started, no result.** A `.riv` can only be authored in the Rive editor (free tier, not open source; terms unverified), which cannot run in this environment, so I cannot produce the file or any numbers. What is known: runtime `@rive-app/canvas` 2.45.0 is MIT. What the owner must do: create a free Rive account, build or import the bear's states, export a `.riv`, and place it at `src/assets/rive/bear.riv`. Then the playback harness and measurements can be built. No claim is made that Rive is better or worse.

**11 Checklist** — [ ] editor account [ ] states authored [ ] playback [ ] numbers [ ] owner comparison [ ] decision recorded.

**12 Doc updates** — This spec; research §3 comparison (replace estimates with measured values); `DECISIONS.md`; `CHANGELOG.md` only if the trial ships.

**13 Dependencies / exclusions** — Depends on: CH-02 (state names). Excludes: Rust Rive runtime, a Rive-based production pipeline before the decision.

---

## Build order (proposed, for owner approval)

CH-07 and CH-01 → CH-02 → CH-03 (bear export first) → CH-04 → CH-08 trial (in parallel with CH-03) → CH-05 (after the upload method is chosen) → CH-06 (phase C).

**Emotes (FR-40)** follow CH-02/CH-03: registry and state machine first, then simple front-view emotes, then the rest. See [EMOTE_FEATURE_SPECS.md](EMOTE_FEATURE_SPECS.md).
