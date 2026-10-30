# Growth features — plan (owner 2026-10-23), FR-98 … FR-103

All follow the companion principles (no guilt, attention ladder, notification budget). Nothing here is built.

## FR-98 — Festival and seasonal outfits
- **What:** time-limited wardrobe outfits that switch on by themselves using the OpenPets `wardrobe.schedule` date ranges, and stay in the wardrobe afterwards.
- **Calendar (first year):** Pongal/Sankranti (mid-Jan), Holi (Mar), exam season "study buddy" headband (Feb-Apr, Nov-Dec), Eid, Raksha Bandhan, Independence Day (15 Aug), Onam, Ganesh Chaturthi, Navratri/Dussehra, **Diwali** (Oct/Nov, lamps + sparkle activity), Christmas/New Year. Festival dates that move each year come from a small yearly table shipped with the app.
- **Rules:** user can switch auto-outfits off; region list chosen in Settings (India by default, global list available); never religious content forced on anyone.
- **Built on:** FR-64 wardrobe, our exporter (draw accessories per character).
- **Done when:** on the festival dates the pet wears the outfit unless turned off; outfit stays unlocked afterwards. **Phase:** P3 (with FR-64). **Effort:** M + art per outfit.

## FR-99 — Weekly recap card (shareable)
- **What:** every Sunday evening (or first open after), a card: focus hours, tasks done, routine "5/7", top subject, a pet pose; **Save as image** / copy to clipboard. Nothing uploaded.
- **No guilt:** shows only what was done; an empty week shows "Rest weeks count too".
- **Done when:** card appears once a week (budgeted nudge), image export works offline. **Phase:** P2. **Effort:** S-M.

## FR-100 — Study groups with friends
- **What:** create a group, invite with a code/link; members see each other's study hours (per subject optional), cheer (one-tap emoji), and a shared weekly goal ("40 h together").
- **Privacy:** opt-in per person; you choose what's shared (hours only by default, never app/site names, never notes or diary); leave anytime and your data is removed from the group.
- **Built on:** Supabase (auth, Postgres, row-level security); only daily totals leave the PC.
- **Done when:** two accounts in a group see each other's daily study totals. **Phase:** P7. **Effort:** L.

## FR-101 — Leaderboards with a visibility choice (owner decision)
- **Visibility option per user:** **Off** (default) · **Friends only** · **Everyone**.
- Weekly reset; ranks by **study hours or focus sessions**, never streaks; your own row always shown with "your best week" beside it.
- Everyone-board: display name only (no real name required), report/block, minimum age setting in sign-up, no prizes for raw hours (avoids unhealthy competition).
- **Done when:** user can pick the visibility; boards reset weekly. **Phase:** P7 with FR-100. **Effort:** M.

## FR-102 — Monthly community pet drops
- **What:** one or more featured pets each month in the gallery (FR-84), announced with a level-1 bubble once ("New pets this month") and an in-app "What's new" tile; creators credited.
- **Process:** creators submit → moderation → monthly pick by the team/community votes.
- **Done when:** gallery shows "This month" with installable pets. **Phase:** P7 (needs FR-84). **Effort:** S once the gallery exists.

## FR-103 — Photo to pet (later)
- **What:** upload a photo of your pet (or describe one) → generated character in the Pluto style → all 9 rows → pack.
- **Rules:** opt-in, consent screen, photo deleted after generation, no pay-per-draw paywall for the first pets (OpenPets charges credits); **photos of real people need their consent** and stay on hold (personal characters on hold).
- **Needs:** an image model (no GPU locally → cloud provider, owner to choose), AI provider decision (on hold).
- **Phase:** P6. **Effort:** XL.

## Student pack headline (preview first)
Study hours per subject, timetable, sharing with friends — **a clickable preview was published for the owner to review before building** (see the link in the conversation of 2026-10-23); feedback goes into FR-58.
