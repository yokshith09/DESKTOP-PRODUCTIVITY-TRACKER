# Companion principles and features — owner 2026-10-23 (FR-90 … FR-97)

From the research (`docs/business/MARKET_RESEARCH_2026-10-23.md`, `SOCIAL_RESEARCH_2026-10-23.md`) and the owner's message of 2026-10-23. These are **rules every feature must follow**, then the features that satisfy them.

## 1. Five user needs → how Loaf satisfies each

| Need (evidence) | Rule | Features that satisfy it | Status |
|---|---|---|---|
| **Visible without opening an app** | The useful thing is on the desktop, not behind a click | Pet hover card (today at a glance) · **Now strip** beside the pet (FR-88: current task, timer, next deadline) · routine reminder above the pet (FR-85) · pet reactions per event (FR-87) | Card + routine bubble built; FR-88 planned |
| **Progress without guilt** | Nothing punishes a missed day; the pet waits | **No-guilt rule** (below) · forgiving routine count "5 of last 7 days" instead of hard streaks (FR-90) · earned growth that never goes down (FR-91) | FR-90 built now |
| **Company while working** | Present and calm, reacts to what you do | Typing along · reactions · greeting once a day (FR-94) · birthdays (FR-93) · focus sessions with the pet (FR-05) | Greeting/birthdays built now |
| **No subscriptions, data on your PC** | Core is free and local forever | MIT; local SQLite; no account; backup to a file (FR-95); paid extras only cosmetic (supporter licence, art packs) | Built (export/import); FR-95 extends it |
| **Doesn't get in the way** | The pet signals, never demands | **Attention ladder** (below) · **notification budget** (FR-96) · quiet modes (FR-89: monitor, full-screen, meetings) · size/opacity/hide · click-through when idle | Budget built now; FR-89 planned |

## 2. The no-guilt rule (applies to every feature)

1. The pet **never** looks sad, sick, hungry or disappointed **because the user did not do something**. Sad/failed animations are only for real errors (a save failed, a reminder missed by the computer being asleep — said kindly).
2. **No streak resets to zero.** Show "N of the last 7 days" or "best run"; a missed day pauses, it doesn't erase.
3. **Nothing decays.** Growth, levels and unlocks only go up (FR-91).
4. **No shaming copy.** Never "You missed…", "You failed…", "Don't break your streak". Use "Ready when you are", "3 left for today — no rush".
5. **Every nudge can be turned off** in one click, from the nudge itself.
6. Overdue tasks are shown, not punished: the pet reacts at most once a day to overdue work, gently.

Test: `src/lib/noGuilt.test.ts` scans user-facing copy for banned phrases.

## 3. The attention ladder — tell, don't demand

| Level | When | How | Example |
|---|---|---|---|
| 0 Ambient | Always | Pose / animation only, no text, no sound | Typing along; working pose while a task is in progress |
| 1 Glance | Something worth knowing | Short bubble above the pet, fades by itself (≤10 s); no sound | "2 routine items left" |
| 2 Card | The user should act today | Toast in the dashboard + bubble; still no sound | Daily routine reminder |
| 3 System notification | Time-critical only | OS notification + sound | A reminder the user set for a time |

Rules: most things are level 0-1. Only reminders the user explicitly set reach level 3. Nothing repeats more than once a day unless the user set it.

## 4. Notification budget — no spam (FR-96)

