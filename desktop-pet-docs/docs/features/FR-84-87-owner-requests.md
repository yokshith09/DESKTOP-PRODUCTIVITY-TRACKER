# Owner requests 2026-10-23 — FR-84 … FR-87

Same 13 sections as the other specs. Status words per PROJECT_STATUS §2.

---

## FR-84 — Community pets website and upload server

**1 Metadata** — Group: Platform · Status: Planned · Phase: P7 (moved earlier only if the owner says) · Effort: XL · Origin: owner 2026-10-23 ("we develop a website and backend server for accepting pets — not pull requests by anyone"). **Reopens the backend** for this purpose only.
**2 Story** — As a creator I upload my pet on Loaf's website; after review it appears in everyone's gallery. As a user I browse and install pets from inside Loaf.
**3 Behaviour** — Website: browse, search, preview animations, download. Account (email or GitHub sign-in) needed only to upload. Upload form: ZIP of the pack, licence choice (CC BY 4.0 / CC0 / "free to use in Loaf only"), checkbox "I made this or have the right to share it", tags. Automatic check (same rules as FR-63) → moderation queue → approved pets go public. Report button + takedown within 48 h. Loaf's gallery (FR-66) reads the public catalog.
**4 Plain language** — A pet shop website where anyone can submit a pet; we check it before it goes live.
**5 Technical** — Proposal: one small server (Rust axum, or Supabase if the owner prefers no ops) + Postgres + object storage (Cloudflare R2: no egress fees) + static website. Pack validation reuses `loaf_core::pets` (compile it into the server). Catalog served as static JSON + ZIPs with SHA-256. Images resized server-side for previews. Privacy statement published before launch (decided earlier).
**6 Choices** — **Decided 2026-10-23: Supabase** (Postgres, Auth, Storage, Edge Functions; free tier to start, Pro ~US$25/month when needed [Likely]). Pack validation runs in an Edge Function (port the FR-63 rules to TypeScript, sharing test fixtures with the Rust checker). Sign-in: GitHub OAuth + email magic link.
**7 Tasks** — 1 privacy statement · 2 schema (users, pets, versions, reports) · 3 upload + validation · 4 moderation page · 5 public catalog JSON · 6 website pages · 7 Loaf gallery reads it (FR-66) · 8 takedown flow.
**8 Tests** — validator shared with FR-63 tests · upload rejects bad packs · catalog hash matches · moderation required before public · rate limits.
**9 Edge cases** — Stolen art (report + takedown); huge files (25 MB cap); spam accounts (rate limit, review); NSFW (review, report).
**10 Acceptance** — A pet uploaded on the website, approved, appears in Loaf's gallery and installs.
**11 Checklist** — [ ] privacy · [ ] server · [ ] site · [ ] moderation · [ ] gallery link
**13 Deps** — FR-63, FR-66; privacy statement; hosting budget (owner). Excludes: paid pets (later decision).

---

## FR-85 — Daily routine tile and routine notifications

