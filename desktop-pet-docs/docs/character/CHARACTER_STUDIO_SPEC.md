# Character Studio and sprite packs (FR-49, FR-50)

> Status: **Planned**. The pack exporter and five generated packs exist (**Unverified**: no pet engine has loaded them). The Studio UI is not built. Owner decisions 2026-10-22: sprite characters, not Rive; a Studio like OpenPets; personal-photo characters on HOLD; gallery YES; plugins YES.
> OpenPets facts below come from search results and its GitHub page; the site itself could not be fetched, so field names and pixel sizes are **unconfirmed** (D-SIZE).

## 1. Metadata
| Field | Value |
|---|---|
| IDs | FR-49 (accessories), FR-50 (packs and Studio) |
| Milestone | FM-CS (delivery order 5) |
| Depends on | FR-48 not needed; FR-56 (gallery) and FR-55 (plugins) only for sharing |
| Size | XL |

## 2. Story
As a student I open the Character page, pick a character, put a hat and glasses on it, see every animation row, and save it. Later I install a pack someone shared.

## 3. Behaviour
1. **Library:** built-in characters (Loaf, Mochi, Pip, Bolt, Ghosty) plus installed packs, shown as cards.
2. **Preview:** a row picker (idle, running-right, running-left, waving, jumping, failed, waiting, running, review) plays the row at 8 fps. Rows marked `derived` show a "needs art" badge.
3. **Accessories (FR-49):** slots hat, glasses, scarf, bow, headphones; one item per slot; saved per character in settings. Drawn as SVG layers over the character, anchored per character.
4. **Reaction mapping (like OpenPets):** each Loaf event (task done, reminder, focus end, idle) maps to a pack row. Defaults shipped; user can change. Off-by-default contextual reactions stay off.
5. **Import / export:** export a character as a pack folder or `.zip`; import validates before installing.
6. **Describe/upload to animate (OpenPets "Studio"):** **not now.** Needs the image-generation decision; personal characters are on HOLD.

## 4. Plain language
A pack is a picture sheet of your pet doing things, plus a small file saying which row is which.

## 5. Technical design
- Layout in `src/features/character/spritePack.ts`: 8 columns x 9 rows, 192x208 cells; row names and frame counts as in section 3.2. Generator: `spritePackExport.test.tsx` (opt-in) and `scripts/svg-to-png.mjs`. Output: `packs/<id>/{pet.json,spritesheet.png}`.
- `pet.json` fields: id, displayName, description, spritesheetPath, cell, columns, rows[{name,frames,pose,source}], license, status. OpenPets compatibility of these names is **unconfirmed**.
- Rendering in the pet window: CSS `background-position` stepping on the sheet (no canvas needed). Built-in SVG characters stay for the Studio preview.
- Install location: app data `characters/<id>/`; validation: size limit, PNG only, dimensions match, no scripts (SVG excluded from installable packs).

## 6. Choices
| ID | Question | Recommendation |
|---|---|---|
| D-SIZE | 192x208 (compatible, unconfirmed) or 256x256 | Keep 192x208 until the schema is confirmed |
| Q7 | Rows with no drawn art: leave empty or derive | Derive and badge (done in the generated packs) |
| D-LICENCE | Licence for our packs and for the gallery | Owner decision |

## 7. Ordered tasks
1. Done: layout module, exporter, five packs (Unverified).
2. Pack validator (Rust core) with tests.
3. Pet window sprite renderer behind a setting.
4. Studio page: library, row preview, badges.
5. Accessories layers and slots.
6. Reaction mapping UI.
7. Import/export.
8. ~~Real art for the `derived` rows~~ done 2026-10-22 (jump, sad, review poses).

## 8. Tests
Layout (done: `spritePack.test.tsx`); validator rejects wrong size, extra files, non-PNG; renderer steps frames and respects reduced motion; accessory slots save and restore; import is atomic.

## 9. Edge cases
Corrupt PNG; pack with missing rows (fall back to idle); huge file; two packs with one id; reduced motion (show first frame); pack removed while selected (fall back to the bear).

## 10. Acceptance
Owner picks a character, adds an accessory, sees all nine rows, exports and re-imports the pack, on Windows.

## 11. Checklist
- [x] Layout module and tests
- [x] Exporter and five packs (Unverified)
- [ ] Validator, renderer, Studio, accessories, mapping, import/export

## 12. Docs to update
PROJECT_STATUS, ROADMAP, FEATURE_ROADMAP FR-49/FR-50, CHANGELOG, `../competitors/OPENPETS_RESEARCH_2026-10-22.md`.

## 13. Dependencies and exclusions
Excluded: personal photos (HOLD), Rive, AI generation, code signing. The gallery (FR-56) and plugins (FR-55) reuse this pack format.
