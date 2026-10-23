# FR-106 … FR-110 — Task upgrades and the focus timer by the pet (owner, 2026-10-23 night)

Owner's words: "a task can be planned for multiple days · when we attach a link it should show next to the task clearly; multiple links for one task · a task can be recurring for some days · highlight task, reminder, deadline · focus timer above/below the pet, the rest on the hover card; the user can turn the hover card off and then get it as a bubble."
Owner answers (same night): chosen days; repeat = tick each day, remind when not ticked and keep track of the days not ticked; highlight = **star**; build now, release only when the owner says.

| FR | Feature | Defined as | Done when |
|---|---|---|---|
| FR-106 | Links on a task | Any number of links per task (URL + optional name), shown as chips **next to the task title** in every list; click opens in the browser (only http/https/mailto, same check as Links) | Add, rename-free remove, open; shown on Today and Tasks; tests core + UI |
| FR-107 | Star | A star on tasks and reminders; starred items sort first on Today and Tasks and are marked with a filled star | Toggle from the row and the detail; order tested |
| FR-108 | Chosen days | A task can be planned on several specific days (e.g. Mon 27, Wed 29, Fri 31). It shows on Today on each of those days; completing it once completes it | Days picker in the detail; Today/Upcoming include it on each day; tests |
| FR-109 | Repeating task | Repeats every day, on chosen weekdays, or every N days, from a start day, optionally until an end day. **Each day is ticked on its own**; ticking today never touches other days. Today shows it on each repeat day until ticked. In the evening (default 19:00) the pet says once which repeating tasks are still open today (through the nudge budget, FR-96). The detail shows the last 14 repeat days with which were ticked and which were not | Rule picker; tick per day; evening bubble; history; tests |
| FR-110 | Focus timer by the pet; hover card optional | While a focus session runs, a small timer shows **above or below the pet** (whichever side has room). Everything else (task, next deadline, class) is on the hover card. Setting "Show the card when I hover the pet" (default on); when off, hovering shows the same info as a bubble | Timer visible during focus; card setting works; tests |

## How these follow the build principles
- **No guilt (FR-92):** days not ticked are listed as "not ticked" in neutral grey, never red, never "missed/failed"; the count is "done 4 of the last 6 repeat days"; nothing resets. The evening bubble says "Still open today: Walk, Revise — tick them when done", once a day at most, never in quiet hours, and counts toward the daily nudge limit.
- **Local only:** all of it lives in the local database (migration 004). Links are opened only after the same safety check as the Links card.
- **Repeating vs Daily routine (FR-85):** the routine tile stays for simple habits; repeating tasks are for real work with notes, links and a priority. Both use the same no-guilt counting.
- Tasks still **may have no date at all** (as today). Chosen days and repeat are optional.

## Data (migration 004)
`tasks.starred`, `tasks.repeat_rule` ("daily", "weekly:1,3,5" with ISO weekdays, "every:N"), `tasks.repeat_until`; `reminders.starred`; tables `task_links`, `task_days`, `task_ticks` (all cascade on task delete). A repeating task starts on its planned date (today when none is set).

## FR-05 / FR-110 as built
- `focus_sessions` (migration 005): kind FOCUS/BREAK, task + its title at start, planned time, start, pause start, paused total, end, outcome DONE/STOPPED, local day. One running at a time (unique index). Time left is computed, never stored.
- Pet: panel "timer" (184×34) grown above/below like the bubble; bubbles and the card take the space while showing and give it back to the timer.
- Hover card off: hovering plays a short bubble "Focus 13:12 left · 3 today · next: … · Stand-up at 3:30 PM".
- Not built yet: study-hours screens using these sessions (student pack), a pet-menu "Start focus" item.
