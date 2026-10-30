# Pluto 0.3.0 — test checklist (Windows first, then macOS)

Tick each box on the installed draft. Anything that fails: note what you did and what happened, and send it. Detailed steps per feature are in `TESTS_NEW_FEATURES.md`.

## 0. Before you start
- [ ] Old version: Settings → Your data → **Export** (keep the file).
- [ ] Install 0.3.0 over it (Windows: More info → Run anyway). It opens; your notes, tasks and meetings are all there.
- [ ] Data folder has a new backup file from before the update.

## 1. Pet basics
- [ ] Pet appears bottom-right on first start; drag it; restart Pluto → same spot.
- [ ] Click → dashboard opens; double-click → dashboard hides; right-click → menu.
- [ ] Alt+F4 on the pet → hides; restart → pet is back.
- [ ] Sleep the PC 5 min, wake → pet is on screen within a minute.
- [ ] Tray → **Bring the pet back** works; **Show or hide pet** toggles in one click.
- [ ] Drag the pet to each screen edge and corner, hover → card never goes off-screen.

## 2. Messages above the pet
- [ ] Add a task → pet says "Task added"; nothing pops up in the dashboard.
- [ ] Delete a note → "Moved to Bin · click: Undo" → click the pet → note is back.
- [ ] Reminder 1 min ahead → pet rings "Reminder: … · click: Done" → click → done.
- [ ] Turn **Show on desktop** off → delete a note → message appears **bottom-right of the dashboard** with Undo.

## 3. Hover card
- [ ] Hover → card: time today, top apps, tasks as **tinted rows** (starred ones with a star), next reminder.
- [ ] **Focus 25** starts a timer; button becomes **Stop focus**.
- [ ] **Add note** opens the dashboard with a new note.
- [ ] **Sleep** → pet sleeps even while hovered; **Wake** (or a click) wakes it.
- [ ] Character → **Card when I hover the pet** off → hover shows a short bubble instead.

## 4. Focus sessions
- [ ] Today → Focus 15 → timer above (or below at top of screen) the pet, counting down.
- [ ] Pause on the pet's timer and on Today; +5; Stop.
- [ ] Let one finish → pet: "Nice: 15 min… Break 5 min?" → click → 5-min break starts → "Break's over".
- [ ] Task → **Focus 25 min** → timer shows the task name.
- [ ] Start focus, quit Pluto, reopen after it would have ended → no timer, no error.

## 5. Tasks
- [ ] Task → add 2 links (one with a name) → chips appear **next to the task** on Today and Tasks → click opens the browser.
- [ ] `javascript:` link is refused with a message.
- [ ] Star a task → it moves to the top; star a reminder.
- [ ] **When → Chosen days** (today + 2 others) → "3 days" badge; shows on Today on each day; completing once completes it.
- [ ] **When → Repeats → days of the week** (incl. today) → tick on Today → "Ticked for today", leaves Today; next repeat day it's back.
- [ ] Skip a repeat day → open the task → that day says "not ticked"; click it to tick late.
- [ ] Settings → Pet notifications → **Repeating tasks still open** 2 min ahead → pet names the open ones once.
- [ ] Date presets: Deadline → **Tomorrow**; reminder → **Tomorrow 9:00**.
- [ ] Defer → Tomorrow still works.

## 6. Companion & routine
- [ ] Today → Daily routine: add items, tick, "N/7" count; reminder appears **once** above the pet (not twice).
- [ ] Next morning after 08:00 → one greeting; restart → no second greeting.
- [ ] Settings → Pet notifications: 1 nudge/day → only one unasked message that day; quiet hours respected.

## 7. Time & tabs
- [ ] Time page shows **Open tabs** without choosing Sites; with tracking off → **Turn on app and website time** works.
- [ ] Tabs list switches to a tab; close works (front browser window only on Windows).
- [ ] Layout: Wide list / Even / Stacked, Short / Medium / Tall → no gaps; kept after restart.

## 8. Auto-delete & Bin
- [ ] Settings → Auto-delete → Completed tasks → 30 days → dialog shows a count → **Keep everything** changes nothing.
- [ ] Again → **Turn on** → old completed tasks appear in **Bin → Completed tasks**; Restore one.
- [ ] Notes, meetings, reminders, open tasks untouched.

## 9. Settings & shortcuts
- [ ] Keyboard shortcuts: "Show or hide the pet" says **Off**; Ctrl+Shift+P does nothing → set it → works; pet menu shows it → **Turn off**.
- [ ] Ctrl+Shift+L and Ctrl+Shift+N still work.

## 10. Pet library
- [ ] Character → Pet library → **Import ZIP** (Kayadu) → **Use** → desktop pet changes; reactions play rows.
- [ ] Remove it while in use → bear returns.

## 11. Data safety
- [ ] Export → Delete all (type DELETE) → Import the file → everything back, incl. links, stars, repeat ticks, focus history.

## 12. macOS (if you have a Mac)
- [ ] Installs (right-click → Open past Gatekeeper); pet transparent; drag works.
- [ ] Arc / Firefox / Safari (after **Include Safari**) website time; private windows not recorded.

**Pass rule:** every box in 0–5 and 11 must pass before you press Publish; others can be listed as known issues.
