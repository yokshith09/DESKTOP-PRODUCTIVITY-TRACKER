# Pet art specification — everything needed to build a Pluto pet

A Pluto pet is a **Codex / OpenPets pet pack**, so the same pet works in Pluto, Codex and OpenPets. Pluto checks every pack against this spec on import (`crates/pluto-core/src/pets.rs`) and refuses anything else with a reason.

## 1. Files

```
<pet-id>/
├── pet.json            required
└── spritesheet.webp    required (or spritesheet.svg — never both)
```
Optional later (OpenPets-compatible, not read by Pluto yet): `outfits/<id>.webp` (same size as the main sheet), `activities/<id>.webp` (one-shot strips).

### pet.json
```json
{
  "id": "mochi",
  "displayName": "Mochi",
  "description": "Mochi, the cat",
  "spritesheetPath": "spritesheet.webp"
}
```
| Field | Rule |
|---|---|
| `id` | 1-64 characters: a-z, A-Z, 0-9, `-`, `_`, `.`; also the folder name; unique |
| `displayName` | Shown in the library; not empty |
| `description` | One line |
| `spritesheetPath` | Exactly `spritesheet.webp` or `spritesheet.svg` |
| Optional | `spriteVersionNumber` (2 for the gaze rows), `gazeAnchor {x,y}`, `category`, `sourceUrl`, `xHandle` — keep out anything else |

## 2. Sheet size and grid

| Item | Value |
|---|---|
| Cell (one frame) | **192 × 208 px** (width × height) |
| Columns | **8** |
| Rows | **9** (V1) — or 11 with the gaze rows (V2) |
| Whole sheet | **1536 × 1872 px** (V1) · 1536 × 2288 px (V2) |
| Background | **Transparent** (alpha); unused cells fully transparent |
| Format | WebP (lossless or quality ≥ 90) or static SVG; ≤ 25 MB |
| Character in the cell | Centred horizontally; **feet on the same line in every frame** (~8 px above the cell bottom); leave ~10 px margin top and sides so jumps and arms never get cut |
| Light | One light from the top-left on every frame (left-facing rows too) |
| Scale | The character's height the same in every row (except squash/stretch) |

## 3. Rows = emotions / animations (top to bottom)

| Row | Name | Frames | Plays for | Feeling / what to draw | Timing |
|---|---|---|---|---|---|
| 0 | **idle** | 6 | doing nothing, asleep | calm breathing, a blink, slight head tilt; loops forever | 5.5 s loop |
| 1 | **running-right** | 8 | walking right | full walk/run cycle facing right, legs moving | 1.06 s |
| 2 | **running-left** | 8 | walking left | same cycle facing left (may be the mirror of row 1, re-lit) | 1.06 s |
| 3 | **waving** | 4 | hello, reminders | friendly wave, happy eyes | 0.7 s ×2 |
| 4 | **jumping** | 5 | task done, success, celebration | crouch → jump with arms up → land; joyful | 0.84 s ×2 |
| 5 | **failed** | 8 | error, overdue, missed | sad: brows up, frown, small tear, slump | 1.22 s ×2 |
| 6 | **waiting** | 6 | waiting for you, tests running | patient, looking at the user, small tap/bob | ~1.2 s loop |
| 7 | **running** (working) | 6 | working, typing, busy | focused, typing on a laptop or busy hands | 0.82 s loop |
| 8 | **review** (thinking) | 6 | thinking, reading | reading a page/clipboard, eyes down, hand on chin | 1.03 s loop |
| 9-10 | gaze (V2, optional) | 16 | eyes follow the cursor | head/eyes turned in 16 directions (every 22.5°) | still frames |

Frames run left to right in their row; unused columns stay transparent. Each row must loop cleanly (last frame flows into the first).

**Pluto maps every app event onto these rows** (`ROW_FOR_POSE` in `SpritePet.tsx`; user-editable per event in FR-87).

## 4. Style rules (for Pluto's own pets)

- Cute, rounded, "soft 3D" or clean chibi; thick-enough outline to read at 64 px.
- Readable at 64-160 px on screen: big head (~45% of height), big eyes, simple shapes.
- 3-5 main colours + one accent; no tiny details, no text, no logos.
- Same proportions, colours and outline in every frame.
- Original characters only (no fan art of existing IP).

## 5. Ways to make a pack

1. **Codex `hatch-pet` skill** (OpenAI): give character art + the prompt below → it outputs `pet.json` + `spritesheet.webp` in `~/.codex/pets/<id>/`; Pluto lists it automatically.
2. **Any image generator or artist**: produce the 9 rows to this spec, assemble the 1536×1872 sheet, write `pet.json`.
3. **Pluto's exporter** (our SVG characters): `EXPORT_PACKS=1 pnpm exec vitest run spritePackExport` then `node scripts/svg-to-png.mjs`.

Check: drop the folder into Pluto → Character → **Import pet folder**. It is refused with a reason if anything above is wrong.

## 6. Standard prompt — first character

Use for the character sheet (step 1) and then for `hatch-pet` / row-by-row generation (step 2). Replace the bracketed parts for other characters.

### Step 1 — character reference sheet
```
Create an original cute desktop-pet mascot named "Pluto", a small round bear made of soft
bread-coloured fur (warm golden brown #C98A4B, cream belly and muzzle #F6E3C3, dark brown
eyes and nose), big head about 45% of its height, short arms and legs, tiny round ears,
rosy cheeks, friendly and calm personality.
Style: soft 3D chibi, clean shapes, gentle outline, one light from the top-left, soft
shadow under the feet, no text, no logo, transparent background.
Show a reference sheet: front view, three-quarter view facing right, side view, back view,
and close-ups of 5 expressions: happy, focused, sad, surprised, sleepy.
Keep proportions identical in every view.
```

### Step 2 — animation sheet (hatch-pet or row by row)
```
Using the "Pluto" bear reference, make a Codex pet sprite atlas.
Canvas 1536x1872 px, transparent background, grid of 8 columns x 9 rows, each cell
192x208 px. Character centred in every cell, feet on the same baseline 8 px above the cell
bottom, same size in every frame, 10 px margin so nothing is cut off, light from the top-left.
Rows (frames left to right, unused cells transparent, every row loops smoothly):
Row 1 idle, 6 frames: calm breathing, one blink, slight head tilt.
Row 2 running-right, 8 frames: cheerful walk cycle facing right, legs clearly moving.
Row 3 running-left, 8 frames: the same walk cycle facing left.
Row 4 waving, 4 frames: friendly wave with one paw, happy closed eyes.
Row 5 jumping, 5 frames: crouch, jump with both arms up, peak, fall, land; joyful.
Row 6 failed, 8 frames: sad, brows raised, small frown, one tear, shoulders slump, small sway.
Row 7 waiting, 6 frames: looks at the viewer patiently, small bob, tapping a foot.
Row 8 running (working), 6 frames: typing on a small laptop, focused eyes on the screen.
Row 9 review (thinking), 6 frames: reading a clipboard, eyes moving down the page, paw on chin.
Output spritesheet.webp and pet.json with id "pluto", displayName "Pluto",
description "Pluto, the bread bear".
```

### Quality checklist before importing
- [ ] Sheet is exactly 1536×1872, transparent
- [ ] 9 rows in the order above; frame counts 6/8/8/4/5/8/6/6/6
- [ ] Feet on one baseline; nothing cropped at cell edges
- [ ] Same colours and size in every frame
- [ ] Each row loops without a jump
- [ ] `pet.json` has the 4 fields; id = folder name