- **Once per kind per day** (routine reminder, greeting, birthday, overdue nudge…).
- **At most 4 unasked nudges a day** in total and **at most 1 per hour** (user-set reminders don't count).
- **Quiet hours** (default 22:00-08:00) and while a meeting or full-screen app is on: nudges wait or are dropped.
- Stored in preferences (`ui.nudges`), so it holds across restarts.
- Implemented in `src/lib/nudges.ts`; every unasked nudge must go through `canNudge`/`markNudged` (tested).

## 5. Study hours — are we solving it?

**Partly.** Today Loaf tracks **app and website time** (opt-in) and focus timing is planned (FR-05). Students ask for **study hours per subject**, a **timetable**, and **sharing study time with friends**.

| Part | Status |
|---|---|
| Total screen time by app/site | Built (Time tab, opt-in) |
| Mark apps/sites as "study" (category) | Built (domain categories) — needs a "Study" category preset |
| Focus timer that logs time to a task/subject | Planned (FR-05 / FR-58) |
| **Study hours per subject per day/week** | Planned — headline of the student pack (FR-58) |
| Timetable / weekly planner | Planned (FR-58, uses the date picker FR-45) |
| Share study time with friends | Planned, opt-in only, needs the backend (FR-97) |

## 6. Earned progress and what else attracts users (FR-91, FR-97)

**Earned growth (FR-91):** XP from things done, never from time idle: finished focus session, routine item ticked, task completed, diary entry written. Paced per user (first level within the first day; later levels scale with that user's own average). Levels unlock: new characters, outfits (wardrobe), emotes, tile themes. **Never goes down.**

**More ways to attract and keep users** (ranked):
1. **Unlocks:** characters, outfits, seasonal items (festival outfits for Diwali, Holi, Pongal, Christmas, exam season).
2. **Pet that remembers** (FR-93/94): birthdays, age, a once-a-day greeting — makes it feel like *yours*.
3. **Weekly recap card:** "This week: 9 h focused, 23 tasks done, routine 5/7" — shareable image (no account needed).
4. **Study groups / friends (opt-in, FR-97):** see friends' study time, cheer each other, small group goals. **Leaderboards only among friends, opt-in, weekly reset, off by default** — public global leaderboards create the same guilt and comparison the research warns against.
5. **Creator pets:** monthly community pet drops (FR-84 gallery).
6. **Seasonal events:** exam-season "study buddy" mode, festival outfits.
7. **Photo → pet** later (no pay-per-draw).

## 7. Pet that ages and remembers (FR-93, FR-94)

- **Pet birthday** = the day the user first met it (first run / adopted date). **Age** shown on the Character page ("Mochi is 23 days old").
- **User profile:** first name (optional), birthday (optional, day + month; year never asked).
- **Greeting once a day** (FR-94): the first time Loaf starts or the PC wakes on a new day, the pet says "Good morning, Asha!" (by time of day), **once**. Through the notification budget.
- **Birthdays:** on the user's birthday "Happy birthday, Asha! 🎂" with the party animation; on the pet's birthday "I'm 1 today! Thanks for having me" — once each, level 1.
- Pet age only moves forward with real days; it never "dies" or gets sick.
- All stored locally in preferences (`ui.companion`), included in export.

## 8. Backup of pet progress (FR-95)

- **Already built:** Settings → Data → **Export** writes notes, tasks, meetings, settings and **preferences** (routine, companion profile, chosen pet) to one JSON file; **Import** restores it.
- **Missing:** imported pet pack files (`<data>/pets/…`) and future XP. FR-95: export a **.loafbackup** (ZIP: the JSON + pet folders); optional automatic weekly backup to a folder the user picks (e.g. OneDrive/Google Drive folder → cloud backup without our server); restore on a new PC.
- No account, no server needed.

## 9. Feature list (new IDs)

| ID | Feature | Phase | Status |
|---|---|---|---|
| FR-90 | Forgiving routine progress ("N of last 7 days", no resets) | FM-V2 | **Built** |
| FR-91 | Earned growth, paced per user, unlocks | M13 | Planned |
| FR-92 | No-guilt rule + copy check test | All | **Built (test)** |
| FR-93 | Pet age and birthdays (pet + user) | M6 | **Built** |
| FR-94 | Greeting once a day | M6 | **Built** |
| FR-95 | Full backup (.loafbackup incl. pets), auto weekly backup to a chosen folder | M0 | Planned |
| FR-96 | Notification budget + quiet hours | FM-V2 | **Built** |
| FR-97 | Friends / study groups, friends-only opt-in leaderboard, weekly recap card | P7 (backend) | Planned |