**1 Metadata** — Group: Productivity · Status: **In progress (building now)** · Milestone: FM-V2 (pulled forward by the owner) · Effort: M · Origin: owner 2026-10-23. Replaces FR-69d "routines".
**2 Story** — As a student I keep a list of things I do every day (drink water, revise 30 min, gym, read) and tick them off; Loaf reminds me what is left ("You have 3 daily routine tasks pending").
**3 Behaviour** —
- Tile **Daily routine** on Today: the routine items with a checkbox each, a progress ring "2 of 5", add/rename/remove/reorder items inline.
- Ticks reset at the start of each day (local midnight). Yesterday's result is kept (streak count per item).
- Notification: a toast (FR-41) and the pet's bubble (FR-43) — "You have 3 daily routine tasks pending" — at a time the user chooses (default 18:00), only if something is pending; never more than once a day; off for the day once all are done. Setting: on/off + time.
- Each item may have an optional time ("07:00 Gym"); then a reminder at that time.
**4 Plain language** — A checklist that starts fresh every morning, and a nudge if you haven't finished it.
**5 Technical** — Stored in preferences (`ui.routine`: items `{id, title, time?}`, `ticks: {date, ids[]}`, `history` last 60 days) — no schema migration needed for v1. Daily reset by comparing the stored date with today's local date. Pending check at the chosen time with a one-shot timer (event-driven, no polling). Notification via the toast stack and, when the pet is visible, the pet bubble.
**6 Choices** — Preferences (fast, no migration) now vs a SQLite table later if reports need it. Chosen: preferences, behind a small hook so the storage can change.
**7 Tasks** — 1 routine model + pure functions (reset, pending, streak) · 2 `useRoutine` hook · 3 tile UI · 4 notification at a time · 5 settings · 6 tests.
**8 Tests** — unit: day reset, pending count, streaks, notification only when pending and once per day · component: add/tick/remove items, progress text, message "You have 3 daily routine tasks pending".
**9 Edge cases** — PC asleep at the reminder time (fire on wake if still pending, same day only); time-zone/day change while open; 0 items (tile shows an empty state, no notification); 50+ items (cap 30).
**10 Acceptance** — Items tick, reset next day, notification text and timing as above; tests pass.
**11 Checklist** — [ ] model · [ ] tile · [ ] notification · [ ] settings · [ ] tests
**13 Deps** — FR-41 toast stack. Role defaults (FR-83): on for Student and General, off for Developer.

---

## FR-86 — Private diary with task pick-up

**1 Metadata** — Group: Journal · Status: Planned · Milestone: FM-ST (student release) · Effort: L · Origin: owner 2026-10-23.
**2 Story** — As a user I write about my day in a calm, beautiful private diary, locked with a password. Loaf can spot things I need to do in what I wrote and turn them into tasks with deadlines, but only when I allow it.
**3 Behaviour** —
- **Diary tab** (sidebar). One entry per day by default (more allowed). Calendar strip to jump to a day; mood tag (optional, 5 faces); word count; full-text search inside the diary only after unlock.
- **Lock**: set a password the first time; the diary opens only after unlocking; auto-locks after N minutes idle (default 5) and when Loaf goes to the tray. Forgotten password = entries cannot be recovered (said clearly at setup; optional recovery key shown once to write down).
- **Task pick-up** (off by default): when on, Loaf highlights lines that look like to-dos ("need to", "have to", "submit", "remember to", "by Friday", "tomorrow", "- [ ]") with a subtle underline; click → "Make task" with the date already read ("by Friday" → Friday). Also select any text → **Make task** (always available, no setting needed). Converted lines show a small ✓ chip linking to the task.
- Nothing from the diary appears outside it (search, exports, pet bubbles) unless the user makes a task from it; then only the task's title is outside.
**4 Plain language** — A locked journal that can turn "I need to submit the lab report by Friday" into a task due Friday.
**5 Technical** — Entries encrypted at rest: key derived from the password with Argon2id (RustCrypto `argon2`, MIT/Apache), encryption XChaCha20-Poly1305 (`chacha20poly1305`, MIT/Apache); only ciphertext + salt + nonce in SQLite (new table `diary_entries`, migration 004). Key held in memory only while unlocked, wiped on lock. Task detection: local rules (regex + a small date parser for "today/tomorrow/Friday/next week/23 Oct") in core — **no AI and nothing leaves the PC**; AI-based pick-up later when the AI runtime exists. Excluded from export unless the user ticks "include diary (encrypted)".
**6 Choices** — Password per diary (chosen) vs OS keychain unlock (no password to remember, weaker if the PC is shared) — offer Windows Hello later. Local rules (now) vs AI (later).
**7 Tasks** — 1 crypto module + tests · 2 migration + storage · 3 lock/unlock flow · 4 editor UI (design below) · 5 to-do detection + date parser · 6 make-task flow · 7 search · 8 export rules.
**8 Tests** — unit: wrong password fails, ciphertext never contains plaintext, key wiped on lock; date parser ("by Friday", "tomorrow", "23 Oct", "next week"); detection precision on a fixed sample; component: lock screen, auto-lock, make-task creates a task with the right deadline, diary text absent from global search.
**9 Edge cases** — Forgotten password; very long entries; pasting images (not in v1); two windows; app crash while unlocked (nothing plaintext on disk).
**10 Acceptance** — Entries unreadable without the password; make-task works from detected lines and selections; the design passes the checklist below.
**Design (must feel effortless):**
- One calm column, max ~680 px wide, generous line height (1.7), a serif or rounded reading font option, soft paper background (light) / warm dark (dark).
- No toolbars by default: formatting on select (bold, italic, list, heading) and Markdown shortcuts.
- Autosave always ("Saved" whisper, no Save button); no pop-ups while writing.
- Date as a large quiet heading; mood faces small at the end; detected to-dos underlined in a soft accent, never coloured blocks.
- Unlock screen: pet holding a small key, one password field, nothing else.
- Accessible: full keyboard use, 4.5:1 contrast, reduced-motion respected.
**11 Checklist** — [ ] crypto · [ ] storage · [ ] lock · [ ] editor · [ ] detection · [ ] make-task · [ ] tests · [ ] design review
**13 Deps** — tasks core; FR-45 date picker. Role defaults: diary on for Student/General, pick-up off for all.

