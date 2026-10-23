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

## FR-41 Messages — above the pet only (toast stack removed 2026-10-23)

**Automated:** `src/lib/notify.test.ts` (every message goes to the pet with a pose, 5 s / errors 8 s, long detail dropped, Undo runs once when the pet is clicked, forgotten after the bubble ends) · `src/App.test.tsx` "saving a task says so and goes back…" (bubble "Task saved", nothing in the dashboard), "deleting a note offers Undo…" (Undo by clicking the pet), Settings data and shortcut tests (messages as bubbles) · `src/pet/PetApp.test.tsx` "a bubble with an action…" and "a reminder's Done is marked right from the pet" · `src/pet/reactions.test.ts` (ReminderDue carries Done; actions need id + label).
**Manual (Windows):**
1. Add a task on Today → the pet says "Task added"; **nothing appears in the dashboard**.
2. Complete a task → the pet cheers "Task done".
3. Open a task from Today, change the title, **Save changes** → the task window closes, you are on Today, the pet says "Task saved".
4. Notes → delete a note → the pet says "Moved to Bin · click: Undo" → click the pet → the note is back (and the dashboard did not open).
5. Set a reminder 1 minute ahead → the pet rings "Reminder: … · click: Done" → click → the reminder is done.
6. Hide the pet, delete a note → no message anywhere (known; see DECISIONS 2026-10-23 night).

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

---

## FR-43 / FR-85 Routine reminder above the pet

**Automated:** `src/pet/reactions.test.ts` "messages from the dashboard (FR-43)" · `src/pet/PetApp.test.tsx` "shows a message from the dashboard above the pet" · `src/features/routine/RoutineCard.test.tsx` (the reminder also goes to the pet).
**Manual (Windows):** with the pet visible and the dashboard closed to the tray, set the routine reminder 2 minutes ahead with an item unticked → the pet shows "You have N daily routine tasks pending" in a bubble for ~10 s, and the dashboard shows the card when opened.

## FR-52 Meeting tasks on Today

**Automated:** `crates/loaf-core/src/meetings.rs` converting test (planned for today) · `src/App.test.tsx` "a task made from a meeting shows on Today with the meeting named (FR-52)".
**Manual (Windows):** Meetings → open a meeting → action item → **Convert to task** → Today shows the task with a purple chip naming the meeting; hover shows "From the meeting “…”".

---

## FR-96 Notification budget · FR-90 forgiving routine · FR-92 no-guilt

**Automated:** `src/lib/nudges.test.ts` (once per kind per day, 1 h gap, 4/day cap, quiet hours, broken data) · `src/features/routine/routine.test.ts` "counts days done in the last week, and a missed day never wipes it" · `RoutineCard.test.tsx` "respects the notification budget" · `src/lib/noGuilt.test.ts` (scans all UI strings for shaming copy; self-check).
**Manual (Windows):** tick an item two days in a row → "2/7" appears; skip a day → it stays (not reset). Get the greeting and then set the routine reminder for 10 minutes later → the reminder waits (1-hour gap). After 22:00 nothing pops up.

## FR-93 / FR-94 Pet age, birthdays, hello once a day

