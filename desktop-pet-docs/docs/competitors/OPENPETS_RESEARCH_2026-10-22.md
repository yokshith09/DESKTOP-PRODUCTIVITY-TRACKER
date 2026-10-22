# OpenPets (openpets.dev) — full research, 2026-10-22

**Source.** openpets.dev, docs.openpets.dev and openpets.app do not resolve from our build environment (DNS failure), so the site itself was not read. Everything below comes from the project's own source code and docs: [github.com/OpenPetsHQ/openpets](https://github.com/OpenPetsHQ/openpets), cloned 2026-10-22 (last commit 2026-10-21, version **4.1.0**, MIT licence). Website claims seen only in search snippets are marked *(site claim, not checked)*.

## 1. What it is

A free, open-source **desktop companion platform**: animated pets on the desktop, a plugin system, and optional hooks so coding agents (Claude Code, Cursor and others) can make the pet react. By Boring Dystopia Development. No account, no central AI server.

| | |
|---|---|
| Platforms | Windows x64 (signed installer), macOS arm64/x64 (may be unsigned), Linux AppImage, Arch AUR |
| Tech | Electron + React + TypeScript, pnpm monorepo, zod, MCP SDK |
| Languages | en, es-419, fr, ja, ko, pt-BR, zh-Hans, zh-Hant |
| Licence | MIT (code); pet art has its own rights |

## 2. Features

| Area | What they have |
|---|---|
| Pet behaviour | Idles, wanders, reacts; drag and **throw with physics**; moves across monitors; V2 pets **look toward the cursor**; size presets; Normal or Relaxed reaction pace |
| Control Center / Gallery | Browse installed pets, preview frames, pick a pet per workspace or per agent window, pin pets |
| Catalog | Online catalog (`catalog.v3.json`, categories, featured, originals); one-click install by ZIP or `openpets://install` link; also reads Codex pets from `~/.codex/pets/`; local ZIP/folder import. *(site claim: 1,300+ pets; a third-party listing says 253+)* |
| Wardrobe (outfits) | Up to 16 outfits per pet, each a full sprite sheet; **schedules** by time of day, weekday and date range (e.g. pajamas at night, Halloween in October); user can force one outfit |
| Activities | Up to 16 one-shot animations per pet (4-32 frames, 1-12 fps, 1-12 s) |
| Plugins (SDK v3) | Sandboxed; the app draws the plugin's UI (no raw HTML); permissions approved at install; network limited to declared hosts. Plugins get bubbles, menus, panels, small HUDs, sound, schedules (once/every/daily/cron), AI (Anthropic, OpenAI, Ollama, keys held by the app), storage, voice, OAuth, files, notifications. CLI scaffolds 6 templates and has a test harness |
| Official plugins (13) | Anxiety Aid Tools (breathing, grounding, meditation…), Calendar Airmail (Google Calendar reminders), Morning & Evening Routine, Focus Buddy, Daily Fortune Cookie, Launch Buddy, Magic 8-Ball, Mood Check-in, Simple Timer, Quick Reminders, Virtual Pet (Tamagotchi stats), Water Reminder, System Resources (CPU/RAM/GPU/disk HUD). Community: Vocabulary Drag & Drop, Spotify Buddy, Walkabout, Usage Buddy, Higgsfield Watch |
| AI assistant (v4) | Talk or chat to the pet; it calls actions that plugins expose (set a reminder, start focus, launch app). Separate choice of text, speech-to-text and text-to-speech providers, local or cloud. Editable personality. History kept locally (max 200 messages / 30 days) |
| Coding agents | Local MCP server with 3 tools: `openpets_status`, `openpets_react` (thinking, working, editing, testing, success, error…), `openpets_say` (short bubbles; code, paths, URLs and secrets are refused). Ready-made hooks for Claude Code, OpenCode, Cursor, Devin, Pi, OpenClaw, Zed. Each agent session gets its own pet |
| LAN mode (experimental) | One pet walks between PCs on a network |
| Pet Studio | A **web** product at openpets.dev/studio, not in the app. *(site claim: turns a photo or idea into an animated pet, and draws outfits with every animation)*. How it generates (which AI) is not public in the repo |

## 3. Characters

- **Built into the app: one** — "Hoodie Cat", with three outfits (pajamas, summer, halloween).
- Everything else comes from the online catalog or from users. Their strength is **quantity via community + AI Studio**, not hand-made built-ins.

## 4. Pet format (exact)

Folder (or ZIP) with:

```
pet.json
spritesheet.webp        (or spritesheet.svg, never both)
outfits/<id>.webp       (optional, one per outfit)
activities/<id>.webp    (optional, one strip per activity)
```

`pet.json` required: `id`, `displayName`, `description`, `spritesheetPath`. Optional: `category`, `subcategory`, `sourceUrl`, `xHandle`, `spriteVersionNumber` (1 or 2), `gazeAnchor {x,y}`, `wardrobe`, `activities`.

Atlas: cells **192×208**, 8 columns.
- **V1:** 1536×1872, 9 rows.
- **V2:** 1536×2288, 11 rows — rows 9-10 are 16 look-direction frames (eyes follow the cursor).

| Row | Name | Frames | Duration | Used for |
|---|---|---|---|---|
| 0 | idle | 6 | 5.5 s loop | idle |
| 1 | running-right | 8 | 1.06 s | walking |
| 2 | running-left | 8 | 1.06 s | walking |
| 3 | waving | 4 | 0.7 s ×2 | waving |
| 4 | jumping | 5 | 0.84 s ×2 | success, celebrating |
| 5 | failed | 8 | 1.22 s ×2 | error |
| 6 | waiting | 6 | configurable | testing, waiting |
| 7 | running | 6 | 0.82 s | working, editing, running |
| 8 | review | 6 | 1.03 s | thinking |

Rules: pets contain **art only, never code**; ZIPs checked for unsafe paths and symlinks; 25 MB download cap; install links always ask first.

## 5. What this means for Loaf

| Finding | Effect on our plan |
|---|---|
| Our packs match V1 exactly (cell size, rows, order, frame counts) | D-SIZE closed: 192×208. Packs ship `spritesheet.webp`; `pet.json` now holds only their 4 required fields, our extras moved to `loaf.json` |
| V2 adds cursor-gaze rows | New item FR-59: add the 2 gaze rows (16 look directions) to our packs |
| Wardrobe = outfits with schedules | Our FR-49 accessories should be built as **wardrobe outfits** in the same format, so packs stay compatible both ways |
| Activities = one-shot animations | Our emotes (FR-40) export as **activities** strips |
| Their Studio is a web AI generator | Ours stays **local**: assemble packs from built-in art + accessories, import/validate packs, preview rows. AI generation waits for the AI provider (on hold) and personal characters (on hold) |
| They import Codex pets and have a catalog of hundreds | FR-50 should **import any Codex/OpenPets pack** — instant library without drawing |
| They are a pet platform with light productivity plugins | Our difference: real notes/tasks/meetings/time tracking, student-first, local-first. Do not copy the plugin breadth; copy the pack format |
| Their MCP: status/react/say + per-agent pets | Use as the reference for FR-54 (D-MCP-SHAPE stays on hold) |
| Wellbeing plugins (breathing, water, mood) | Candidates for M8 Focus & wellbeing |
| Drag-and-throw physics, cursor gaze | Cheap delight features for the pet window (FR-60) |
