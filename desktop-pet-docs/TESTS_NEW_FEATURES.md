# Tests for features built after v2.0.0 (source 0.2.0)

Two parts for every feature: **automated tests** (run in CI and with the commands below; their result is real evidence) and **manual Windows checks** (the owner runs them on the installed app; until then the feature is **Unverified**).

Run everything:
```
pnpm typecheck && pnpm lint && pnpm test
cargo fmt --all && cargo clippy --workspace --all-targets -- -D warnings && cargo test --workspace
```
Last run (2026-10-23, this machine): see the bottom of this file.

---

## FR-63 Pet library (Codex / OpenPets pets)

### Automated
| Test | File | Proves |
|---|---|---|
| reads_webp_sizes_from_all_three_headers | `crates/loaf-core/src/pets.rs` | Loaf reads the image size of every WebP kind (VP8L, VP8X, VP8) |
| reads_svg_size | same | SVG sheets are measured too |
| accepts_v1_and_v2_atlases_only | same | Only 1536×1872 (9 rows) and 1536×2288 (11 rows) are accepted |
| ids_cannot_escape_the_folder | same | A pet id like `..` or `a/b` is refused (no writing outside the pets folder) |
| checks_installs_and_lists_a_pack | same | Import copies the pack, lists it, and re-importing replaces it |
| refuses_bad_packs_with_a_reason | same | Wrong size, bad id, missing `pet.json` are refused with a readable reason |
| our_own_packs_pass_the_check | same | Our 5 packs (bear, mochi, pip, bolt, ghosty) pass the same check |
| uses the OpenPets frame counts and a row for every bear pose | `src/features/character/PetLibrary.test.tsx` | Animation timing matches OpenPets; every reaction has a row |
| shows the right cell of the sheet | same | The player shows the correct frame |
| lists Codex and imported pets and picks one as the desktop pet | same | Library lists both sources; "Use" saves the choice; Codex pets can't be deleted from Loaf |
| imports a folder and refreshes the list | same | Import button works |
| removing the pet in use goes back to the bear | same | Deleting the active pet restores the bear |
| shows the chosen pet pack instead of the bear | `src/pet/PetApp.test.tsx` | The desktop pet shows the chosen pack |
| falls back to the bear when the chosen pack is missing | same | A deleted/missing pack never leaves an empty pet |
| pet.pack setting (all_defaults_exist, missing_keys_return_their_defaults) | `settings.rs`, `settings_service.rs` | New setting defaults to the bear |

### Manual (Windows)
1. Open **Character**. Under **Pet library** you see "Loaf the bear — In use".
2. In a terminal: `npx petdex install boba` (or any pet). Reopen Character → the pet appears, labelled "From Codex / Petdex", playing its idle animation.
3. Click **Use** → the desktop pet changes to it within a second. Add a task and complete it → the pet plays its jumping row.
4. Click **Import pet folder**, choose an unzipped pet folder → "<name> added". Choose a random folder → a clear error, nothing added.
5. Click the bin icon on an imported pet that is in use → the desktop pet goes back to the bear.
6. Restart Loaf → your chosen pet is still the desktop pet.

---

## FR-47 Remove Logs rows from Settings

**Automated:** `src/App.test.tsx` — "shows where data lives, has no log rows (FR-47)…" checks the "Open logs folder" button and "Log detail" control are gone.
**Manual:** Settings → Advanced has no "Log detail" or "Log files". Loaf still writes its log file (Explorer: the logs folder in the data folder keeps growing).

---

## FR-61 Rename links

**Automated:** `src/App.test.tsx` — "a link can be renamed and its address changed (FR-61)": rename, change address, refuse "not a link", Esc cancels.
**Manual:**
1. Today → Links → hover a link → ✏️. Change the name → Save → new name shows.
2. Change the address to `example.org/new` → click the link → the new page opens.
3. Type `hello world` as the address → "That isn't a link." and nothing changes.
4. Open the edit again, press Esc → nothing changes.

---

## FR-42 Task ↔ note links, Links in Notes

**Automated:**
- Core: `crates/loaf-core/src/tasks.rs` — `the_note_filter_lists_only_tasks_linked_to_that_note`.
- `src/App.test.tsx` — "a task makes a linked note, opens it, and the note lists the task back (FR-42)".
- `src/App.test.tsx` — "Notes shows the Links card too (FR-42, V2-08)".

**Manual:**
1. Open a task with no linked note → **New note from this task** → a note opens titled like the task, with the task's details as text, and "Linked tasks" shows the task.
2. Close the note → the task now shows **Open note** → it opens the same note.
3. In the note, click the task under "Linked tasks" → the task opens.
4. Pick a different note in the "Linked note" list, **Save changes**, **Open note** → the chosen note opens.
5. Notes page → the **Links** card is in the top row; adding a link there also shows it on Today.

---

## Earlier built, still Unverified (from this session)
- Character turned views and back-turn shake (`CharacterViews.test.tsx`, `Characters.test.tsx`).
- New sprite poses jump / sad / review (`spritePack.test.tsx` "sprite-only poses").
- Sprite packs (`spritePack.test.tsx` layout tests; `our_own_packs_pass_the_check`).

---

## FR-41 Toast stack

**Automated:** `src/lib/notify.test.ts` (5 s cards, errors longer, Undo action) · `src/App.test.tsx` "saving a task says so and goes back to where it was opened (FR-41)".
**Manual (Windows):**
1. Add a task on Today → a card "Task added" bottom-right, gone after ~5 s; hover keeps it.
2. Complete a task → "Task done".
3. Open a task from Today, change the title, **Save changes** → the task window closes, you are on Today, "Task saved" shows.
4. Trigger 5 messages quickly → at most 3 visible.

## FR-85 Daily routine

**Automated:** `src/features/routine/routine.test.ts` (add/rename/tick/remove, cap 30, new day reset + history, streaks, message wording, reminds once/after time/only when pending, broken data) · `src/features/routine/RoutineCard.test.tsx` (add & tick with progress, fresh on a new day, bell on/off, reminder fires once with "You have 3 daily routine tasks pending", silent when all done or already reminded).
**Manual (Windows):**
1. Today → **Daily routine** tile → add "Drink water", "Revise 30 min", "Walk" → "0 of 3 done".
2. Tick one → ring fills, "1 of 3 done". Double-click a name to rename. Hover → ✕ removes.
3. Set "Remind at" to 2 minutes from now, leave one unticked → a card "You have 2 daily routine tasks pending" appears once; it does not repeat.
4. Tick all, set the time again → nothing appears.
5. Next morning → all unticked again; an item done two days running shows 🔥2.
6. Bell icon → reminder off; no card at the time.

Last run 2026-10-23: front-end 175 passed / 5 skipped (27 files); Rust 386 passed; lint and typecheck clean.
