# Personalised 2D Character System — research and design

**Status:** Research and design only (no production code changed). **Date:** 2026-10-21.
**Feature IDs:** FR-01 (appearance), FR-02 (user photos/artwork), FR-03 (character packs). Roadmap: [`FEATURE_ROADMAP.md`](../../FEATURE_ROADMAP.md).

**How to read this document.** Every claim carries a tag:

- **[Fact]**: seen in source code, a file in a cloned repo, a registry or a web page this session could read.
- **[Inference]**: a reasoned conclusion from facts. Not tested.
- **[Assumption]**: something we need to check before relying on it.
- **[Recommendation]**: a choice we propose. The owner decides (see §10).

Nothing here has been run on Windows or macOS. Anything about the pet window on a real OS is **Unverified**.

---

## 0. Summary (the uncomfortable parts first)

1. **[Fact]** The character in the app is a hand-drawn SVG React component (`src/features/shell/Bear.tsx`), not an image or animation file. Its 13 poses are CSS transforms over a single drawing. Nothing in the app can load a user's image or animation today.
2. **[Fact]** The strongest one-image pipeline we found (ComfyUI 2D character pipeline) needs **≥ 24 GB VRAM, ≥ 32 GB RAM and ~80–120 GB of models**. Our machine has **6 GB VRAM**. It is not usable on our hardware.
3. **[Fact]** Codex `hatch-pet` depends on a Codex system image skill (`$imagegen`) that is **not in its repo**. It is not runnable as shipped on a plain PC, and its image generation runs through a service we have not chosen. Its deterministic part (atlas, validation, QA) is Apache-2.0 Python + Pillow and is reusable.
4. **[Inference]** Nothing we found turns **one reference image into a rigged, animated character automatically on 6 GB VRAM** with acceptable quality. Any honest personalised flow will need either a cloud or external image generator (owner decision, and it conflicts with local-first unless the user opts in), or a limited local deformation method (§3.4) with visible limits.
5. **[Recommendation]** Start with **sprite-sheet frames in a versioned package** rendered by the existing webview. Keep the current SVG bear as the fallback. Run a **time-boxed Rive trial on one character** before choosing a production direction. This matches the existing renderer and needs no new runtime for the prototype.
6. **[Recommendation]** Do **not** adopt the `sprite-pet-skill` or `comfyui-2d-character-pipeline` code yet. Licence and hardware are unresolved, respectively.

---

## 1. Audit of the existing application

### 1.1 What exists

