# Market research, direction check, GTM, money and opportunities — 2026-10-23

**How this was researched:** web search + fetch on 2026-10-23. Reddit, Product Hunt, Fiverr, openpets.dev and several review sites were **blocked or unreachable** from the build environment; searches limited to Reddit/Quora/LinkedIn/Instagram returned almost no posts. Most "user voice" comes from app-store listings, review aggregators and blogs (some vendor marketing) — weaker evidence than reading the threads directly. GitHub star counts were read from the repo pages. Tags: [Certain] read directly · [Likely] several sources · [Guessing] estimate.

## 1. What people want (evidence)

| Theme | Evidence | Strength |
|---|---|---|
| **Visible all the time** ("out of sight, out of mind") — ADHD and widget guides | affine.pro, inkboard, ADHD Notes listing | Strong — the best argument for a pet on the desktop |
| **No-guilt streaks**: the pet waits, never dies or scolds | Finch praise, RemindFocus "no guilty streaks"; one Finch user says it later stressed her out | Strong |
| **Company / body doubling** | dubbii, Doppel, Focusmate, Desktop Mate "less lonely" | Strong |
| **No subscriptions, data stays local** | subscription-fatigue reports, TimeLens (local, $39 once) | Medium-strong |
| **Pets get annoying** (cover the screen, distract) | VPet and Pets Therapy reviews | Medium — need quiet / DND / monitor choice |
| **Paid characters feel overpriced** | Desktop Mate DLC reviews | Medium |
| **One app for students** (notes + tasks + Pomodoro + flashcards) | study-app round-ups; many partial apps | Medium |
| **Flashcards from notes** | 8+ DIY Obsidian/Anki tools | Medium |
| **Breaks tied to real activity**, time linked to output | Rize, Nudge; Fast Company criticism of Rize | Medium |

## 2. Getting more characters and animations

| Source | How | Licence / cost |
|---|---|---|
| **Our own art** | Our 5 characters; exporter; spec in `docs/character/PET_ART_SPEC.md` | Ours (CC BY 4.0) |
| **Codex hatch-pet / AI** | Codex Pets launched 1 May 2026 with `/hatch` from an image; PixelLab ~$12-50/mo; Retro Diffusion $20-65 once | Ours if we generate it; label AI art (some users avoid it) |
| **Commission artists** | Fiverr $2-15 per frame [Likely]; a full 9-row pack ~40-72 frames → **~$300-1,000 per character** [Guessing] | Contract must allow redistribution |
| **Free CC0 sprites** | Kenney (CC0), some itch.io packs (e.g. LuizMelo cats, CC0), OpenGameArt (check each) | CC0/CC BY ok; NC/ND/"no redistribution" not ok |
| **Community** | Petdex (4.3k★, public API, 99-1,000+ pets), Codex pets (79 repos tagged), our own gallery (FR-84) | Each creator's licence — import locally, host only declared-open ones |
| **Licensed IP** | Desktop Mate sells Hatsune Miku etc. (~$15 each) | Needs deals; not now. Indian creators / VTubers / webcomic artists are reachable partners |
| **Fan art (Pokémon, etc.)** | Common in galleries | **Never host**; local import only; takedown process |

## 3. Competitors (what they are building)

| Name | What | Price | Open | Traction |
|---|---|---|---|---|
| **OpenPets** | Local-first pet platform (Electron), plugins (focus, routine, mood, reminders, water), MCP agent hooks | Free, "never paywall core" | MIT | 1.3k★ — **closest competitor** |
| **Petdex** | Codex-pet gallery + CLI + desktop app, community review, API | Free | MIT code | 4.3k★ |
| **Codex Pets** (OpenAI) | 8 pets in Codex, `/hatch` | With Codex | No | Since May 2026 |
| Bongo Cat | Steam cat, cosmetics | Free + $2.50-10 items | No | ~194k peak players, reportedly unprofitable |
| VPet Simulator | Anime Tamagotchi, Workshop | Free | Apache (art proprietary) | ~51k reviews, 98% positive |
| Desktop Mate | 3D licensed mascots | Free + DLC | No | 2M+ downloads, ~66% positive |
| Shimeji-ee, eSheep, Desktop Goose | Classic desktop mascots | Free / pay-what-you-want | Some | Long-running / viral |
| Finch | Self-care pet (mobile) | $9.99/mo, $69.99/yr | No | ~600k downloads/month [Guessing] |
| Forest, Habitica, Focusmate | Focus / gamified tasks / body doubling | $2-4 once / $47.99/yr / $8-12/mo | Habitica yes | Large |
| Notion, Todoist, TickTick, Obsidian | Notes & tasks | $10/mo, $60/yr, $36/yr, free+sync | No | Very large |
| Daylio, Day One, Journey | Journals | $18-50/yr | No | Large |
| Rize, RescueTime, Sunsama, Motion | Time tracking / planning | $6-29/mo | No | Medium |
| AI desktop companions (2026) | LLM characters that watch the screen | $4.99-9.99/mo or $12.90 once | Mostly no | Early |

## 4. Most useful features now (ranked by evidence)

