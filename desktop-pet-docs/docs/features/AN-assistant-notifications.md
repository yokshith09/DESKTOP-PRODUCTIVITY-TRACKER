# AN: AI Assistant Completion Notifications

**Status:** DRAFT (plan only, nothing built). Written 2026-10-14 on the owner's request. **Not READY:** open questions U17–U22 in [`DECISIONS.md`](../../DECISIONS.md) must be answered first, and AN-00 (a verification spike) must run on a real machine before AN-03/AN-04 start.
**Milestone:** [`ROADMAP.md`](../../ROADMAP.md) M6.4 (inside "Reminders & contextual pet"). **Phase/Priority:** post-v1 · P1.
**Size:** about 19 relative dev-days across nine features (each ≤3 days, per `06-feature-definition.md`).

## 1. User story

As someone who starts a long AI coding task and goes to another app, I want Loaf to tell me — with a native notification and the pet — when the assistant **finishes**, **needs my input** or **fails**, and take me back to that session, so I stop checking the terminal. Start with Claude Code; add other assistants only where a supported mechanism is verified.

## 2. What was inspected (existing architecture)

| Area | What exists | Consequence for this plan |
|------|-------------|---------------------------|
| Notifications | `src-tauri/src/notify.rs`: one `show()` over `tauri-plugin-notification`, plus taskbar flash (`request_user_attention`) and a pet reaction. Used only for reminders. Test button in Settings. | Reuse `show()`; split policy from delivery. |
| Plugin limits | `tauri-plugin-notification` 2.5.1 on desktop uses **title, body, icon, sound only**. No click callbacks, no buttons. (Read from the source in the cargo registry.) | "Session navigation" cannot come from the plugin; see AN-06. |
| Event bus | `loaf-core` `Event` enum, publish-after-commit, forwarded to webviews, ts-rs types. | Add one **ephemeral** event; it is not a database fact. |
| Pet | `src/pet/reactions.ts` maps events to a pose + bubble, with priority and a queue. | One new reaction row; no new engine. |
| Settings | Typed keys in `loaf-core/src/settings.rs`, validated, defaults in Rust, mirrored in `src/ipc/settings.ts`. **No quiet-hours or per-category notification settings exist yet.** | New `assistants.*` / `notifications.quiet_hours` keys. |
| Process model | `tauri-plugin-single-instance` already forwards args of a second launch. Tokio `full` (includes `net`) is already a dependency. | A listener needs no new crate. |
| ADR-009 | Event-driven; any interval check needs a new ADR. | Ingress is a blocking accept on a pipe/socket: no timers, no polling. |
| ADR-010 | Browser bridge rejected a localhost HTTP/WebSocket server ("any local process or webpage could probe it; firewall prompts"). Chose a native host + local channel. | Same reasoning applies: **no localhost port**; use a per-user named pipe / Unix socket. |
| ADR-011 | Secrets in the OS keychain, never SQLite. | This feature needs **no credentials at all** (see §7). |
| Signing | Not set up (owner's certificates). | A bundled helper must be signed too; blocks shipping, not building. |

## 3. What Claude Code provides (documented; checked 2026-10-14 against code.claude.com docs)

Source pages: hooks reference, hooks guide, settings, sessions, deep-links, headless. **The hooks security section and the full env-var list were not readable in the research pass; AN-00 re-checks the live page.** Items marked UNCONFIRMED must be settled by the AN-00 probe, not assumed.

| Need | Mechanism | Notes |
|------|-----------|-------|
| Finished | `Stop` hook (**per turn**, not per task). Stdin JSON has `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `permission_mode`, `stop_hook_active`, **`last_assistant_message`**. | Also `SubagentStop`, `TaskCompleted`. Prompt text is **not** in the payload. |
| Needs input | `Notification` hook, matcher on `notification_type`: `permission_prompt`, `idle_prompt`, `elicitation_dialog`, `agent_needs_input`; has `message`, optional `title`. `PermissionRequest` also exists. | Cannot block; exit code ignored. `idle_prompt` repetition UNCONFIRMED. |
| Failed | `StopFailure` (per turn, output ignored). `PostToolUseFailure` is per tool call (too noisy; not used). | |
| Session start/end | `SessionStart` (source: startup/resume/clear/compact/fork), `SessionEnd` (1.5 s budget). | `UserPromptSubmit` gives a turn start time. |
| Handler types | `command`, `http`, `mcp_tool`, `prompt`, `agent`. `command` supports `async: true` (background, timeout not enforced). `http` is non-blocking on failure by default. | |
| Config | `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, managed policy, plugins. Hooks from all levels merge. `disableAllHooks`, `allowedHttpHookUrls`, `allowManagedHooksOnly` can switch them off. | Restart need after editing: not stated. |
| Resume | `claude --resume <session-id>`, `--continue`. Deep link `claude-cli://open?repo=…&cwd=…&q=…` opens a **new** terminal with a prefilled prompt; **no session-id parameter**. | **No documented way to focus the existing terminal or tab.** |
| Terminal identity | No documented env vars for it. Hooks inherit the parent environment, so `TERM_PROGRAM` / `WT_SESSION` may exist. | UNCONFIRMED. |
| Surfaces | CLI terminal: yes. VS Code, JetBrains, desktop app, web (cloud) sessions, headless `-p`: UNCONFIRMED. | Cloud sessions run in a container and cannot reach a local pipe: **unsupported by design**. |

## 4. Decisions in this plan (with the reason)

1. **Ingress: a `command` hook that runs a tiny helper, `loaf-hook`, which writes one line to a per-user named pipe (Windows) or Unix socket (macOS).** Why: matches ADR-010 (no open port), is event-driven (the app blocks on accept), and the helper can be made to **always exit 0 and never print**, so it can never block or confuse Claude Code.
2. **Rejected: `http` hook to a localhost port.** Needs a port, a token and a discovery file, and reopens the exact exposure ADR-010 closed. Revisit only with a new ADR.
3. **MCP is not used.** MCP tools are called *by the model*; using one for notifications would need the LLM to decide to call it — unreliable, and it is the continuous model execution this feature must avoid. (The `mcp_tool` hook type could call one deterministically, but that needs a separate MCP server process spawned by Claude Code, not the running app. No benefit over the helper.) Re-evaluate for other assistants only if one offers MCP as its sole mechanism.
4. **Integration is separate from notification.** An *adapter* turns a vendor payload into a vendor-neutral `AssistantEvent`. The *policy* and the *notifier* only ever see `AssistantEvent`. Adding an assistant = adding an adapter + a verification record, nothing else.
5. **No conversation data is kept.** Events live in an in-memory ring (last 50) for a "Recent activity" list. Nothing is written to SQLite, export or logs (§7).
6. **Navigation is best effort and honest.** It restores the *right project* with `claude --resume <id>`; it focuses an existing window only where a spike proves it (AN-06). It never guesses a window.

## 5. Architecture

```
Claude Code hook ──stdin JSON──▶ loaf-hook ──one JSON line──▶ per-user pipe / socket
  (Stop, StopFailure,            (allow-list,                     │
   Notification,                  size cap, exit 0 always)        ▼
   UserPromptSubmit)                                     [shell] Ingress  (src-tauri/src/assistants/ingress.rs)
                                                                  │ raw line, 64 KB cap, 2 s read timeout
                                                                  ▼
                                                         [shell] Adapter  (assistants/claude_code.rs)
                                                                  │ validate → AssistantEvent
                                                                  ▼
                                                         [core]  loaf_core::assistants
                                                                  │  Dedupe → NotificationPolicy → Decision
                                                                  ▼
                                    bus Event::AssistantEvent (ephemeral) ──┬─▶ Notifier (native toast, taskbar flash)
                                                                            ├─▶ pet reaction (reactions.ts)
                                                                            └─▶ Recent activity list (UI)
```

`AssistantEvent` (vendor-neutral, all fields optional except the first four):
`assistant` ("claude_code"), `kind` (`Finished` | `NeedsInput` | `Failed`), `session_id`, `at`, `project` (folder name of `cwd` only), `detail` (bounded text, see §7), `turn_seconds`, `nav` (resume hint: sanitized id + existing `cwd`).

`trait Adapter { fn id(&self); fn parse(&self, line: &[u8]) -> Result<AssistantEvent, Rejected>; }` — pure, no I/O, fully unit-tested with recorded payloads.

## 6. Features (each ≤3 days)

| ID | Feature | Days | Depends on |
|----|---------|-----:|------------|
| AN-00 | **Verification spike**: probe hook on the owner's machines; record events, payloads, surfaces, env vars, duplicates | 1.0 | none |
| AN-01 | Core: `AssistantEvent`, `Dedupe`, `NotificationPolicy` (quiet hours incl. overnight, per-kind, min turn time, rate limit) | 2.0 | AN-00 |
| AN-02 | Settings keys and **Settings › Assistants** screen (status, switches, quiet hours, preview, test) | 2.0 | AN-01 |
| AN-03 | `loaf-hook` helper crate (+ `notify` subcommand for any tool) | 2.0 | AN-00 |
| AN-04 | Shell ingress (pipe/socket) + Claude Code adapter + bus event + failure handling | 3.0 | AN-01, AN-03 |
| AN-05 | Notifier: native notification, taskbar flash, pet reaction, Recent activity | 2.0 | AN-04 |
| AN-06 | Session navigation: click/activation → focus or resume (spike first) | 3.0 | AN-05 |
| AN-07 | Bundle the helper, resolve its path, hook snippet and (if approved) guided install | 3.0 | AN-03, U17, signing |
| AN-08 | Real-OS verification on Windows and macOS + CI wiring | 1.0 | AN-05, AN-07 |
| AN-09 | Other assistants: one verification record each; adapter only after it passes | per assistant | AN-08 |

### AN-00 Verification spike (gate for everything else)
Ship `scripts/hook-probe` (a logging-only hook: appends `event name`, field *names* (not values), `permission_mode`, `$TERM_PROGRAM`, `$WT_SESSION`, parent process name, timestamp to a local file). The owner runs one short Claude Code session in each place they use it.
**Acceptance:** `docs/features/AN-verification.md` exists with a table, filled from real runs: (a) which events fire in terminal CLI, VS Code, JetBrains, desktop app, `claude -p`; (b) whether `Stop` fires for subagent turns and how often `idle_prompt` repeats; (c) whether a hook is blocked by `disableAllHooks`/restarts needed after editing settings; (d) which env vars identify the terminal on Windows Terminal, PowerShell, cmd, macOS Terminal, iTerm, VS Code; (e) the hooks security page re-read. Anything not observed stays UNCONFIRMED and the feature that depends on it is marked unsupported for that surface.

### AN-01 Core policy (pure, `loaf-core`)
- `NotificationPolicy::decide(event, now, settings, history) -> Decision { Show | Suppress(Reason) }`. Reasons: `Disabled`, `KindOff`, `QuietHours`, `Duplicate`, `RateLimited`, `TooShort`.
- Quiet hours: start/end local times, may cross midnight, optional weekdays; evaluated **at event time** (no timers). During quiet hours: no toast, no sound, no taskbar flash; the event still appears in Recent activity. `NeedsInput` does not break through (U20).
- Dedupe key `(assistant, session_id, kind)`: repeat within 30 s collapses; `idle_prompt` is suppressed if a `Finished` for the same session arrived in the last 10 min; per-session cooldown 10 s; global cap 5 toasts/min then one summary toast.
- `TooShort`: a `Finished` for a turn shorter than `assistants.min_turn_seconds` (default 20 s, from `UserPromptSubmit`→`Stop`) is not announced. If no start time is known the event is announced.
- All time via the existing `Clock` trait so tests use `FakeClock`.
**Acceptance:** table-driven tests for every Reason; overnight quiet hours (22:00–07:00) at 23:30, 06:59, 07:00; DST-day sanity; 1,000 random events never panic; state is bounded (ring ≤ 50, dedupe map ≤ 200, entries expire on access).

### AN-02 Settings and screen
Keys (all validated in Rust, defaults in Rust, mirrored in `settings.ts`, covered by the "all defaults exist" test):
`assistants.enabled` (false until the helper is installed), `assistants.claude_code` (true), `assistants.notify_finished` / `_needs_input` / `_failed` (true), `assistants.min_turn_seconds` (20), `assistants.preview` (**false**), `assistants.sound` (false), `assistants.pet_reaction` (true), `notifications.quiet_hours` (`{enabled:false, start:"22:00", end:"07:00", days:[]}`).
Screen: status line ("Connected, last event 2 min ago" / "Hooks not installed"), per-kind switches, quiet hours, preview toggle with the privacy sentence, **Send a test event**, link to system notification settings (reuses `notification_settings_open`).
**Acceptance:** every control persists and applies live; disabled master switch makes the ingress drop events before parsing; accessibility labels; component tests for each control.

### AN-03 `loaf-hook` helper (`crates/loaf-hook`, std + serde_json only)
- Reads stdin (cap 256 KB), extracts **only** an allow-list: `hook_event_name`, `session_id`, `cwd`, `notification_type`, `message`/`title` (bounded), `last_assistant_message` (bounded), `permission_mode`; env hints `TERM_PROGRAM`, `WT_SESSION`; its parent chain's process name. It **never reads `transcript_path`** and never forwards unknown fields.
- Sends one JSON line to the per-user pipe/socket, connect timeout 150 ms, then exits. **Always exit code 0, prints nothing**, even on malformed input or no running Loaf (the event is dropped, optionally counted in a local file the app reads on start: off by default).
- `loaf-hook notify --assistant <name> --kind finished|needs_input|failed [--title …] [--cwd …]` for any other tool or script (also the AN-09 generic path).
**Acceptance:** unit tests for the allow-list (a payload with a fake secret in an unknown field is not forwarded), size caps, malformed JSON, no-listener exit 0 in <200 ms, no stdout/stderr output; binary size < 1.5 MB; runs on Windows and macOS in CI.

### AN-04 Ingress and adapter (shell)
- Windows: `tokio::net::windows::named_pipe` server `\\.\pipe\loaf-hook-<user SID>`, DACL granting only the current user, `reject_remote_clients(true)`. macOS: `tokio::net::UnixListener` at `<app data dir>/hook.sock`, directory 0700, socket 0600 (fall back to a short `$TMPDIR` path if the path exceeds the 104-byte limit).
- One task parked on `accept()`: **zero CPU when idle, no timers.** Each connection: 2 s read timeout, 64 KB cap, one line, then close.
- Adapter validates (`session_id` is `[A-Za-z0-9_-]{1,100}`; `cwd` is an absolute path, only its last component is kept; text is control-character-stripped and bounded), builds `AssistantEvent`, publishes `Event::AssistantEvent`.
- Failure handling: a bad line is counted and dropped (log: kind and reason only); a panic in one connection cannot stop the listener; if the pipe cannot be created (already in use, permissions) the status says so and the app continues; when `assistants.enabled` is off the listener is not even started.
**Acceptance:** integration tests send valid, oversized, truncated, slow and binary payloads; listener survives all; two Loaf processes cannot both own the pipe; pipe/socket is not reachable by another OS user (permission test where the platform allows); 10,000 events in 10 s cost under 50 MB peak and do not grow memory.

### AN-05 Notifier
- Calls the existing `show()` with: title `Claude Code — finished` / `needs your input` / `failed`; body `project · session label` (first 8 chars of the id), plus the bounded preview **only if** `assistants.preview` is on. Sound only if `assistants.sound` is on. Taskbar flash like reminders. Pet reaction row (`Finished` → cheer, `NeedsInput` → catch/ring-style nudge, `Failed` → worried).
- Recent activity list (in-memory ring) on the Settings screen and as a pet-card line.
- Delivery failure is logged (no content) and falls back to the taskbar flash + pet; a refused notification never stops the pipeline.
**Acceptance:** component and unit tests for each kind; preview off ⇒ no message text anywhere in the toast, pet bubble or logs (asserted); suppressed events appear in Recent activity with the reason; end-to-end latency from a `loaf-hook` call to a toast request under 500 ms in the test harness.

### AN-06 Session navigation (spike, then build)
Facts: the plugin has no click callback (§2). Windows: `tauri-winrt-notification` (already in the dependency tree) supports `on_activated` and buttons; it needs a registered AppUserModelID, which an installed app has and a dev build does not. macOS: click handling needs `UNUserNotificationCenter` (the lockfile already holds `objc2-user-notifications`) or `mac-notification-sys` click waiting, and works properly only from a signed bundle.
Plan: (1) spike both platforms (1 day) and record what works in `AN-verification.md`; (2) build in this order of preference, stopping at the first level that is verified: **L3** click focuses the original terminal/IDE window (Windows: parent-process walk to a top-level window; macOS: `NSRunningApplication.activate` of the parent app) — shipped only if the spike proves it and only for terminals it can identify; **L2** click opens Loaf's Recent activity with buttons *Open terminal here and resume* (`wt`/Terminal with `claude --resume <id>` in `cwd`, spawned **without a shell string**, id and cwd validated) and *Copy resume command*; **L1** no click support: the toast text says where and the pet card shows the command.
**Acceptance:** whichever level ships, it opens or focuses the *correct* project/session or does nothing visible and offers L1 — never a wrong window; the resume launch rejects an id or path containing shell metacharacters (tests); documented per-terminal support table.

### AN-07 Bundling, install, uninstall
- Build `loaf-hook` as a Tauri sidecar (`bundle.externalBin`) for both OSes; the Settings screen resolves and displays the real path and detects whether it exists.
- Hooks snippet (copyable, for `~/.claude/settings.json`): `Stop`, `StopFailure`, `Notification`, `UserPromptSubmit`, each `{ "type": "command", "command": "<resolved path>", "async": true }`.
- **Guided install (only if U17 = yes):** shows the exact diff, makes a timestamped backup, merges without touching other entries, marks Loaf's entries so Remove deletes only them; never silent, never on first run.
**Acceptance:** installing then removing leaves `settings.json` byte-identical except for formatting; refuses to edit invalid JSON; works when the path contains spaces; both OS installers contain the helper (CI asserts it); signing status recorded (blocked on certificates).

### AN-08 Verification
CI covers: all unit/integration tests above on Windows and macOS, helper build, pipe/socket tests, lint, coverage floors. **Real-OS manual checklist** (owner): toast appears while another app is focused; appears under Focus Assist / Do Not Disturb per system rules (documented, not forced); quiet hours; disable switch; duplicate storm; kill Loaf mid-run (Claude Code must not slow down or error); no Loaf running; unplug/replug nothing relevant. Everything stays **Unverified** until the owner runs it.

### AN-09 Other assistants (gate, not a promise)
No adapter is written until its record in `AN-verification.md` shows: (1) a **documented** event or hook mechanism, with the URL; (2) the payload fields seen in a real probe; (3) where it is configured and on which OS; (4) which events map to Finished/NeedsInput/Failed; (5) the privacy impact. Candidates to *investigate* (none assumed to work): OpenAI Codex CLI, Gemini CLI, Cursor, GitHub Copilot CLI/agent, Aider, Windsurf. Tools without a mechanism can still use `loaf-hook notify` from a wrapper script (`long-command; loaf-hook notify --assistant X --kind finished`).

## 7. Privacy and credentials

- **No credentials are used or stored.** No API keys, tokens or network calls. (ADR-011 is not triggered.)
- The helper forwards an allow-list only. It never opens `transcript_path`.
- `last_assistant_message` and `message` are **off by default** in notifications (`assistants.preview=false`). When on: first line, ≤120 characters, control characters stripped, obvious secrets redacted (common token prefixes, `Bearer …`, `password=…`, private-key headers, long base64/hex strings), never stored, never logged, never exported.
- Logs contain `assistant`, `kind`, `Decision` and counts only (a test greps the log for a planted secret).
- The OS notification centre may keep notification text in its own history; the Settings screen says so next to the preview switch.
- The pipe/socket is per-user; any process of the *same* user can still send events, which can only cause a notification (low impact, documented).
- The feature is **off until the user installs the hooks** and can be disabled at any time; disabling stops the listener.

## 8. Platform support (what is and is not claimed)

| | Windows 10/11 | macOS 12+ |
|-|---------------|-----------|
| Toast while another app is focused | expected via the existing plugin; **Unverified** | expected; user must allow notifications for Loaf; **Unverified** |
| Pipe/socket ingress | named pipe, current-user DACL; **Unverified** | Unix socket 0600; **Unverified** |
| Click → navigation | per AN-06 spike; dev builds lack an AppUserModelID | per AN-06 spike; needs a signed bundle |
| Claude Code surfaces | terminal CLI expected; others UNCONFIRMED until AN-00 | same |
| Cloud (web) sessions | unsupported by design | unsupported by design |

## 9. Performance budget

Idle: 0% CPU, no timers, no polling (accept is a blocking wait). Memory: ≤ 2 MB for state. Helper: < 100 ms wall time per call. Hook → toast request: < 500 ms. Claude Code is never slowed: `async: true`, exit 0, 150 ms connect cap.

## 10. Out of scope (v1)

Replying to a prompt from the notification; reading or summarizing transcripts; any LLM call; cloud-session support; mobile push; notifying for every tool call; persisting history; assistants without a verified mechanism.

## 11. Open questions (must be empty before READY)

See `DECISIONS.md` U17–U22: auto-edit of `~/.claude/settings.json`; preview default; signing the helper; whether `NeedsInput` may break through quiet hours; whether reminders adopt the same quiet hours and policy; accepting that cloud sessions are unsupported.


## Owner decisions, 2026-10-18

- **Primary channel is the pet bubble.** A small bubble above the pet says what happened ("Claude finished <project>", "Claude needs your answer", "Claude failed"). Any assistant can use the same bubble, not only Claude Code. The OS toast is optional and off by default (U23).
- **Quiet mode** can be set manually (a switch on the pet) or by quiet hours. In quiet mode an assistant event still shows a small bubble, with no sound and no OS toast. Reading it is a click or a dismiss. (U20, overrides the earlier default.)
- **Install is automatic** (U17): Loaf edits `~/.claude/settings.json` with a backup and an undo. No snippet-only path.
- **Helper binary (U19):** the hook needs a program to call. Options: (a) a separate tiny signed `loaf-hook.exe`; (b) the existing `loaf.exe` with a fast CLI path that does not open a window. (b) means one binary to sign, but each hook call starts the full app runtime, which must be measured before it is chosen. The signing certificate is the blocker either way.
- **Conflict to resolve:** ROADMAP M6.2 says "no bubbles inside quiet hours". The owner's new rule keeps bubbles for assistant events. M6.2 must be amended in the same change.
- **Scope note:** acceptance criteria for AN-05 now include: bubble appears above the pet and follows it; bubble stacks at most 3 and auto-dismisses after 8 s; quiet mode produces no sound and no toast; a notification is never lost (kept in Recent activity).
