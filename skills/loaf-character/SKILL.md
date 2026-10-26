---
name: loaf-character
description: Build a Loaf desktop-pet character from one description. Use when the user wants to create, redo or fix a pet pack (pet.json + spritesheet.webp) for Loaf, Codex or OpenPets, with the Codex image tool or any image generator.
---

# Build a Loaf character from one prompt

You turn **one description** into a finished pet pack that Loaf can import, and that Codex and OpenPets can also use. The standard it follows is `desktop-pet-docs/docs/character/CHARACTER_STANDARD.md` (8 columns x 9 rows of 192x208 px, 1536x1872 sheet, transparent).

## Rules

- **Never pay for AI on the user's behalf.** Use the image tool the user already has (the Codex image tool, their own key, or a local model). Loaf itself never calls an image service.
- **Original characters only.** Refuse fan art of existing characters, logos, text on the sheet, or real people.
- **Check licences.** If the user gives you reference art or a model, ask who made it and whether they may use it; say so in `pet.json` `description`.
- **Kind characters.** No sad-because-you-failed copy; the `failed` row is a small, gentle sad.
- Ask the user at most **one** question, and only if the description has no species or look at all.

## Steps

1. **Read the one prompt.** The user gives a description ("a small round fox in a green scarf, calm and curious"). Keep their words; fill gaps from `prompt.md` (colours, proportions, personality).
2. **Reference sheet.** Fill in `prompt.md` step 1 and generate a single reference sheet (front, three-quarter, side, back, five expressions). Show it and let the user say "yes" or what to change. Do not go on until they approve.
3. **Nine row strips.** For each row in `prompt.md` step 2, generate one strip, `<row>.png`, sized `192*frames` x `208` px, transparent, using the approved reference every time (same colours, same size, feet on one line ~8 px above the bottom). Save them in one folder:
   `idle.png` (6 frames), `running-right.png` (8), `running-left.png` (8), `waving.png` (4), `jumping.png` (5), `failed.png` (8), `waiting.png` (6), `running.png` (6), `review.png` (6).
   If the tool cannot produce exact sizes, generate larger and resize each frame into its 192x208 cell without stretching.
4. **Assemble and check.** Run:
   `python3 skills/loaf-character/scripts/pack.py assemble <strips-dir> <out-dir>/<id> --id <id> --name "<Name>" --description "<one line>"`
   (needs `pip install pillow`). It writes `pet.json` and `spritesheet.webp` and then checks the pack. Read every line it prints, fix the named strip, and run it again until it says OK.
5. **Hand it over.** Tell the user to open Loaf, go to **Character**, choose **Import pet folder**, and pick the folder, or copy it to `~/.codex/pets/<id>/` (Loaf lists it by itself). Remind them that nobody has verified the animation on every OS and the preview in Loaf is the real test.

## If a row looks wrong

- Frames that are the same picture nudged a few pixels will play as "still". Redraw that row with clearly different poses (see the table in the standard).
- Feet jumping up and down: ask the tool to keep one baseline, or shift each frame so the lowest opaque pixel sits at y = 200.
- Anything cut off at a cell edge: reduce the character, keep ~10 px margin.

## Files

- `prompt.md` — the one prompt template (fill the brackets).
- `scripts/pack.py` — `assemble` and `check`; `scripts/test_pack.py` tests them.