**Automated:** `src/features/companion/companion.test.ts` (age counting, birthdays incl. not on day 0, greeting wording by time, one greeting a day with birthdays first, broken data) · `CompanionPanel.test.tsx` (pet birthday fixed on first use, name + birthday saved without year, hello toggle, greets once by name and not again, birthday wish, silent when off or in quiet hours).
**Manual (Windows):** Character → About you and your pet → type your name, pick a birthday → "Loaf is born today" on day 1. Quit and restart Loaf (or lock/unlock the PC) on a new day after 08:00 → the pet says "Good morning, <name>!" once; restarting again the same day shows nothing. Set your birthday to today (and clear the day's greeting by waiting until tomorrow) → "Happy birthday, <name>! 🎂".

Last run 2026-10-23 (end of phase): front-end 198 passed / 5 skipped (31 files); Rust 386 passed; lint, typecheck, fmt clean.

---

## FR-63 Import ZIP · FR-96 adjustable notifications

**Automated:** `crates/loaf-core/src/pets.rs` — installs_a_pack_from_a_zip_with_a_top_folder_and_extra_files, installs_a_pack_from_a_zip_without_a_folder, refuses_bad_zips (no pet.json, two pets, wrong size, not a ZIP, `../` path) · `PetLibrary.test.tsx` "imports a downloaded pet ZIP" · `src/lib/nudges.test.ts` "uses the user's own limits" · `src/features/settings/NudgeSettings.test.tsx`. The owner's `Kayadu_LOAF_Character_Pack.zip` was imported by the same checker in a one-off run (2026-10-23): id `kayadu-lohar`, 9 rows, WebP.
**Manual (Windows):** Character → Pet library → **Import ZIP** → pick `Kayadu_LOAF_Character_Pack.zip` → "Kayadu added" → **Use** → the desktop pet becomes Kayadu. Settings → Pet notifications → set 1 nudge a day → after the greeting, no routine reminder appears that day.

Last run 2026-10-23 (afternoon): front-end 201 passed / 5 skipped; Rust 389 passed; lint, typecheck, clippy, fmt, core-deps clean.

---

## Pet visibility fixes (B1-B6, S1)

**Automated:** `src-tauri/src/pet.rs` — a_saved_spot_needs_the_pets_centre_on_a_screen, show_or_hide_follows_what_is_on_screen, a_long_gap_between_ticks_means_the_computer_slept · `src-tauri/src/tray.rs` menu tests (Bring the pet back) · `CompanionPanel.test.tsx` "catches up when the computer wakes".
**Manual (Windows):**
1. Click the pet, press **Alt+F4** → pet hides. Quit and start Loaf → **the pet is back** (before: stayed hidden).
2. Pet visible → sleep the PC 5+ minutes → wake → within a minute the pet is on screen.
3. Unplug / turn off the second monitor the pet sits on → within a minute it moves to the main screen.
4. Tray → **Show or hide pet** once → it toggles in **one** click every time.
5. Tray → **Bring the pet back** → pet appears bottom-right of the main screen.
6. Change display scale (Settings → Display → 125%) → pet stays the right size and on screen.

## FR-104 macOS Arc / Firefox / Safari

**Automated:** `crates/loaf-core/src/firefox.rs` (mozlz4 decode, front window's site, tab list with active marked, newest profile) · settings tests (`tracking.safari` default off). The AppleScript parts only compile on macOS (checked by CI on macos-latest) and can't be unit-tested.
**Manual (Mac):** turn on app + website tracking → use Arc for a minute → Time shows the Arc site; an Arc incognito window records nothing. Firefox → site appears within ~15 s; a private window records nothing. Safari → nothing until **Include Safari** is on. Open tabs: Arc and Safari tabs listed and closable; Firefox tabs listed without a close button. Browsers that aren't running are not launched.

Last run 2026-10-23 (evening): front-end 202 passed / 5 skipped; Rust 396 passed; lint, typecheck, clippy, fmt, core-deps clean.

Last run 2026-10-23 (night, notifications above the pet): front-end 208 passed / 5 skipped (32 files); lint, typecheck clean. Rust unchanged since the evening run (396 passed).

---

## FR-106…FR-109 Task links, stars, chosen days, repeating tasks

**Automated:** core `crates/loaf-core/src/task_plans.rs` (rule text round-trip, weekdays checked, repeats only between start and end, links get https / lose duplicates / refuse unsafe, days-or-rule, links saved in order, starred first, chosen days on Today, tick per day with history, ticks refused off-rule / future / ordinary tasks, clearing the plan) · `reminders.rs` "a starred reminder comes first" · `db/tests.rs` migration 4 (checks, cascade) · `src/lib/repeat.test.ts` (same answers as the core, clock change) · `src/features/tasks/TaskBits.test.tsx` · `repeatReminder.test.ts` · `src/App.test.tsx` "task upgrades" (links next to the task and opening, starring on Today and reminders, chosen days, repeat tick and record).
**Manual (Windows):**
1. Tasks → All → open a task → paste `github.com/…` in **Links**, name it, Add; add a second link → close → both chips are next to the task; click one → the browser opens it.
2. Hover a task on Today → ☆ → it moves to the top with a filled star. Star a reminder the same way.
3. Open a task → **When → Chosen days** → pick Today and two more days → Save → "3 days" next to it; it is on Today today, and on each chosen day.
4. **When → Repeats → On days of the week** → pick today's weekday → Save → on Today tick it → "Ticked for today" above the pet and it leaves Today; it comes back next week. Skip a day → open the task → that day is listed as "not ticked"; click it to tick late.
5. Settings → Pet notifications → **Repeating tasks still open** → set 2 minutes ahead with one unticked → the pet says "Still open today: …" once.
6. Export data, delete all, import → links, stars, days and ticks are back.

Last run 2026-10-23 (late night): front-end 226 passed / 5 skipped (35 files); Rust 414 passed; lint, typecheck, clippy, fmt, core-deps clean.

---

## FR-05 Focus sessions · FR-110 Timer by the pet

**Automated:** core `crates/loaf-core/src/focus.rs` (time left without pauses, one running at a time, pause/resume/+5/finish on time and only once, stop keeps minutes, finished at the right time after a restart, label kept when the task is deleted) · `db/tests.rs` migration 5 · `settings.rs` `pet.hover_card` default on · `src/lib/focus.test.ts` · `src/pet/glance.test.ts` · `src/pet/reactions.test.ts` "focus sessions" · `src/pet/PetApp.test.tsx` (timer by the pet with pause; cheer + Break by click; hover card off → bubble) · `src/App.test.tsx` "focus sessions (FR-05)".
**Manual (Windows):**
1. Today → **Focus 25 min** → a timer appears above (or below, near the top of the screen) the pet and counts down; the Today bar shows the same with Pause, +, Stop.
2. Click ❚❚ on the pet's timer → it stops counting; ▶ → it continues.
3. Start a 1-minute... (use 15 min and wait, or +5 then Stop) → at zero the pet cheers "Nice: 15 min. Break 5 min?" → click the pet → a 5-minute break timer starts; at its end "Break's over."
4. Open a task → **Focus 25 min** → the timer shows the task's name.
5. Start focus, quit Loaf, start it again 30 minutes later → no timer; the session counted as done.
6. Character → turn off **Card when I hover the pet** → hover → a short bubble with focus time / next task / next reminder instead of the card.
7. Drag the pet to the top edge while focusing → the timer moves below it.

Last run 2026-10-23 (focus): front-end 237 passed / 5 skipped (37 files); Rust 425 passed; lint, typecheck, clippy, fmt, core-deps clean.

---

## FR-111 Hover-card shortcuts · messages in the dashboard when the pet is hidden

**Automated:** `src/pet/PetApp.test.tsx` "the hover card has shortcuts…" · `src/components/Notices.test.tsx`.
**Manual (Windows):** hover the pet → the card's bottom row: **Focus 25** starts the timer (button becomes Stop focus); **Add note** opens the dashboard with a new note; **Sleep** → the pet sleeps even while you hover; **Wake** or a click wakes it. Today's tasks on the card are tinted rows. Character → turn **Show on desktop** off → delete a note → "Moved to Bin" with Undo appears bottom-right in the dashboard.

Last run 2026-10-23: front-end 239 passed / 5 skipped; Rust 425 passed; lint, typecheck, clippy, fmt clean.

---

## FR-46 Auto-delete and the task Bin

**Automated:** `crates/loaf-core/src/retention.rs` (never touches anything by default; only old time + old completed tasks go and the preview matches; restore / purge after 30 days; only offered ages) · `src/features/settings/autoDelete.test.ts` · `src/App.test.tsx` "auto-delete (FR-46)".
**Manual (Windows):** Settings → Auto-delete → Completed tasks → 30 days → a dialog says how many tasks would move → **Keep everything** changes nothing; again → **Turn on** → those tasks leave Completed and appear in **Bin → Completed tasks**; Restore brings one back. Notes, meetings, reminders and open tasks are unchanged. Export → import still includes everything.
