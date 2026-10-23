# page-mascot audit (koboyo.com/page-mascot · github.com/nilbuild/page-mascot) — 2026-10-23

Checked: the live site (scraped), the repo cloned at commit `76a44ed`, its README, `SKILL.md`, `characters.md`, `src/mascot.tsx`, `package.json`, `LICENSE`.

## What it is
A **React component for websites** (`npm i page-mascot`, v0.1.0) by Kamran Ahmed. A chibi **head** sits on a web page, **turns to look at the visitor's cursor**, and **reacts when clicked** (blink, heart, sparkle, surprised, wink, bashful, sleepy, dizzy, delighted). It is not a desktop app and not a productivity tool — it decorates personal sites and portfolios.

## How it works
- Each character = **two 3×3 sprite sheets**: 9 head directions (up-left … down-right) and 9 reactions. Sheets ship as 1080×1080 WebP (cells 360×360); sources are 1254×1254 PNG.
- The pointer angle picks a direction cell, with a dead zone so the head settles near the cursor. A click shows a reaction for ~0.5 s with a squash (honours reduced motion). No animation library, no per-frame JS: it just moves `background-position`.
- Props: `directions`, `reactions`, `size` (default 140), `label`, `className`. Tracking turns off without a fine pointer (touch).

## Features
| Feature | Detail |
|---|---|
| 53 drawn characters | 20 animals, 19 people (incl. `kamran` = the author), 13 robots/things, + fox in 5 extra styles |
| 6 art styles | colour, ink, sketch, riso, paper, pixel — same alignment |
| "Make your own" | An **agent skill** (Claude Code / Codex): describe a character or attach a photo → it prompts an image model (OpenAI images API, `OPENAI_API_KEY`, or the agent's own image tool), builds the two sheets, **verifies the cells don't jump**, adds the component |
| Prompt pack | `reference/prompts.md` + `design-rules.md` usable in any chat UI |
| Pipeline scripts | Python: generate, chroma-key fallback for tools without transparency, build atlases, screen/verify alignment |
| Accessibility | screen-reader label, reduced motion |

## What it does **not** have (vs Loaf)
No body, no walking/jumping/working poses, no desktop window, no tasks/notes/focus/reminders, no reactions to events, no pet packs in the Codex/OpenPets format, no community gallery or backend, no monetisation.

## Can we take their pets?
**Licence:** the whole repo is **MIT** (© 2026 Kamran Ahmed), and the character images are inside the repo with no separate art licence. [Likely] MIT therefore covers the sheets: we **may copy, modify and ship them, including commercially**, as long as we **include the MIT copyright notice and licence text** with them. [Guessing] It is still polite and lower-risk to tell the author and credit "Characters by Kamran Ahmed (page-mascot)" in the library — the same rule we follow for Codex pets.

**Exclude `kamran`** — it is a real person's likeness (the author). A copyright licence doesn't grant permission to use someone's face as a product character. Same rule as our personal-photo characters (needs that person's consent).

**They don't fit our pet format as they are.** Our pets are full-body Codex/OpenPets atlases (192×208 cells, rows idle / running / waving / jumping / failed / waiting / working / review). page-mascot sheets are **head-only**: 9 look directions + 9 face expressions. Mapping them into our rows would give a floating head with no running or working animation.

## What we can usefully take (proposal, not built)
1. **A "head" pet type** (FR-112 proposal): Loaf gets a second kind of pet — a head that **looks at your mouse anywhere on the desktop** (Tauri can read the global cursor position) and shows expressions for events: heart on task done, surprised on a reminder, sleepy at night, dizzy on errors, delighted on focus done. All 52 non-person-likeness characters become importable "head pets" with credit. Cheap: the player is a few dozen lines; no new art needed.
2. **Their alignment check idea** for our Pet Studio: verify that frames don't jump (feet/head baseline) before a pack is accepted.
3. **Style variants** (ink/sketch/pixel…) as a later idea for our own packs.

**Not worth copying:** the website-component business (different market), and the OpenAI-key image pipeline (we don't pay for AI; BYOK is already our rule).

## Risks
- If the author later adds an art licence or asks for removal, we'd need to respect it → keep their characters as a separate, removable pack, not baked into Loaf's own art.
- Some people characters (hijabi, sikh, afro…) represent identities; use their names and art as drawn, never caricature or re-label them.
