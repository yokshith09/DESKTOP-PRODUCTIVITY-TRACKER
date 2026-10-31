# Research notes: integrations, MCP and developer events

*Recorded 2026-10-31 at the owner's request, for the owner's own review. Nothing here is built. Confidence tags: [Certain] checked in a source, [Likely] strong inference, [Memory] from memory, check first.*

## A. Will the pet show that Claude finished, a build ended, or a push succeeded?
Planned in P4 (not built). Mechanisms, in the order they would be built:
1. **Coding-assistant link (P4 step 2).** Claude Code can run a command on events such as "finished" and "needs your input" ("hooks"). A hook calls Pluto's `react` or `say` tool through the bridge. The pet is a separate always-on-top window, so it shows over WhatsApp or any other app, except while another app is full screen and `pet.hide_fullscreen` is on. [Likely]
2. **Git events (P4 step 3).** Pluto watches the git state of folders you pick (never source): a commit moves the branch ref, a successful push moves `refs/remotes/origin/<branch>`. This works for VS Code, a terminal or any other tool, with nothing to install in VS Code. [Likely]
3. **Build finished or failed.** Git cannot see it. Options: a one-line wrapper (`npm run build && pluto react success || pluto react fail`), a VS Code task that calls the same command, or a small VS Code extension later. [Likely]
4. **CI red or green.** Needs a GitHub token you add yourself; off without it.
Open questions: which assistants first, whether reactions may interrupt a focus session, rate limits (the five MCP design questions).

## B. People who don't install AI apps
Pluto works fully on its own; MCP is optional. For mail and calendar without an AI app, in build order:
1. Local `.ics` import (P5): free, no sign-in.
2. Calendar feed URL: Google Calendar gives each calendar a private iCal address; free, no OAuth, small opt-in fetch. [Likely] Updates can lag.
3. Gmail over IMAP with an app password: free, no Google review, no weekly expiry. [Likely]
4. Direct connectors with sign-in: on-hold P9.

## C. Case 1: an AI app connected to Gmail, Drive, Granola, Wispr Flow
- Automation is partial. MCP is request-driven; nothing updates unless an AI app runs a model that calls tools. A scheduled task in the AI app can do "every morning read my calendar and add tasks".
- Active only while that AI app and Pluto are both running on the PC. [Certain] A cloud-scheduled agent cannot reach Pluto: the bridge is local.
- Writing into Pluto needs a `task_create` tool. P4 has only `status`, `react`, `say`. **Decision needed from the owner.**

## D. Case 2: tokens, costs, open source
- Access tokens are short; a refresh token renews them silently. [Certain] Google ends refresh tokens after 7 days for apps in "Testing" status, forcing weekly sign-in. Publishing the app removes that; for personal use it shows an "unverified app" warning (clickable); unverified apps are capped at 100 users.
- [Likely] A purely local app avoids the paid security audit (which applies to apps that store or send data on a server). Gmail read access still needs Google verification for public release.
- Costs: Google Calendar/Gmail/Drive APIs free (effort is verification, Gmail hardest); Microsoft 365 [Memory] free API, company accounts need admin approval; Notion, Todoist, GitHub [Memory] free API with rate limits, user supplies the token; Granola free plan limited to the last 30 days, Business about $14 per user per month; Wispr Flow pricing unknown, cloud-based; Apple Calendar on macOS free and local.
- Open source: community MCP servers for Gmail/Calendar/Drive (own Google credentials, review before use); open protocols (IMAP, CalDAV, iCal) with free Rust libraries; n8n and Activepieces self-hosted; `whisper.cpp` (MIT, on-device) for the voice phase instead of a cloud service.

## E. Open decisions this raises
1. Is an opt-in network fetch (calendar feed URL) acceptable in the local-first rule? It would add the first HTTP client to the app.
2. Should the MCP server be allowed to create tasks and notes (writes), or stay read-only plus `react`/`say`?
3. Order: calendar feed before or after the MCP server?
