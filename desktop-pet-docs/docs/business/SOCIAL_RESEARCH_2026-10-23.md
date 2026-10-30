# Social research (Firecrawl), 2026-10-23

**What could be read:** Product Hunt pages and comments, and openpets.dev, were read **in full** with Firecrawl. Quora was read **partly** (first answer before the login wall). **Reddit, LinkedIn and Instagram are blocked even for Firecrawl** ("we do not support this site"); for those only search excerpts (short fragments, usually without vote counts) are available. Instagram like counts come from excerpts and a paid Instagram index.

## Strongest quotes

### Reddit (excerpts)
- "Most desktop pets distracted me, so I made a cute focus companion…" — r/CozyGamers/comments/1od9jun
- "Streaks make one missed day feel like losing everything, so the tracker ends up measuring guilt instead of progress." — r/getdisciplined/comments/1x9r7zl
- "Most habit apps are exciting while setting them up, then after 1-2 weeks it becomes another task to update." — r/ProductivityApps/comments/1twh2pk
- "Anything that adds an extra step (do the thing, then track the thing) usually fails." — r/adhdwomen/comments/1wklrkx
- "I'm here for a self-help app, not a mobile game." / "more and more just keeps getting taken away." (Finch) — r/finch
- "People are getting 'subscription fatigue' and want local-only versions of popular apps." (analysis of 9,300+ "I wish there was an app" posts) — r/SaaS/comments/1q5lfur
- "Pet is the best way to see when Codex is working, when it has asked a question." — r/codex/comments/1vmd1cg ("Does anybody actually use pets?", ~56 votes / 71 comments)
- "Body doubling: the app stays visible on your screen at all times…" — r/ADHD_Programmers/comments/1rra3f5
- Indian students (r/JEENEETards): "how did you actually track your study hours?", "Suggest me some app which counts my study hours!!", "From 8 hrs of self study to 8 hrs screen time"; wish to "show your study time to others". A desktop-pet launch post in r/macapps: 172 votes, 203 comments.

### Product Hunt (full comments)
- **Tamamon** (desktop pet that grows while you code with Claude Code; #3 Product of the Day, 476 followers; the maker shipped ~30 updates from comments, including export/import mid-launch):
  - "'nothing leaves the Mac' framing is what keeps this charming instead of turning into a productivity guilt-meter… what happens to a collection I've spent weeks on if I switch Macs?"
  - "a pet that grows when you grind through a painful debugging session feels earned, but one that just tracks raw activity is basically a Tamagotchi skinned over a pomodoro timer."
  - "it is going to take me a very long time to hatch this first egg." (wants growth adjusted to each user)
  - "the pet perks up and waves when a session is waiting on your input… honestly better UX."
  - "a little companion is a much better motivator than another dashboard full of numbers."
- Other pet launches: Mochi ($5 pay-what-you-want; "is there any guilt-trip mechanic?"), Pawse (open source; "a notification is too easy to ignore"), tama96 (Tamagotchi + MCP), NotiSprite, Sudari (free, open source), Paw-Paw ($2.99 add-on), CozyPet ("no chat, no distractions"). Typical: 30-125 followers.

### Quora (partial)
- Students use Google Calendar + Any.do, Forest, Todoist, Notion, RescueTime. "I just study for barely 20 minutes and then I'm again on my phone." Nothing useful on desktop pets.

### LinkedIn (excerpts)
- "Progress bars are out. Desktop companions are back! OpenAI has recently introduced 'Codex Pets'…" (copy-pasted by 6+ accounts).
- "OpenAI added a desktop pet to Codex… that's exactly why it works."
- "We can only see 1 Codex pet at a time, so I built MultiCodexPets."
- Indian student founders' #buildinpublic posts: Strivor (chapter tracking, focus timers, streaks, exam countdowns), Focuno ("fighting doomscrolling for Indian students"), Focera.

### Instagram (counts from excerpts)
- @parasmadan.in "Cute cat on your Desktop" reel: **137K likes, 208 comments**.
- @busraalya FureverDock ("upload your dog's photo"): **66K likes**; the brand's own account: **362 likes** — creator reposts beat the brand by >100×.
- Formats that work: 10-20 s POV reels of a cute pet reacting on a laptop, "turn your real pet into a desktop pet", cozy study-desk aesthetics, "I built this with Claude/Codex" + "comment for link".

## Themes, most frequent first
1. **Guilt and streak anxiety** — people quit when the pet/tracker becomes a "guilt-meter".
2. **Distraction vs help** — useful only when it signals something without demanding attention.
3. **Privacy / no account** — nearly every successful launch says it.
4. **Subscription fatigue / paywall creep.**
5. **Setup overhead** — quit after 1-2 weeks of upkeep.
6. **Earned, personal progress** — growth tied to real effort, adapted to each user, with export/backup.
7. **Study-hour tracking and timetables** — dominant among Indian students.

## openpets.dev (read in full)
- Free, MIT, ~1.3k★; Windows, macOS, Linux; also in the Microsoft Store.
- **Gallery: 1,312 companions** (55 Originals, 219 Featured, a 24-pet "Back to School Pack").
- v4.1: scheduled outfits, AI assistant (chat/voice; sets reminders, starts focus), calm corner (Anxiety Aid), Control Center with reaction mapping, pet library, Plugin SDK v3 (routine, focus, mood, reminders, water, CPU/RAM).
- Integrations: Claude Code, Cursor, OpenCode, Pi, CLI, MCP; VS Code/Windsurf/Zed coming.
- Teams/Organizations wellbeing edition (self-hosted or cloud, no public prices); creator program for streamers.
- **Pet Studio:** photo or idea → pet in 3 steps; needs sign-in; **credit-based, prices not public** (pricing page requires login).

## What this changes in Pluto's plan
1. **"No guilt" is a design rule** (added to MASTER_PLAN): the pet never gets sad at the user for a missed day, streaks are forgiving (a missed day doesn't reset to zero — "best week" view), copy says so at launch. The routine tile's 🔥 is kept but becomes forgiving (FR-90).
2. **Lead with the student workflow**, not "a desktop pet" (OpenPets already covers pets, plugins, routines, focus): diary → tasks, flashcards from notes, **study hours per subject**, exam countdown.
3. **Earned progress + backup**: pet growth tied to finished focus sessions and routine ticks, adapted to each user so the first milestone comes within a day (FR-91); export/import already exists for data — extend it to pet progress.
4. **Windows-first, signed, no account** is a real gap (most PH pet launches are Mac-only; others ship unsigned).
5. **Launch:** answer every PH comment and ship fixes during launch week (Tamamon playbook); seed POV reels through student/studygram creators, not a brand account; #buildinpublic on LinkedIn aimed at Indian students; "make a pet from your photo" later, without pay-per-draw.