---

## FR-87 — Pet reacts to every feature, with user-chosen reactions

**1 Metadata** — Group: Companion · Status: Planned · Milestone: M6 · Effort: M · Origin: owner 2026-10-23. Extends FR-68's mapping table.
**2 Story** — As a user I want the pet to react differently to each thing that happens (task done, routine finished, focus started, note saved, reminder, diary unlocked…) and choose the reaction for each.
**3 Behaviour** — Settings → Pet → **Reactions**: a list of events, each with a reaction picker (animation + optional bubble + optional sound + "off"). Preview button. "Reset to defaults". Imported packs use their rows (idle/waving/jumping/failed/waiting/running/review); built-in characters also offer their extra poses and emotes.
**Event catalogue (audit of features built and planned):**

| Feature | Event | Default reaction |
|---|---|---|
| Tasks | added · started · completed · all of today done · overdue · deleted | catch/review · running · jumping · party · failed (once a day) · toss |
| Daily routine (FR-85) | item ticked · all done · pending reminder | waving · party · waiting + bubble |
| Reminders | due · snoozed | ring/waving · idle |
| Meetings | starting in 5 min · action item converted | waving · review |
| Notes | note created · linked to task | review · waving |
| Links (FR-61) | link opened | none |
| Focus (FR-05) | started · break · finished | running · waiting · jumping |
| Diary (FR-86) | unlocked · entry saved · task picked up | waving · idle · review |
| Typing along | typing · stopped | running · waiting |
| Time tracking | long session (usage buddy, FR-82b) | waiting + bubble (off by default) |
| Wellbeing (FR-69) | water due · breathing done | waving · jumping |
| App | startup greeting (FR-72) · idle 15 min | waving · sleep |
| Pet library | pet changed | jumping |
| Errors | anything failed to save | failed |

**4 Plain language** — Pick how your pet celebrates or reacts to each thing.
**5 Technical** — A typed event registry (`PetEvent` union) in `src/pet/reactions.ts`; the existing reaction queue/priorities stay; mapping stored in settings (`pet.reactions`: event → {pose|row, bubble, sound}); missing entries fall back to defaults; packs map via `ROW_FOR_POSE`.
**6 Choices** — One registry for all features (chosen) so every new feature must declare its events (test enforces).
**7 Tasks** — 1 event registry + defaults · 2 settings key + validation · 3 Reactions settings UI with preview · 4 emit events from each feature · 5 tests.
**8 Tests** — every event has a default; a user override plays instead of the default; "off" plays nothing; packs get a valid row for every reaction; a feature without registered events fails the registry test.
**9 Edge cases** — Many events at once (existing priority queue); pet hidden (no animation, toast still shown); reduced motion (first frame only).
**10 Acceptance** — Each event in the table plays its reaction; overrides persist across restarts.
**11 Checklist** — [ ] registry · [ ] settings · [ ] UI · [ ] wiring · [ ] tests
**13 Deps** — FR-63 rows, FR-68.
