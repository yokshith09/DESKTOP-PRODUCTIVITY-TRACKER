# Competitor audit — OpenPets

**Date:** 2026-10-22 · **Status:** research only, no code changed · **Product name:** undecided, not renamed.

## 0. Source quality (read first)

- Sources: [openpets.dev](https://openpets.dev/), [AI desktop pets page](https://openpets.dev/ai-desktop-pets), [OpenPetsHQ/openpets](https://github.com/OpenPetsHQ/openpets). Direct fetch of the site failed from this environment (DNS/403); the GitHub page and search results worked.
- Several repositories and forks share the name "openpets". The official one is **likely** OpenPetsHQ/openpets. [Likely]
- Pet Studio, "35 MB" and "four animation states" come from search snippets only, not from running the app. [Likely]
- Nobody ran OpenPets for this audit. Everything below is **Unverified** feature claims, not tested behaviour.

## 1. What they do [Likely unless noted]

| Area | OpenPets | Evidence |
|---|---|---|
| Core | Desktop pet that sits on screen and reacts to AI coding agents | site, repo |
| Agent link | Agents report status / react / say through MCP | repo |
| Pets | A gallery / catalog of community pets | site |
| Pet Studio | Make a pet from a photo (few animation states) | snippet only |
| Extensibility | Plugin SDK with sandbox and declared permissions | repo |
| Platforms | Windows, macOS, Linux | site |
| Licence | MIT | repo [Certain that the repo shows a licence; MIT per page] |
| Data | Local-first, user brings their own AI keys | site |

Their positioning: a **companion for people who run AI coding agents**. The pet is the display; the agent is the source of events.

## 2. What we do and they do not [Likely]

- Notes, tasks, daily progress, search, labels, export/import/delete-all (M1). OpenPets is not a productivity store.
- App-time and site-time tracking, privacy panel (M3, option d).
- Reminders with pet reactions; five hand-drawn characters (bear, Mochi, Pip, Bolt, Ghosty) with typing/wait/cheer/sleep poses and drawn turned views.
- Planned: focus, Project Spaces, student tools, Meetings, voice.

## 3. What they do and we do not

| Gap | Why it matters | Our answer |
|---|---|---|
| Agent/MCP integration | Their whole hook | M10 is MCP **connectors** (we call out), not an MCP **server** (agents call us). Different thing. |
| Community gallery | Growth loop | Needs a server → blocked by D-BACKEND. Not before local features are final. |
| Plugin SDK | Ecosystem | Large attack surface. Not before core is stable. |
| Linux build | Reach | Unplanned. Tauri supports it; we have no tester. |
| Photo→pet in public | Marketing | We have it as CH-05/06, Limited first release. |

## 4. What is possible for us, what is not

**Possible, cheap, local-only** [Likely]
1. A small **local MCP server** ("loaf-mcp"): tools `set_status`, `say`, `react`, plus read-only `list_tasks`/`add_task`. Binds to 127.0.0.1 or a stdio transport, opt-in, off by default. This lets coding agents drive the pet and lets students/devs add tasks by voice-of-agent. Reuses the emote registry (FM-8b).
2. Pet reactions to **our own** events (focus end, task done, deadline) — already planned (M6, EM-06).
3. A **local character pack format** (zip with manifest + SVG/PNG states) for sharing by file, no server. This is the seed of a gallery without a backend.

**Possible, but expensive or risky**
- Plugin sandbox: needs a permission model, review, and signing (signing is on hold). Do not start.
- Linux: build probably works; support cost is the problem, not code.

**Not possible / not wise** [Certain for our locked decisions]
- Browser extension — ruled out permanently by the owner.
- Public gallery or accounts without a server — blocked by D-BACKEND.
- Beating them on agent integrations by volume: they are the specialist; we should not chase every agent.
- GPU image generation — owner said no GPU.

## 5. Strategic read

[Likely] OpenPets competes for the **developer** segment. The owner now wants **students first**. That makes them a secondary competitor: overlap is the pet and the dev-agent hook, not notes/tasks/focus. Do not copy their roadmap; take one idea (local MCP status hook) and one lesson (a shareable pack format).

## 6. Recommended next steps (owner decides)

1. Add D-COMPETE-OPENPETS as **informational**; no milestone change.
2. Park "loaf-mcp" as an idea under developer stage (see PROJECT_STATE_REPORT §8). Needs an owner decision on opt-in and transport before any code.
3. Re-check OpenPets by actually installing it on the owner's PC; this audit cannot replace that.


## Update 2026-10-22 (owner decisions and extra research)

- Further OpenPets facts (search results and the GitHub page; the site itself was unreachable, so **unconfirmed**): pet bundle = `pet.json` + spritesheet; in-app Pet Gallery plus a web catalog with a submit page; Pet Studio (describe or upload, then it animates); user-configurable reaction mapping; plugin SDK v3 with a sandboxed window, permissions approved at install, network limited to declared hosts; MCP tools `openpets_status`, `openpets_react`, `openpets_say`; macOS, Windows, Linux AppImage; MIT.
- Owner decisions: backend YES, gallery YES, plugins from the website YES, Linux YES, local MCP YES, sprite packs instead of Rive. Specs: FR-50, FR-54..FR-57; Studio: `../character/CHARACTER_STUDIO_SPEC.md`.
- Not copying: AI "describe to animate" (waits for AI and the personal-character HOLD).

## Research 2026-10-22 (evening): what the pet format really is

openpets.dev, docs.openpets.dev and openpets.app could not be resolved from this environment (DNS failure); GitHub could. Findings:

- Several unrelated projects use the name "OpenPets"; they share the **Codex Pets** bundle: a folder with `pet.json` and `spritesheet.webp`.
- [alterhq/openpets](https://github.com/alterhq/openpets) (MIT, macOS): `pet.json` has `id`, `displayName`, `description`, `spritesheetPath`; atlas is 8 columns x 9 rows, width divisible by 8, height by 9. Row order: idle, running-right, running-left, waving, jumping, failed, waiting, running, review — **identical to our `ROWS`**. Pets are found in `~/.codex/pets/`, `~/.config/openpets/pets/` and similar.
- [X-T-E-R/OpenPet](https://github.com/X-T-E-R/OpenPet) (GPL-3.0, Windows-first Tauri app): its bundled pack is 1536x1872, cells 192x208 — **confirms D-SIZE**. Imports from Petdex, Codex Pets, SpriteYard, Codex Pet Shop by URL, stores locally, CLI/MCP/HTTP control. Closest competitor to Loaf on Windows.
- The OpenPets docs (via search snippet) list optional `category`, `subcategory`, `sourceUrl`, `xHandle`, and frames of at least 192x208.
- Not found: per-row frame counts, an official JSON schema, a Character Studio. The "studio" seen elsewhere is a generator/validator site (openpets.app), not an editor.

Effect on Loaf: our layout matches; we switched to WebP. Our extra `pet.json` fields (`cell`, `rows`, `license`, `status`) should be ignored by other apps but this is **Unverified** until a pack is loaded in OpenPet on Windows.
