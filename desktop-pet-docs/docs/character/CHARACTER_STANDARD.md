# The Loaf character standard (v1) — one format for every pet

Owner request J1 (2026-10-26): a standard character format, so anyone can build a character, and one character works everywhere. It is **not a new format**: it is the Codex / OpenPets V1 pet pack that Loaf already reads, plus the rules for how Loaf uses it and a default for every reaction. A pack that follows this works in Loaf, Codex and OpenPets.

Companion files: art details in [`PET_ART_SPEC.md`](PET_ART_SPEC.md); the build skill and one-prompt template in [`/skills/loaf-character`](../../../skills/loaf-character/SKILL.md); the importer in `crates/loaf-core/src/pets.rs`.

## 1. What a character is

A folder named by its `id`:

```
<id>/
├── pet.json            id, displayName, description, spritesheetPath
└── spritesheet.webp    1536 x 1872 px, transparent, 8 columns x 9 rows of 192 x 208 px
```

`id`: 1–64 of `A-Z a-z 0-9 - _ .`, the folder name, unique. `spritesheetPath`: exactly `spritesheet.webp` (or `spritesheet.svg`). Optional OpenPets keys (`spriteVersionNumber`, `gazeAnchor`, `category`, `sourceUrl`, `xHandle`) are allowed; anything else is left out. Files only: nothing in a pack is ever run.

## 2. The nine rows

| Row | Name | Frames | Loop (ms) | Draw |
|---|---|---|---|---|
| 0 | idle | 6 | 5500 | calm breathing, a blink, slight head tilt |
| 1 | running-right | 8 | 1060 | walk cycle facing right |
| 2 | running-left | 8 | 1060 | the same facing left |
| 3 | waving | 4 | 700 | friendly wave |
| 4 | jumping | 5 | 840 | crouch, jump, land; joyful |
| 5 | failed | 8 | 1220 | gently sad: brows up, small frown, one tear |
| 6 | waiting | 6 | 1200 | patient, looks at you, small bob |
| 7 | running | 6 | 820 | working, typing on a laptop |
| 8 | review | 6 | 1030 | reading a page, hand to chin |

Rules every frame follows: character centred, **feet on one baseline** about 8 px above the cell bottom, same size in every frame, ~10 px free margin (nothing cut off), one light from the top-left, last frame flows into the first, unused cells fully transparent. Original characters only; no text or logos on the sheet.

## 3. How Loaf uses the rows (the reaction defaults)

Loaf never asks a pack for "a reaction". It plays a **pose**, and the pose maps to a row, so any pack reacts to everything. The map is `ROW_FOR_POSE` in `src/features/character/SpritePet.tsx`:

| Pose | Row | Pose | Row |
|---|---|---|---|
| idle, sleep, back, back_look | idle | work, type | running |
| wave, ring, toss | waving | wait, stow | waiting |
| cheer, party, jump | jumping | catch, review | review |
| worried, sad | failed | turn | running-right |

The built-in bear has its own drawn poses; a pack uses the row above.

**Default reactions** (owner J3, 2026-10-26; each one can be turned off, given another pose, or other words, on **Character → Reactions**, stored in `ui.reactions`):

| Moment | Default pose | Default words | Words can use |
|---|---|---|---|
| A task is added | catch | Got it: {title} | `{title}` |
| A task is started | work | On it: {title} | `{title}` |
| A task is done, more left | cheer | Done! {left} left today | `{left}` |
| Everything is done | party | All done for today! 🎉 | — |
| A task is deleted | toss | Tossed it | — |
| A reminder is due | ring | Reminder: {title} | `{title}` |
| Focus time ends | cheer | (from the session) | — |
| Daily hello | wave | "Good morning, <you>! I'm <pet>, your assistant." + overdue, today's count, or the day's quote | — |

Kind words only (no-guilt rule, FR-92): the `failed` row is a small sadness, never shown because you missed something.

## 4. Checking a pack

1. `python3 skills/loaf-character/scripts/pack.py check <folder>` — size, transparency, frame counts, empty or cut-off frames, a moving baseline.
2. Loaf → **Character → Import pet folder** — the real check; it refuses a bad pack with the reason.
3. Preview: pick the character on the Character page and play each row.

## 5. Versioning and limits

- **v1** = 9 rows (this page). **v2** adds two gaze rows (FR-59, not read by Loaf yet).
- Sheet ≤ 25 MB. Lossless WebP or quality ≥ 90.
- Outfits and activity strips (OpenPets) are planned (FR-64, FR-65); a v1 pack stays valid when they arrive.

## 6. Who can make one

Anyone, with any image tool they already have. Loaf never calls an image service and never pays for AI: the skill is a recipe for *your* tool (the Codex image tool, your own key, or a local model). Check the licence of any reference art you feed it.

*Status: written 2026-10-26. The assembler/checker are tested with synthetic strips; no real AI-made character has been run through it yet, and the final animation is Unverified on a real OS.*