| Area | Evidence | Facts |
|---|---|---|
| Character drawing | `src/features/shell/Bear.tsx` (276 lines) | Inline `<svg viewBox="0 0 200 200">`. A `LOOKS` table maps each pose to eyes, mouth, arms, prop and a CSS body class. Poses: `idle, wave, sleep, work, type, wait, stow, cheer, party, catch, worried, ring, toss`. |
| Motion | `Bear.tsx` body classes such as `bear-breathe`, `bear-jump`, `bear-shake` | **[Fact]** CSS transforms only (the app's own design rule: "CSS transforms only"). No frame sequence. |
| Reactions | `src/pet/reactions.ts`, `src/pet/PetApp.tsx` | Queue of reactions with durations (`next.ms`). Sleep after 15 quiet minutes (`SLEEP_CHECK_MS = 30 s` check). |
| Typing along | `src/pet/typing.ts`, setting `pet.typing` (default off) | Pose `type` / `wait` / `stow`. Counts key presses only. |
| Pet window | `src-tauri/src/pet.rs` | Separate Tauri window, transparent, always-on-top (`pet.always_on_top`). Sizes `S 96 / M 128 / L 160` px. Hover card 300×296 px and bubble 220×52 px; the window grows toward free screen space. Drag position is remembered. |
| Character page | `src/features/character/CharacterPage.tsx`, `Characters.tsx` | Previews every pose. No upload, import or appearance editing. |
| Asset handling | none for characters | **[Fact]** No image import, no asset directory for characters, no character package format. Dialog plugin exists (`tauri-plugin-dialog`), not used for characters. |
| Frontend libs | `package.json` | React, Tailwind v4, Radix, @dnd-kit. **No** Rive, Pixi, Lottie or canvas animation library. |
| Rust deps | `src-tauri/Cargo.toml` | Tauri 2 plugins: single-instance, notification, opener, autostart, dialog, global-shortcut, window-state. **No** image crate, **no** HTTP client. |

### 1.2 Reusable parts

- **Pose state machine and reaction queue** (`reactions.ts`, `PetApp.tsx`): the logic that decides which pose plays and when. It is independent of how a pose is drawn, so a sprite player can slot in behind the same interface.
- **Pet window** (`pet.rs`): size, always-on-top, hover card placement. Independent of the drawing.
- **Settings keys** `pet.size`, `pet.opacity`, `pet.typing`: reusable for appearance.
- **Character page** previews: can host a preview of any package.

### 1.3 Constraints we must preserve

- **[Fact]** Idle CPU target < 1 %, RAM < 100 MB (`CLAUDE.md`, PROJECT_STATUS). Sprite playback must pause when the pet is hidden or asleep.
- **[Fact]** Transparent, always-on-top window. Transparency and layering are the parts most likely to differ between Windows and macOS. **Unverified** on both.
- **[Fact]** Local-first, no network by default. A personalised pipeline must not upload a photo unless the user opts in (PRD / decisions).
- **[Fact]** Core crate has no Tauri dependency (`pnpm check:core-deps`). Any package parser belongs in `loaf-core`; file access belongs in the shell.

### 1.4 Supported animation states today

Thirteen poses in §1.1. Mapping to the requested states (§5):

| Requested state | Existing pose(s) |
|---|---|
| Idle and blinking | `idle` (breathing and head tilt; **no separate blink** in the table) |
| Walking / movement | none. The bear moves only by window drag. |
| Sleeping | `sleep` |
| Happy / excited | `cheer`, `party`, `wave` |
| Click / interaction | `catch`, `ring`, `toss`, `worried` (driven by reactions) |
| Focus / work | `work`, `type`, `wait`, `stow` |

**[Fact]** Blinking is not a separate animation today. **[Fact]** There is no walking animation.

---

## 2. Tools and skills evaluated

Verified on **2026-10-21** from cloned repos (shallow clones in the session scratchpad, read only, nothing executed) and from web pages. "Not shown" means the page did not show a date or licence; "unreachable" means the host could not be reached from this session.

| Tool | Licence | Popularity (page, 2026-10-21) | Dates | Dependencies / hardware | Output | Verdict |
|---|---|---|---|---|---|---|
| **Codex `hatch-pet`** — `openai/skills/.curated/hatch-pet` | Apache-2.0 (`LICENSE.txt`) | Repo: **28.2k stars, 1.9k forks**, 114 commits. Per-skill licence file. | Last commit: **not shown** | Python 3 + **Pillow**. Image generation via `$imagegen` (**not included**; Codex system skill). | 192×208 cells, 8×9 atlas, nine rows, eight columns: idle 6, running-right 8, running-left 8, waving 4, jumping 5, failed 8, waiting 6, running 6, review 6 frames (`prepare_pet_run.py`, `compose_atlas.py`: `COLUMNS = 8`, `ROWS = 9`) + `pet.json` | **Reuse ideas and validators**; the generator is not usable as shipped |
| **Sprite Pet Skill** — `promptwhisper/sprite-pet-skill` | **Not stated** for this repo. Methods are adapted from MIT `promptwhisper/sprite-generator` (pinned `12a5c31`); upstream licence file included. | **0 stars, 0 forks**, 3 commits | **Not shown** | Python + Pillow (`requirements.txt`: `Pillow==11.3.0`). Node/npm + **Electron** runtime for its desktop app. | Sprite sheets, bundle export, animation validation, pose guides, Electron pet | **Hold.** Licence of this repo unclear; Electron runtime conflicts with Tauri; very low adoption. Read its `validate_animations.py` for ideas only. |
| **Rive skill** — `uianimation/rive-skill` | **MIT** (`LICENSE`) | **8 stars, 3 forks** | **Not shown** | Instructions and scripts (PowerShell); no runtime code | Guidance only (`rive-instructions.md`, references) | **Useful reference** for authoring rules; it is not a runtime |
| **Rive web runtime** — `@rive-app/canvas` (npm) | **MIT** (registry metadata) | npm "latest" **2.45.0** | n/a | JavaScript; canvas/WebGL in the webview | `.riv` files: artboards, state machines, data binding | **Candidate** for the trial (§3.3). Rust runtime support: **Unverified** (crates.io unreachable). |
| **ComfyUI 2D character pipeline** — `mor-o/comfyui-2d-character-pipeline` | **MIT** (`LICENSE`) | **111 stars, 19 forks**, 3 commits | **Not shown** | **NVIDIA ≥ 24 GB VRAM, ≥ 32 GB RAM, ~120 GB disk**; ComfyUI, ComfyUI-GGUF, SAM3, BiRefNet, WAN 2.1/2.2, Qwen-Image-Edit (≈ 80 GB) | Greyscale RGBA sprite sheets, cosmetic layers | **Rejected for our hardware.** Its docs peak at ~17.6 GB on a 24 GB card. |
| **Godot 2D skeletons** — Skeleton2D / Bone2D / Polygon2D | MIT (Godot engine) | Not checked (not a comparable tool) | — | Full game engine | Skeletal mesh weights (Polygon2D bone weights, per the class reference search result) | **Reference only.** Embedding a game engine in Tauri is not viable. The *idea* (bones and weighted meshes on one image) is useful for §3.4. Docs site was **unreachable** from this session; facts above come from a search snippet only. |

**Popularity check.** Stars and forks are from GitHub pages read on 2026-10-21. **[Fact]** No page showed a last-commit date, so **maintenance status is Unknown** for all four repos. **[Fact]** None is evidence of "trending". Stars alone do not establish quality.

### 2.1 Capability matrix

| Capability | hatch-pet | Sprite Pet | Rive skill / runtime | ComfyUI pipeline | Godot |
|---|---|---|---|---|---|
| Character generation from images | Via `$imagegen` (external) | External image step | No | Yes (heavy GPU) | No |
| Sprite-sheet processing | **Yes** (extract, validate, compose, QA contact sheets) | **Yes** (process, validate, export) | No | Partial (sheet output) | No |
| Skeletal rigging | No | No | Yes (in Rive Editor) | No | Yes (engine) |
| Animation authoring | Via prompts | Via prompts | Yes (Rive Editor, **not in repo**) | Via workflows | Yes (editor) |
| Runtime rendering in our app | Needs our own player | Electron only | **Web runtime fits the webview** | None | Not embeddable |
| Automated visual QA | **Yes** (contact sheet, motion preview) | Partial (validate) | No | Partial (`inspect_keyframes.py`) | No |

### 2.2 How they could work together without replacing our runtime

**[Recommendation]** Keep the **app runtime** small and fixed: a package loader plus a player in the webview. Use external tools only **offline, at build or import time**, and write their outputs into our package format (§6).

- Frame extraction, atlas checks and contact-sheet QA: borrow the **logic** of hatch-pet's Python scripts (Apache-2.0, keep the NOTICE and licence). Reimplement in `loaf-core` if we want no Python dependency; that is an assumption, not measured.
- Rive files: authored in the Rive Editor by a person, shipped as `.riv` assets. The runtime reads them; no generation needed.
- Generation models: **not chosen**. Owner decision (§10, D-GEN).

---

## 3. Animation approaches compared

### 3.1 Comparison

Scores are qualitative **[Inference]** from our constraints, not benchmarks. High = better for us.

| Criterion | Sprite sheets (pre-rendered frames) | Layered 2D (independent parts) | Rive (rigged state machine) | Godot-style skeleton (mesh + bones) |
|---|---|---|---|---|
| Visual quality | High if frames are good; limited by the source art | High, but seams at joins | High (vector) | High |
| Smoothness | Depends on frame count; 8–12 fps looks fine for a pet | Smooth | Smooth, vector | Smooth |
| Consistency across states | Medium: frame alignment must be enforced | High (one rig) | High (one artboard) | High |
| Implementation effort in our app | **Low**: image + timer | Medium: part compositing, pivots | Medium–High: new runtime and asset format | High |
| Runtime performance | Low CPU if paused when hidden | Low–medium | Low; WebGL/Canvas cost | Medium |
| Cost | Art time only | Art time + tooling | Rive Editor (**licence and cost: Unverified**) | Engine, free |
| Offline | Yes | Yes | Yes | Yes |
| Licensing | Our assets | Our assets | Runtime MIT; editor terms **Unverified** | Engine MIT; not embedded |
| Tauri/Rust fit | **Good** (webview images) | Good | Good for web runtime; Rust runtime **Unverified** | Poor (engine) |
| Automated from one image | Only with a generator (§4.2) | Partly (deform locally, §3.4) | No (needs rigging by a person) | Partly (same as layered) |

### 3.2 Recommendation for the prototype

**[Recommendation] Sprite-sheet frames in a versioned package, rendered by the webview.** Reasons:

1. It matches what the app already does (a webview drawing with CSS and SVG) and adds **no runtime dependency** for the prototype.
2. Frame alignment, timing and transparency are easy to test in unit tests (§8).
3. Its asset format can also store a Rive-authored character later, because the package only describes states and files.

**Limitations we accept:** frame count multiplies file size and authoring effort; scaling is raster, so the largest pet size (160 px at 2× = 320 px) needs frames at ≥ 320 px to stay sharp.

### 3.3 Rive trial (time-boxed, one character)

**[Recommendation]** One character, one week, two questions: (a) does the webview runtime play the state machine smoothly at 160 px with transparency on Windows, (b) does one `.riv` file replace 6+ frame sheets without a visible quality loss? Stop criteria: more than two days of setup, or any transparency or layering problem on Windows.

### 3.4 Other approaches with a clear advantage

- **Layered 2D with local mesh deformation** (one image → cut into parts → bones and weights): **[Inference]** it can produce breathing, blinking and sway from one image without a generator and without a GPU. It cannot produce walking with new poses, or arms raised from a closed pose. **[Assumption]** Quality on a single flat illustration needs a test before we rely on it. This is the only candidate that fits "one image, no GPU", so it belongs in the trial list.
- Lottie / animated SVG: rejected as a primary path. The existing bear is an SVG component, so it would be a small step, but the authoring tools are not better than Rive for states.

---

## 4. Character creation pipeline

### 4.1 Option A — built-in characters first

Create two or three characters with a reusable pipeline, validate appearance, animations, performance and runtime integration, and fix the asset format from real data.

- **Pros:** quality is controlled; the format is settled before users depend on it.
- **Cons:** needs artist time or a generator with a licence we accept.

### 4.2 Option B — personalised characters first

User uploads one image; the app generates artwork, animations and a package automatically.

- **Pros:** the target experience.
- **Cons, verified:** hardware (§2) rules out the strongest local pipeline; consistency from one image is the main quality risk; generation of frames needs a model we have not chosen; a photo upload conflicts with local-first unless the model is local.

### 4.3 Recommended sequence

**[Recommendation]** Option A first, with the **same pipeline steps** that Option B will later run, so Option B becomes "swap the source of art" rather than a new system:

1. Freeze the package format (§6) on the existing bear.
2. Build the sprite player and package loader (§7).
3. Build two more built-in characters.
4. Decide the personalised source (D-GEN, D-UPLOAD) and build the import flow: upload → automatic extraction → animated preview → approve → save.

### 4.4 Target user workflow (Option B, later)

Upload image → automatic processing → animated preview → approve and save. **Hard requirement:** the user never draws frames, prepares sheets, chooses poses or sees animation formats. Name and art style are optional (defaults: a name from the file name; "auto" style).

### 4.5 What one reference image can realistically produce

**[Inference]**

- **Good:** a front-facing, full-body, plain-background image with clear outline. Breathing, blinking, slight sway (layered/deform route), a "happy" squash-and-stretch.
- **Needs more:** side view for walking; closed eyes for sleep (may need a second image or manual eyes); arms in new positions (cheer, party); props (laptop for focus).
- **Needs manual correction:** hair or clothing that overlaps the body, transparent-background failures, low-resolution photos, faces that the generator changes.

**[Recommendation]** Ask for one required image plus **optional** extra images for side view and closed eyes. Show the user a per-state quality check in the approval step, with a "fallback to idle-only" option.

---

## 5. Character animations (specification)

Frame rate for all sprite states: **12 fps** (8 fps allowed for sleep). Loops and durations below are targets **[Recommendation]**, not measured.

| State | Pose(s) | Duration | Loop | Frames (min) | Interrupt | Fallback |
|---|---|---|---|---|---|---|
| Idle (breathe) | `idle` | 2.0–3.0 s | Yes | 8 | Any reaction | Static frame 0 |
| Blink | `idle` overlay | 150 ms | No, plays every 3–6 s at random | 3 (open, half, closed) | Any | Skip blink |
| Walk / move | none today | 0.8 s cycle | Yes | 8 (per direction) | Stop on drag end | Idle |
| Sleep | `sleep` | 3.0 s | Yes | 6 | Click wakes; fade 1 s | Idle with closed eyes |
| Happy / excited | `cheer`, `party`, `wave` | 1.0–1.5 s | No → returns to idle | 8–12 | Click (interrupts, plays from start) | Idle |
| Click reaction | `catch`, `ring`, `toss` | 0.8–1.2 s | No | 6–8 | Next click restarts | Idle |
| Focus / work | `work`, `type`, `wait`, `stow` | `work`/`type` loop 2 s; `wait` loop 2 s | Yes | 6 | Reaction interrupts; stop on focus end | Idle |
| Worried | `worried` | 1.0 s | No | 4 | Any | Idle |

**Transition rules (all states):**

- Crossfade 120 ms between states; a non-looping reaction returns to `idle` at its last frame.
- A reaction may interrupt a looping state immediately; a looping state may not interrupt a reaction until it finishes, except sleep (wakes on click or on new activity).
- Queue at most 3 reactions; drop older ones (matches `reactions.ts` behaviour, to be verified).
- A missing state uses its fallback; a missing *required* state (`idle`) is an error at import, never a blank pet.

**Performance rules:**

- Pause the sprite timer when the pet window is hidden, minimised or asleep (no ticks).
- Decode frames once; keep ≤ 2 MB decoded per character at the default size.
- Target idle CPU < 1 % with the pet visible (measure on Windows; **Unverified**).

**Visual rules:** consistent proportions (one anchor point per package), transparent background with **no halo**, and the same character bounds on every frame (the bounds are checked, §6).

---

## 6. Reusable asset format (proposal)

**[Recommendation]** A versioned folder, zipped as `.loafpack` for sharing (FR-03). Independent of any generator.

```text
my-character/
  manifest.json          # required; schema_version = 1
  frames/
    idle/000.png ...     # RGBA PNG, one file per frame
    blink/000.png ...
    ...
  preview.png            # optional thumbnail, 256×256
  LICENSE.txt            # required for packs (author, licence, provenance)
```

`manifest.json` (fields are the spec; values are examples):

```json
{
  "format": "loaf-character",
  "schema_version": 1,
  "id": "loaf.bear",
  "name": "Loaf the bear",
  "version": "1.0.0",
  "canvas": { "width": 256, "height": 256 },
  "anchor": { "x": 128, "y": 240 },
  "bounds": { "x": 16, "y": 8, "width": 224, "height": 240 },
  "fps": 12,
  "states": {
    "idle":   { "frames": ["frames/idle/000.png", "..."], "loop": true,  "durations_ms": [166, "..."] },
    "blink":  { "frames": ["..."], "loop": false, "durations_ms": ["..."] },
    "sleep":  { "frames": ["..."], "loop": true },
    "cheer":  { "frames": ["..."], "loop": false, "returns_to": "idle" }
  },
  "fallbacks": { "walk": "idle", "worried": "idle" },
  "pose_map": { "wave": "cheer", "party": "cheer", "catch": "cheer" },
  "compatibility": { "min_app_version": "2.0.0", "runtimes": ["webview-sprite@1"] },
  "provenance": { "source": "hand-drawn", "tool": null, "tool_version": null, "licence": "MIT" },
  "files": { "frames/idle/000.png": { "sha256": "…" } }
}
```

**Validation rules (enforced in `loaf-core`, tested):**

- `schema_version` supported; unknown major = refuse with a clear message.
- Every referenced file exists; every file's `sha256` matches; no path escapes the folder (no `..`, no absolute paths, no symlinks).
- All frames in a state have identical dimensions equal to `canvas`.
- `idle` is required and must have ≥ 8 frames.
- Alpha: the frame's fully transparent border must be ≥ 0 px and the character must lie inside `bounds` (checked by alpha bounding box).
- Size limits: ≤ 4 MB per frame, ≤ 40 MB per pack, ≤ 200 frames total. Tune after measuring.
- Pack ID is unique on install; installing an existing ID asks before overwrite.

**Converting from other tools (adapters, not dependencies):**

| Source | How it maps | Lossy? |
|---|---|---|
| Codex hatch-pet atlas (`spritesheet.png` 8 columns × 9 rows, 192×208 cells, rows listed in §2) | Split the atlas into frames by row/column; map rows to states; drop empty cells; scale 192×208 → 256×256 is **not** lossless | Scaling is lossy; keep original size and set `canvas` to 192×208 instead |
| Sprite Pet Skill bundle | Its exported sheets and manifest, if read and licence-cleared | **Unverified**: not read in full |
| Rive `.riv` | Stored as `"runtime": "rive@…"` state with a `.riv` file; the package stays the same | Needs the Rive runtime (§3.3) |
| ComfyUI greyscale sheets | Greyscale needs tinting at draw time (their design) | Not recommended on our hardware |

**Why independent:** the package only states the states, frames, timing and bounds. The app never reads a generator's internal format. A new generator means a new adapter, nothing else.

---

## 7. Proof-of-concept plan (three built-in characters)

### 7.1 Scope

- Characters: **(1)** the existing Loaf bear, exported from its SVG poses to frames (tests the pipeline on known art); **(2)** and **(3)** two new characters designed by the owner or built with an approved generator (D-GEN).
- Animations per character: idle, blink, sleep, one reaction, one focus state (§5).
- **Not in scope:** public generation service, upload UI, Rive production path, 3D.

### 7.2 Tools and setup

- Node/pnpm (existing), `loaf-core` (existing), a small PNG validator in Rust (`image` crate **[Assumption]** license MIT/Apache-2.0; to be checked), Pillow (Python, only if we borrow hatch-pet scripts; not a runtime dependency).
- Rive trial (§3.3) on character (1) only, separate branch of work.

### 7.3 Generation and rendering workflow

1. Source art (SVG poses or generated sheets) → PNG frames at the canvas size.
2. Build `manifest.json` (script) and checksums.
3. `loaf-core` validates the package (§6).
4. Shell loads the package through a Tauri command that returns frames via the asset protocol (**Unverified** on Windows and macOS).
5. Webview sprite player (timer, pause rules, §5) renders into the pet window.
6. Character page shows the same package for preview.

### 7.4 Input and output formats

- In: SVG poses or PNG sheets (RGBA), JSON state map.
- Out: `loaf-character` folder or `.loafpack`; validation report (JSON); contact sheet PNG per character (for QA).

### 7.5 Implementation tasks and effort

| # | Task | Effort | Notes |
|---|---|---|---|
| T1 | Freeze manifest v1 and validation rules; tests | M | `loaf-core` |
| T2 | Export bear poses to frames (script) | S | Tests against SVG render |
| T3 | Package loader in shell + asset protocol | M | Windows + macOS check |
| T4 | Sprite player in pet window (pause rules) | M | Replaces SVG only behind a flag |
| T5 | Character page preview | S | |
| T6 | Two more characters | L | Depends on D-GEN |
| T7 | Rive trial (one character) | M (time-boxed) | Decision gate |
| T8 | Contact-sheet QA script | S | Can borrow hatch-pet's `make_contact_sheet.py` logic (Apache-2.0, keep notice) |

### 7.6 Visual-quality and performance checks

- Contact sheet per state: owner approves each character (manual).
- Scale check at S/M/L: no blur above 2× for M and L.
- Transparency check on Windows and macOS: no halo on light and dark desktops (manual, **Unverified**).
- CPU: idle with pet visible < 1 %, hidden/asleep ≈ 0 ticks (measure on Windows; **Unverified**).
- Memory: < 100 MB app total with three characters loaded (`v2-ram.yml` style check).

### 7.7 Tests

| Level | Test | Command / place |
|---|---|---|
| Unit | Manifest parse; unsupported `schema_version` refused | `cargo test --workspace` (`loaf-core`) |
| Unit | Path traversal, absolute path, symlink refused | `cargo test` |
| Unit | Checksum mismatch refused | `cargo test` |
| Unit | Frame dimension mismatch refused; missing `idle` refused | `cargo test` |
| Unit | Duration table sums and fps rules | `cargo test` |
| Unit | Pose map and fallback resolution | `pnpm test` |
| Component | Sprite player pauses when hidden; state transitions and returns to idle | `pnpm test` (fake timers) |
| Integration | Load all three packs; play each state in order | `pnpm test` + mock shell |
| Animation | Frame-alignment check: bounding box of each frame within `bounds` | `cargo test` on fixture packs |
| Visual | Contact-sheet diff vs approved sheet | manual, owner |
| Platform | Transparency, always-on-top, DPI, sleep resume | manual Windows; manual macOS (**Unverified**) |

### 7.8 Failure cases and recovery

| Failure | Behaviour |
|---|---|
| Pack missing a file | Refuse install with the file name; keep previous pack |
| Corrupt PNG | Refuse; show error in Character page |
| Missing optional state | Use fallback; log at info level |
| Missing `idle` | Refuse install (required) |
| Renderer error at runtime | Fall back to built-in SVG bear; log error |
| Huge pack | Refuse above size limits; say why |
| Window hidden mid-animation | Timer stops; resumes on show from the current frame |

### 7.9 Acceptance criteria

- Three packs install, validate and play all listed states on Windows (manual) with CPU < 1 % idle.
- Every validation failure in §7.8 has a test and a readable message.
- The existing SVG bear remains available and is the fallback (no feature loss).
- Rive trial gives a written go / no-go with measured numbers, or a recorded reason it was skipped.

---

## 8. Test and risk register

### 8.1 Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| CR-1 | One-image generation quality too low on 6 GB VRAM | High | High | Option A first; optional extra images; per-state approval |
| CR-2 | Generator licence or upload conflicts with local-first | Medium | High | D-GEN and D-UPLOAD decided first; opt-in only |
| CR-3 | Licence unclear for sprite-pet-skill | — | Medium | Do not copy code; read only; ask owner |
| CR-4 | Transparency or always-on-top differs on macOS | Medium | Medium | Manual check; say Unverified |
| CR-5 | Frame files make the app large | Medium | Low | Size limits; compress PNG; measure |
| CR-6 | Untrusted packs (zip-slip, huge files) | Medium | High | Validation rules §6; tests |
| CR-7 | Rive runtime unavailable in Rust or licence changes | Medium | Medium | Webview runtime only; trial gate |
| CR-8 | Idle CPU rises with sprite timers | Medium | Medium | Pause rules; measure |
| CR-9 | Upstream repos change or disappear | Medium | Low | Vendor only what we use, with licence |

### 8.2 Edge cases

Non-square images; transparent-background failures; very small or very large sources; EXIF location in photos (strip); same pack installed twice; pack removed while active (fall back to bear); system DPI scaling above 150 %; pet resized while a reaction plays; sleep and wake during a reaction.

### 8.3 Acceptance criteria for the research phase (this document)

- Each requested tool has source, licence, dependencies, hardware and maintenance evidence, or an explicit "Unknown / Unverified".
- Hardware conclusion stated with numbers (done: §2).
- Recommended approach and prototype plan with tests, failure cases and acceptance criteria (§3, §7).
- Unresolved decisions listed (§10).

---

## 9. Future expansion

- **Personalised characters (FR-02/FR-03):** the same package and states; a new source adapter and a generation or deformation step behind an opt-in flag.
- **3D:** not in scope. Sprite packs do not carry 3D data; a 3D character would need a separate format and a renderer (large effort, not recommended before 2D is in use).
- **Packs and sharing:** `.loafpack` as the sharing format; online gallery needs a backend (FR-31, blocked).

---

## 10. Decisions (owner, 2026-10-21) and open items

| ID | Decision |
|---|---|
| D-UPLOAD | **Allowed.** Consent text and local-first processing required |
| D-FORMAT | **Approved as a starting point; find the format by trial and error** |
| D-RIVE | **Yes, run the one-character trial** |
| D-CHARS | **Owner supplies reference images; Claude designs the built-in characters** |

Still open: **D-GEN** (image generator for personalised characters: local, cloud or none), **D-LICENCE** (acceptance of sources; Sprite Pet Skill on hold).

## 10a. Earlier list of unresolved decisions (kept for history)

| ID | Decision | Why it matters |
|---|---|---|
| D-GEN | Which image generator, if any, for Option B: **local** (needs a GPU we don't have → small model or none), **cloud** (sends the user's image out; needs explicit opt-in), or **deformation only** (no generator, limited states) | Decides feasibility of "upload → automatic" |
| D-UPLOAD | Is uploading a personal photo allowed at all, and with what consent text | Privacy and local-first |
| D-FORMAT | Accept manifest v1 (§6), or change it first | Freezes the public format |
| D-SIZE | Canvas 256×256 (new) or 192×208 (hatch-pet compatible) | Sharpness vs size |
| D-RIVE | Run the one-character Rive trial (§3.3)? Owner needs a Rive account and editor | Production direction |
| D-LICENCE | Accept MIT / Apache-2.0 sources as reference or code; **do not** adopt sprite-pet-skill until its licence is stated | Legal |
| D-CHARS | The two new built-in characters: owner designs them, or we generate with the approved tool | Scope and time |

---

## 11. Facts we could not verify

- Godot 2D skeleton documentation: site unreachable; only a search snippet for `Polygon2D` was read.
- Rust (`rive-rs`) runtime status and licence: crates.io unreachable.
- `openai/skills` and other repos: **last commit dates not shown**; maintenance unknown.
- `$imagegen` (hatch-pet's generator): not in the repo; behaviour and cost **unknown**.
- Sprite Pet Skill's exported format: not read in full.
- Any rendering on Windows or macOS: none run.

---

## 12. Documentation links

- Feature roadmap: [`FEATURE_ROADMAP.md`](../../FEATURE_ROADMAP.md)
- Requested-feature specs: [`docs/features/FR-requested-features.md`](../features/FR-requested-features.md)
- Current state: [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md)
- Decisions: [`DECISIONS.md`](../../DECISIONS.md)
- Changelog: [`CHANGELOG.md`](../../CHANGELOG.md)
- Source of the current character: `src/features/shell/Bear.tsx`, `src/pet/PetApp.tsx`, `src/pet/reactions.ts`, `src-tauri/src/pet.rs`

---

## 13. Personal upload: what competitors do and what we can build (2026-10-22)

**Owner question:** how should the upload image method work, what do competitors do, and which open-source tools fit? Owner's rule: prefer open-source tools, skills, plugins and connectors; external licences may be open-source, checked version by version.

### 13.1 Competitors (self-reported; not tested by us)

| Product | Platform | Input | What it promises | Our view |
|---|---|---|---|---|
| **Peekoo** | native macOS and Windows | one photo | mascot from a photo; walks, climbs window edges, naps | Closest to our target. Quality **unverified**. Closed source and pricing not checked. |
| **MomoPlanet** | macOS and Windows | **three clear photos** of the same pet | private desktop companion; free tier with two fixed actions, paid packs | Pets only. Multi-photo input is a sign that one photo is hard. |
| **Wallpets Custom Lab** | with its desktop app | **three photos** of a cat or dog | custom wallpet | Pets only. Multi-photo input again. |
| **FriendPet** | Chrome extension | photo | pet walks across web pages | **Excluded**: owner's no-extension decision. |

[Fact] Sources: the search results and product pages listed in the session notes (Product Hunt listings, vendor pages). [Inference] Most competitors ask for several photos or limit what they promise; none we found publishes a quality benchmark.

### 13.2 What we can build, by method

| Method | What it produces | Runs where | Code licence (verified this session) | Weights licence | Hardware (ours: 6 GB VRAM) | Verdict |
|---|---|---|---|---|---|---|
| **M1 Deformation only** (mask → parts → local warp: breathe, blink, tilt, sway) | idle, blink, sleep (closed eyes overlay), happy squash | CPU | Our code | n/a | Fine | **Recommended start.** Works for characters and humans, one photo, no generative model. Limited states. |
| **M1a Background removal** — BiRefNet | mask | CPU/GPU | **MIT** (`ZhengPeng7/BiRefNet`, LICENSE read) | **Unverified** | Small models fine | Use. Verify the weights licence before shipping. |
| **M1b rembg** | mask (wraps models) | CPU/GPU | **MIT** (README badge; LICENSE file not fetched) | depends on model used | Fine on CPU | Alternative to BiRefNet. |
| **M1c Face landmarks** — MediaPipe | face mesh, selfie segmentation | CPU | **Apache-2.0** (`google-ai-edge/mediapipe` LICENSE read) | **Unverified** (model files) | CPU | Use for humans: blink and gaze regions. |
| **M2 Click-to-select parts** — SAM 2 | user taps hair, shirt, etc. | GPU preferred | **Apache-2.0** (`facebookresearch/sam2` LICENSE read) | **Unverified** | Small variant likely fits 6 GB; **unverified** | Optional refinement step. |
| **M3 Learned face animation** — LivePortrait | natural head and face motion from one photo | NVIDIA GPU; CPU slow | **MIT** (`KwaiVGI/LivePortrait` LICENSE read) | **Unverified** (Hugging Face unreachable; page gives no licence line) | **Not stated** by the project; tested on NVIDIA GPU | Opt-in add-on for human characters, **after** its weights licence and VRAM are measured on our PC. |
| **M4 Generative completion** (side view, closed eyes, new poses) — Stable Diffusion via diffusers | new frames from text/image | GPU | diffusers **Apache-2.0** (LICENSE read) | Stable Diffusion weights **Unverified this session** | Possible for small models with memory tricks; **[Assumption]** not measured | Opt-in only, after measuring on our PC. |
| **Upscale** — Real-ESRGAN | sharper small photos | CPU/GPU | **BSD-3-Clause** (`xinntao/Real-ESRGAN` LICENSE read) | **Unverified** | Fine | Optional. |
| **M5 Cloud generation** | anything | remote | depends on provider | depends | none | Later phase, explicit consent, not default. |
| ComfyUI pipeline | greyscale sheets | GPU ≥ 24 GB | MIT | model licences vary | **Not feasible** | Rejected (§2). |
| Sprite Pet Skill | sheets | Electron | **not stated** | — | — | Hold (§2). |
| Live2D Cubism, Spine | rigged 2D | desktop editor | **Unverified** (live2d.com unreachable; Spine not checked) | — | — | Not evaluated further; not open source. |
| Shimeji-style desktop pets | sprite pets | desktop | **Unverified** (repo page returned 404) | — | — | Reference for behaviour only. |

**Popularity** (GitHub pages, 2026-10-21): BiRefNet not checked; LivePortrait, MediaPipe, SAM 2 and diffusers not checked in this round. Popularity is not a licence and not a quality measure.

### 13.3 Recommendation

**Do not hold the upload feature.** Build it in three stages, each shipped only when measured:

1. **Stage 1 (no generative model, CPU, all platforms):** M1 + M1a/M1b + M1c (+ optional M2). Output: idle, blink, breathing, tilt, sleep overlay, happy squash. The UI says which states are "animated" and which are "not available". This is the honest first version of CH-05.
2. **Stage 2 (human characters, optional GPU):** M3, only after its weights licence is confirmed and its VRAM and speed are measured on our 6 GB card. Adds natural face motion.
3. **Stage 3 (opt-in, measured):** M4 for missing poses, only if Stage 1 quality is not enough and the measured cost fits 6 GB. M5 cloud only with explicit consent, after the cloud phase.

**Risks:**
- Stage 1 gives fewer states than competitors promise. We say so in the preview.
- Learned models carry weights licences that are often different from the code licence. Each one needs its own check before it is shipped.
- Face-related processing needs a privacy note and must stay local by default.

### 13.4 Open questions for the owner

1. Is "fewer states, honestly labelled" acceptable for the first personal-character release (Stage 1)?
2. Does the owner want human-face motion (Stage 2) at all?
3. Is an opt-in GPU requirement acceptable for Stage 2, or should it be CPU-only?

### 13.5 Verification status of this section

- Verified this session: licence files for BiRefNet (MIT), LivePortrait code (MIT), MediaPipe (Apache-2.0), SAM 2 (Apache-2.0), diffusers (Apache-2.0), Real-ESRGAN (BSD-3-Clause), hatch-pet (Apache-2.0), ComfyUI pipeline (MIT), Rive runtime on npm (MIT); rembg MIT from its README badge.
- Not verified: all model weight licences; LivePortrait VRAM; SAM 2 VRAM; Live2D and Shimeji licences; any competitor's quality claims.
- Not run: any model on our machine.

---

## 14. Emote feasibility: back and three-quarter poses (2026-10-22, Planned, nothing built)

Spec: [EMOTE_FEATURE_SPECS.md](EMOTE_FEATURE_SPECS.md). This section answers: can the current art and format play the eight requested emotes, and which route is better?

**Finding 1 [Certain, from reading `src/features/shell/Bear.tsx`]:** the bear is one front-facing inline SVG (`viewBox 0 0 200 200`) with 13 poses (`idle, wave, sleep, work, type, wait, stow, cheer, party, catch, worried, ring, toss`). Arms have a `side: "l"|"r"` helper only. There is **no back view, profile or three-quarter view.** A CSS horizontal flip shows the *front* mirrored, so it must not be used to imitate a turn.

**Finding 2 [Certain, from CH-01]:** the proposed `loaf-character` package can hold any frames per state, so it *can* carry back and three-quarter frames, but needs a manifest `pose_tags` field (not yet defined) and the frames must be drawn. The format does not generate them.

**Finding 3 [Likely]:** a personal character from one photo (CH-05) shows one view; it has no back and no three-quarter pose, so `back_turn_shake` is permanently unavailable there. Do not invent a back from a front photo without a generative model, and generative models are out (no GPU, owner 2026-10-22).

**Per emote:**

| Emote | Front-only sprite sheet | Rive (layered rig) | Verdict |
|---|---|---|---|
| `back_turn_shake` | Not possible; needs ~8 turnaround frames per character | A rigged Y-turn is poor in 2D; usually art swaps. Needs back/side art anyway | **Unavailable until art exists** |
| `chaotic_dance` | Possible with 36–48 frames; looks repetitive | Better: layers move independently, procedural variety | Rive better, sprite acceptable |
| `tiny_tantrum` | Possible, needs crossed-arms and sit art | Easy with bones/layers | Either |
| `moonwalk_escape` | Possible with side-feet art; window moves either way | Easy | Either; window-move cost is the same |
| `dramatic_crying` | Possible with tear overlay | Easy | Either |
| `smug_taunt` | Possible; needs wink and side walk | Easy | Either |
| `instant_sleep` | Possible; reuse `sleep` | Easy | Either |
| `over_the_top_celebration` | Possible | Easy | Either |

**Sprite sheets versus the approved one-character Rive trial (CH-08):**
- *Sprite sheets* (hatch-pet style, 8×9 atlas of 192×208 cells; or our per-state PNG folders): predictable, tiny runtime, easy to validate, any artist or tool can make them; weak for random, procedural motion; art volume grows linearly (8 emotes × characters × frames).
- *Rive*: small files, state machine built in, MIT web runtime `@rive-app/canvas` 2.45.0, smooth blends; needs authoring in the Rive editor (free tier, **not open-source**; the runtime is), the Rust-side/Tauri behaviour is **Unverified**, and the trial is not yet run.
- **Recommendation [Likely]:** do not choose yet. Build the registry and state machine renderer-agnostic (EM-01/02), implement the simple front-view emotes on the sprite player (CH-02), and let the CH-08 trial decide the renderer for `chaotic_dance`. `back_turn_shake` is gated by art, not by the renderer.

**What would settle it:** (1) the CH-08 trial result; (2) the owner's reference images and a turnaround sheet for one character; (3) an owner Windows check of window movement for Moonwalk.

**Owner decisions (2026-10-22) affecting this document:** limited first release of a personal character (few states from one photo, honestly labelled) is accepted; Peekoo is the reference competitor; face motion is not faces-only and may use the full image, built after the character studio has more characters; no GPU. So the Stage 2 LivePortrait/GPU option in §4 and CH-06 is dropped; the CPU-only local-warp path remains.