1. Always-visible **now strip** by the pet: current task, timer, next deadline.
2. **Gentle focus + break nudges tied to real activity** (pet gets tired).
3. **No-guilt progress** (forgiving streaks; the pet waits).
4. **Student pack**: exams, syllabus progress, flashcards from notes, focus per subject; Anki import/export.
5. **Local time tracking linked to tasks done** (output, not just input).
6. **Developer mode**: coding-agent status via MCP/hooks (table stakes for devs).
7. **Quiet modes**: pick a monitor, hide in full-screen and meetings.
8. **One-click import** of Petdex/Codex pets with licence labels.
9. Diary → tasks and mood check-ins (plausible, fewer signals — keep it light).

## 5. Direction check — is our direction clear?

**Mostly yes, with two problems.**

What is right [Likely]:
- **The gap is real:** no product found combines a pet, real student tools and local time tracking in one offline, open-source desktop app. OpenPets/Petdex are developer pet platforms; Finch/Forest are mobile; Notion/Rize/Sunsama are cloud subscriptions.
- Student-first, local-first, open source, Codex-pack compatibility, no-guilt design — all match the evidence.

Problem 1 — **scope**: the plan now holds ~87 features across 8 phases for one founder. OpenPets ships fewer features and has 1.3k★. The research says the winning items are 1-7 above; several planned items (LAN mode, magic 8-ball, care mode, 8 languages, AI Studio) have little evidence. **Recommendation:** keep them in the plan but treat P2 (student release) as the only goal until 100 weekly users; cut anything that doesn't serve "study buddy on your desktop".

Problem 2 — **two missing items with the strongest evidence**: the **"now strip"** beside the pet and **quiet modes** (monitor choice, hide in full-screen/meetings). Both are cheap. Added as FR-88 and FR-89 (planned, P2).

Also: **don't compete with OpenPets on pets — be compatible** (already true) and win on study tools.

Positioning line: **"Your study buddy that lives on your desktop — works offline, keeps your data on your PC, free and open source."**

## 6. Can it make money, or stay open source? Both.

[Likely] Open source and money are not opposites here; most successful tools in this space use **open core + optional paid extras**. Recommended (never paywall study features):

| Model | Example | For Pluto | Estimate |
|---|---|---|---|
| **One-time supporter licence** | Obsidian Catalyst $25 | Supporter badge, early builds, exclusive pet | ₹299-499 India, $9-15 elsewhere |
| **Paid art packs** with artist revenue share | Desktop Mate DLC, Bongo Cat items | Seasonal/premium characters; 50-70% to the artist | ₹49-199 per pack |
| **GitHub Sponsors / donations** | Petdex, many MIT tools | Day one | Small but steady |
| **Optional encrypted sync** (later) | Obsidian Sync $4/mo | Only if users ask; needs backend | ₹99/mo |
| **College / club licences** | — | Branded pets for fests and clubs, free for students | ₹10k-50k per deal [Guessing] |
| Avoid | Subscriptions for core features, ads, selling data | Breaks the trust that is our advantage | — |

Honest expectation [Guessing]: income will be small for the first year (hundreds to low thousands of dollars) unless a launch goes viral; Bongo Cat had ~194k players and was still reported unprofitable. The bigger return is below.

## 7. Opportunities this project can unlock [Likely]

- **Portfolio proof**: a shipped, open-source, cross-platform desktop app (Rust + Tauri + React, local DB, OS integration, tests, CI, releases) is strong evidence for jobs and internships in systems, desktop and full-stack roles.
- **Open-source reputation**: stars, contributors, talks — leads to freelance work, GitHub Sponsors, invitations to programs (GitHub Accelerator, Google Summer of Code mentoring, FOSS United in India).
- **Startup path**: traction (e.g. 1,000+ weekly student users) is what incubators and grants ask for — college incubators, Startup India, MeitY schemes, AWS/Google startup credits.
- **Partnerships** with ed-tech, colleges and creators (branded pets).
- **Skills**: product, GTM, community moderation, licensing — valuable for QUORBIT TECHNOLOGIES beyond this app.

## 8. GTM plan

Sheet: [`GTM_PLAN.csv`](GTM_PLAN.csv) (opens in Excel / Google Sheets). Phases: **Ready** (weeks 1-3: public repo, name, site, signed v0.3) → **Seed** (3-8: 100 student users from your own campus, creator pet challenge, Show HN) → **Launch** (8-12: Product Hunt, Reddit study/ADHD/open-source communities, Reels/Shorts of pet reactions, campus ambassadors) → **Grow** (12-24: retention features, community gallery, revenue test) → **Scale** (24+: college and creator partnerships).

North-star metric: **weekly active students**. Targets: 100 WAU by week 6, 2,000 launch-week downloads, 25% day-30 retention.

Sources: see the research notes in this session — key links: [OpenPets](https://github.com/OpenPetsHQ/openpets), [Petdex](https://github.com/crafter-station/petdex), [Codex Pets news](https://letsdatascience.com/news/openai-introduces-codex-pets-animated-coding-companions-f3125f76), [Bongo Cat](https://steambase.io/games/bongo-cat), [Desktop Mate](https://store.steampowered.com/app/3301060/Desktop_Mate/), [VPet](https://github.com/LorisYounger/VPet), [Finch paywall](https://adapty.io/paywall-library/finch/), [Kenney licence](https://kenney.nl/support), [OpenGameArt FAQ](https://opengameart.org/content/faq), [Obsidian pricing](https://obsidian.md/pricing.html), [Rize critique](https://www.fastcompany.com/91035753/ai-productivity-coach-annoying), [ADHD visibility](https://inkboard.ink/blogs/the-inku-desk-blog/the-visibility-rule-why-reminders-fail-for-adhd-and-what-works-instead).
