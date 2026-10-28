# How other desktop pets are built (research, 2026-10-28)

Sources: openpets.dev/alternatives (updated 2026-08-20), the Codex `hatch-pet` skill as vendored in nexu-io/open-design (`skills/hatch-pet/SKILL.md`, 2026-08-18), the Codex community thread "Show us your custom Codex Pet", and an AI-with-Aish write-up on building a Codex pet. **Certain** = stated in a source. *Inferred* = my reading, not stated.

## What the format is (Certain)
- `pet.json` with `id`, `displayName`, `description`, `spriteVersionNumber` (some packs), `spritesheetPath`; plus `spritesheet.webp`.
- Sheet 1536x1872: 8 columns x 9 rows of 192x208 cells; unused cells fully transparent.
- Rows: idle, running-right, running-left, waving, jumping, failed, waiting, running, review.
- OpenPets calls its format "standard transparent PNG spritesheets with JSON behaviour definitions"; Shimeji uses frame folders + XML; VPet uses Steam Workshop skins. 1,300+ pets in the OpenPets gallery.

## How Codex `hatch-pet` makes one (Certain unless marked)
1. `prepare_pet_run.py` makes a run folder, a job list, a chroma-key colour chosen per pet, and **nine layout-guide images** (one per row: frame count, spacing, centring, safe padding). Guides are construction aids; nothing of them may appear in the result.
2. Job 1 = **base pet** (from the user's reference, or from text). It becomes `canonical-base.png`, the identity source of truth.
3. Jobs 2-10 = **one row strip each**. Every row job gets the base, the original references and its layout guide as input images; only the base may be prompt-only. `idle` and `running-right` go first as an identity/gait check. `running-left` is a **mirror of running-right** only if the pet is symmetric (no handed prop, text, one-sided marking), otherwise drawn.
4. Strips are generated on a flat chroma-key background. Scripts then extract frames, remove the key, place each frame in a 192x208 cell, compose the atlas, and write a **contact sheet, a per-row review.json, validation.json and preview videos**. *Inferred:* frame extraction works on connected components, which is why the skill forbids detached effects (floating sparkles, shadows, speed lines would be read as separate sprites).
5. A row that fails is **repaired alone** (`queue_pet_repairs.py`), grounded by the base, the references and the exact failure note. Identity drift counts as a failure even when geometry passes.
6. Style rule: small pixel-art-adjacent mascot, chunky silhouette, thick dark 1-2 px outline, flat cel shading, limited palette, simple face. No gradients, glow, shadows, motion lines, text.
7. Image generation is delegated to the built-in image tool; code never draws art. Row jobs run in parallel as subagents; the parent owns the manifest and packaging.

## What this means for Loaf
| OpenPets / Codex does | Loaf does |
|---|---|
| Needs the Codex app, many jobs, subagents | One prompt in Codex; the user gives a name and one reference image and gets one ZIP |
| Geometry QA only (cell fits, non-empty) | **Alignment is enforced by code**: one baseline, one centre per row, one scale per pet, so frames cannot jitter; the checker rejects what the script cannot fix |
| No pet-specific details | `loaf.json` beside `pet.json`: reactions, special, licence (strict importers never see our keys) |
| Reactions fixed by the app | Events are common to all pets; each pack may offer its own animation per event and the user can choose one (D-REACT) |

Open question for the owner: the Codex skill needs the Codex app; our prompt assumes the owner (or any user) has it. If not, any image tool works but they must give it the same prompts and put the strips in one folder.
