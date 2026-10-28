---
name: loaf-character
description: Make a Loaf desktop-pet character from a name and one reference picture, and hand back one ZIP that imports straight into Loaf (and works in Codex and OpenPets). Use when the user wants to create, redo or repair a pet for Loaf with the Codex built-in image tool.
---

# Make a Loaf character: name + picture in, one ZIP out

**Input:** a pet name, and (normally) one reference picture the user attached. Nothing else.
**Output:** `<run>/out/<id>.zip` containing `pet.json`, `spritesheet.webp` (1536x1872, 8x9 cells of 192x208, transparent) and `loaf.json` (the character's own reactions and special). In Loaf: **Character → Import → pick the .zip**. The same folder also works in Codex (`~/.codex/pets/<id>/`) and OpenPets.

How it works (the same shape as the Codex `hatch-pet` skill, see `desktop-pet-docs/docs/character/RESEARCH_PET_PIPELINES.md`): one base picture, then one strip per animation row, each copied from the base; scripts then do everything that must be exact (cutting frames, one scale, one baseline, one centre, jump limits, zip). **You never draw or edit art with code.** Pictures come only from the image tool.

## Rules

- Use the **Codex built-in image tool** (`$imagegen`). Do not call a paid image API, and never spend the user's money; if the built-in tool is unavailable, stop and say so.
- **Original characters only.** Refuse fan art of existing characters, logos, text on the sheet, or real people. If the reference is someone else's artwork, say in `pet.json` description who made it and ask only if the user did not say they may use it.
- Kind tone: the `failed` row is a small, gentle sad.
- **Do not ask questions.** The name and picture are enough. If the name is missing, choose a short friendly one from the picture.
- Never mark a job done by editing `jobs.json` or by copying files in some other way than saving the chosen picture to its `save_as` path.

## Steps

1. **Prepare.** `python3 skills/loaf-character/scripts/pack.py prepare <run> --name "<Name>" --reference <picture>` (needs `pip install pillow`). It picks a background colour that is not in the pet, makes a layout guide per row and writes ten finished prompts and `<run>/jobs.json` (base + nine rows). Keep a visible checklist: *Getting <Name> ready → Imagining <Name>'s main look → Picturing <Name>'s poses → Hatching <Name>*.
2. **Base.** Run the `base` job: give `$imagegen` the prompt file text and the listed input images; look at the result (identity right? whole body, centred, flat background, no shadow/text?); save the chosen picture to its `save_as`. Redo until it is right. Everything else copies this picture.
3. **Rows.** For every other job in order, give `$imagegen` the prompt text **and every listed input image** (base, the user's picture, the row's guide). A row without the base attached is invalid. Do `idle` and `running-right` first as an identity check. If the character is symmetric (no handed prop, one-sided mark or text) skip `running-left` and use `--mirror-left` at the end; otherwise draw it. Check each result: exactly the right number of frames, one character per slot, same character as the base, flat background, no detached effects. Save the chosen picture to `save_as`. (With subagents available, rows may run in parallel; only you save files.)
4. **Its own reactions and special.** From the character's personality write `<run>/loaf.json`:
   `{"reactions":{"task-done":"jump"},"special":{"name":"Zoomies","pose":"jump","line":"Zoomies!","trigger":"click","every":5}}`
   - moments (any, optional, pick 2-3): `task-added task-started task-done all-done task-deleted reminder focus-done`
   - poses: `idle wave work type wait stow cheer party catch worried ring toss jump sad review`
   - exactly **one special**: a `name` (≤30 chars), a `line` (≤80 chars, in the pet's voice), a `pose`, a `trigger` (`click`, `tasks` or `daily`) and `every` (2-50; for `daily` write 2)
5. **Build.** `python3 skills/loaf-character/scripts/pack.py finish <run> --extras <run>/loaf.json [--mirror-left]`. Read every line it prints. It names the failing row (feet moving, sliding, size popping, cut off, empty frame); regenerate **only that row** with the same inputs plus the failure note, save it, and run `finish` again. It writes `<run>/out/<id>.zip` and `<run>/out/qa/contact-sheet.png` (red line = baseline, blue = centre) and a `.gif` per row.
6. **Look.** Open `contact-sheet.png`. Passing the script is not enough: block the pet if any row looks like a different character (face, markings, palette, prop, outline) or an animation does not read.
7. **Hand over.** Give the user the ZIP path and: *Loaf → Character → Import → choose the .zip*. Say that nobody has watched it play on their PC yet: the preview on the Character page is the real test.

## If a row is wrong

- Frames the same picture nudged: redo the row asking for clearly different poses.
- Cut off or touching a neighbour: redo it smaller, with more space between frames.
- A shadow, glow, speed lines or floating sparkle: redo; they break the cut-out.
- Different pet: redo with the base and the reference attached and the row's identity sentence quoted.

## Files

- `prompt.md` — the one prompt the user pastes.
- `scripts/pack.py` — `prepare`, `status`, `finish`, `build`, `assemble`, `check`; `scripts/prep.py` (prompts and guides), `scripts/align.py` (the alignment rules); `scripts/test_pack.py` tests them.
