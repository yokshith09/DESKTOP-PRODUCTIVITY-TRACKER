# MCP from zero to production — an engineer's course

**For:** the owner of Loaf, to become an engineer who can design, build, test, host and secure MCP servers end to end, then build Loaf's own.
**Written:** 2026-10-29. **Evidence labels:** **[Verified]** = I ran it or read it on the official site today; **[Memory]** = from my own knowledge, check before relying on it.
**Labs:** `mcp-labs/` next to this file. Labs 1 and 2 were run and their output is pasted below.

---

## 0. The ground truth you must know first: the protocol just changed

MCP has dated spec revisions. The newest, **2026-07-28**, is a big break from the previous, **2025-11-25** (which most existing clients and servers still speak). **[Verified: official changelog]**

| | 2025-11-25 (widely deployed) | 2026-07-28 (latest) |
|---|---|---|
| Start of a conversation | `initialize` request, then `notifications/initialized` | **No handshake.** Every request carries protocol version and client capabilities in `_meta` |
| Sessions | A connection-scoped session; HTTP used an `Mcp-Session-Id` header | **No protocol sessions.** State you need is a handle your server mints and the model passes back as an ordinary argument |
| Discovery | Learned during `initialize` | New `server/discover` call (servers must implement it) |
| Server asks the client something (sampling, roots, elicitation) | Server sends its own request mid-call | **Multi Round-Trip Requests (MRTR):** the server answers `resultType: "input_required"` listing what it needs; the client retries with the answers |
| Change notifications | HTTP GET stream, `resources/subscribe` | One long-lived `subscriptions/listen` stream, opt-in per type |
| Removed | | `ping`, `logging/setLevel`, SSE stream resume (`Last-Event-ID`) |
| Results | | Every result has `resultType`; list results carry `ttlMs` and `cacheScope` for caching |
| Long jobs | "Tasks" in the core | Moved to an official extension (`io.modelcontextprotocol/tasks`) |

**What this means for you:** learn the protocol in the 2025-11-25 shape (it explains *why* things exist and is what you will meet in the wild), then learn what 2026-07-28 simplified. Your server should negotiate both eras, which is exactly why you use an official SDK instead of hand-rolling the protocol (§6).

Official map: `modelcontextprotocol.io` → Specification (pick the version in the corner), Documentation, SDKs, Inspector, Registry, SEPs (the change proposals; read the SEP behind any rule you don't understand).

---

## 1. What MCP is, in plain words

**The problem.** An AI app (Claude, Cursor, a chat window) wants to use your things: files, a database, a calendar, your desktop pet. Without a standard, every app needs a custom connector for every tool: N apps × M tools. MCP is the "USB-C port": one protocol, so each tool is written once and works with every app.

**Three roles.**
- **Host**: the AI application the person uses (Claude Desktop, Claude Code, an IDE). It owns the model, the UI and the user's consent.
- **Client**: a connector *inside* the host. One client per server connection.
- **Server**: your program. It exposes capabilities. It does **not** talk to the model; the host does.

**What a server can offer** (these are the "primitives"):
| Primitive | Who decides to use it | What it is | Example (Loaf) |
|---|---|---|---|
| **Tools** | The **model** | Functions with typed inputs that do something | `say`, `react`, `status` |
| **Resources** | The **app / user** | Read-only data addressed by URI, attached as context | `loaf://today` |
| **Prompts** | The **user** | Reusable templates, often shown as slash commands | `/plan-my-day` |

**What a client can offer back** (server-to-client features): **sampling** (the server asks the host's model to generate text), **roots** (which folders the server may look at), **elicitation** (the server asks the user for input or a confirmation). In 2026-07-28 these arrive through MRTR.

**It is not:** a REST API (it is a conversation with discovery built in), a plugin system that runs inside the app, or "function calling" itself. Function calling is how a model asks to use a tool; MCP is how the app *finds and runs* tools from other programs.

**Mental model to keep:** an MCP server is a small, well-documented, safe front door to one capability. The hard part is not the protocol (it is small). The hard parts are **tool design, security, and operations**.

---

## 2. The wire: what is actually sent

Everything is **JSON-RPC 2.0**, UTF-8. Three message shapes **[Verified]**:
- **Request**: has `id` and `method`; expects a response with the same `id`.
- **Response**: `result` or `error` plus the `id`.
- **Notification**: no `id`; nobody replies.

### Lab 1 trace (2025-11-25, stdio, run on 2026-10-29 with SDK 1.32.2) **[Verified]**
You send (one JSON object per line):
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"hand","version":"0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"say","arguments":{"text":"Hi","pose":"cheer"}}}
```
The server answers:
```json
{"result":{"protocolVersion":"2025-11-25","capabilities":{"tools":{"listChanged":true},"resources":{"listChanged":true}},"serverInfo":{"name":"pet-demo","version":"0.1.0"}},"jsonrpc":"2.0","id":1}
{"result":{"tools":[{"name":"say","description":"Make the desktop pet say something in a speech bubble.","inputSchema":{"type":"object","properties":{"text":{"type":"string","minLength":1,"maxLength":140},"pose":{"default":"idle","type":"string","enum":["idle","cheer","work"]}},"required":["text"]}}]},"jsonrpc":"2.0","id":2}
{"result":{"content":[{"type":"text","text":"The pet said: Hi"}]},"jsonrpc":"2.0","id":3}
```
Read it line by line until you could write it yourself:
1. `initialize`: the client states the version it wants and its capabilities; the server replies with the version it will use and **its capabilities** (here: it has tools and resources, and may notify when those lists change). This is *negotiation*.
2. `notifications/initialized`: "ready". (Gone in 2026-07-28.)
3. `tools/list`: the server describes every tool with a **JSON Schema** for its input. The model sees this text. It is part of your prompt.
4. `tools/call`: the actual work. `content` is a list of typed blocks (text, image, audio, embedded resource, resource link).

### Two kinds of failure (a classic interview question) **[Verified]**
- **Protocol error** (JSON-RPC `error`, e.g. `-32602` invalid params, unknown method): the *request* was broken.
- **Tool error** (`result` with `isError: true`): the request was fine but the *tool failed*. Put a message the **model can act on** here ("Task 12 not found; call list_tasks to see ids"), so it can retry sensibly.
Lab 1 shows this: calling `say` with empty text gives `isError: true` with "Input validation error ... expected string to have >=1 characters".

### Capabilities negotiation
A feature you did not declare is a feature the other side must not use. Declare only what you implement (`tools`, `resources`, `prompts`, `logging`, `completions`, and under 2026-07-28 `extensions`).

### Pagination, progress, cancellation, logging
- Lists are cursor-paginated (`nextCursor`); never return unbounded lists.
- Long calls can report `notifications/progress` when the request included a progress token.
- Either side can cancel an in-flight request (`notifications/cancelled`; on HTTP, closing the response stream).
- Logging is a server-to-client message with levels (2026-07-28: the level comes per request in `_meta`).

---

## 3. Transports: how bytes move

Protocol meaning is identical on every transport; the transport only frames and delivers messages. **[Verified: 2026-07-28 transports page]**

### 3.1 stdio (local)
The client **launches your server as a subprocess** and talks over its standard input and output: **newline-delimited JSON-RPC**, one message per line.
Rules that bite everyone:
- **Never print anything except protocol messages to stdout.** A stray `console.log`/`println!` corrupts the stream. Log to **stderr** (Lab 1's server does).
- Messages must not contain raw newlines (JSON escapes them).
- Closing stdin is the shutdown signal; exit cleanly.
- The server runs with **the user's full permissions**. That is the main local-security fact (§8).
Config the user writes in their host looks like (shape is common across hosts **[Memory]**):
```json
{ "mcpServers": { "loaf": { "command": "loaf-mcp", "args": [] } } }
```

### 3.2 Streamable HTTP (remote)
One endpoint (for example `https://host/mcp`). Each client message is an **HTTP POST**; the reply is either a plain JSON body or a **request-scoped SSE stream** (when the server wants to stream progress or intermediate messages). It replaced the old two-endpoint HTTP+SSE transport (2024-11-05). **[Verified]**
- Client must `Accept: application/json, text/event-stream`. Missing it is the first error you will hit.
- 2026-07-28 adds standard headers (`Mcp-Method`, `Mcp-Name`) so gateways can route and rate-limit **without parsing the body**, and removes `Mcp-Session-Id`.
- Servers **must validate the `Origin` header** and a local HTTP server must **bind to 127.0.0.1**, or a web page can reach it (DNS rebinding) **[Memory, standard guidance; re-read the transport page's security section]**.

### 3.3 Custom transports (this is Loaf's case)
The spec allows them, and says transports over a reliable byte stream, "for example **Unix domain sockets or TCP**, SHOULD **reuse the stdio framing**". **[Verified]** A Windows named pipe is the same idea. So Loaf's "named pipe + token" is spec-legal as long as it carries newline-delimited JSON-RPC.

### Lab 2: a stateless HTTP server, tested with curl **[Verified]**
`mcp-labs/http-server.mjs` (about 25 lines). Run `node http-server.mjs`, then:
```
curl -s -H Content-Type:application/json -H "Accept:application/json,text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"add","arguments":{"a":2,"b":40}}}' \
  http://127.0.0.1:8765/mcp
→ {"result":{"content":[{"type":"text","text":"42"}]},"jsonrpc":"2.0","id":2}
GET /mcp → 405     other path → 404
```
Notice: no session, a fresh server object per request. That is the shape the 2026-07-28 spec makes standard, and it scales horizontally for free.

---

## 4. Designing tools — where engineers are separated from beginners

The model reads your tool list like a manual and decides. Bad design wastes tokens, causes wrong calls and creates security holes.

1. **Name** with a verb and object: `create_task`, not `tasks` or `doTheThing`. Stable names; they are an API.
2. **Description is a prompt.** Say what it does, **when to use it**, when *not* to, and what it returns. One short paragraph. Mention units, formats, limits.
3. **Input schema is a contract.** Use JSON Schema (Zod in TypeScript, `schemars` in Rust): types, `enum`, `minLength/maxLength`, `minimum/maximum`, `required`, defaults. Reject everything else. Treat all input as hostile.
4. **Few, composable, outcome-shaped tools** beat a mirror of your REST API. Fifty tools drown the model and burn context (each schema costs tokens on every turn). Prefer `search_tasks(query, status)` over twelve getters.
5. **Output**: return what the model needs, small. Use `structuredContent` plus `outputSchema` when a program consumes it; keep a human-readable `content` copy. Cap size; paginate; never dump a database.
6. **Errors** the model can recover from (see §2).
7. **Annotations** are hints for the host UI, not security: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`. Hosts use them to decide what needs confirmation. Never rely on them for safety.
8. **Idempotency and safety**: make writes safe to retry (accept a client-supplied key or make the operation naturally idempotent). Separate **read** tools from **write** tools; make destructive ones obvious.
9. **Determinism**: list tools in a stable order (the spec now says SHOULD), so caches and prompt caches work.
10. **Latency budget**: a tool call blocks a conversation. Under a few seconds, or stream progress, or return a handle and a "check status" tool.
11. **Don't leak**: no secrets, no raw stack traces, no data the user didn't intend to expose. Tool *results* are fed to the model and may be shown anywhere.

**Resources** are for context the *app* attaches (a file, a record) addressed by URI; **resource templates** (`loaf://task/{id}`) generalise; **prompts** are user-invoked templates. If the model should decide to do it, it is a tool.

**Exercise:** take Loaf's three planned tools (`status`, `react`, `say`) and write the description, schema, error cases and a size limit for each before writing any code (§10 has the draft).

---

## 5. Build it: SDKs and your first server

Official SDKs **[Verified, docs tier table]**: **Tier 1**: TypeScript, Python, C#, Go, **Rust**, Ruby. Tier 2: Java. Tier 3: Swift, PHP, Kotlin. Same features, each language's idioms.
Versions today: npm `@modelcontextprotocol/sdk` **1.32.2** (a v2 line, `@modelcontextprotocol/server` 2.4.0, also exists), Rust crate `rmcp` **3.8.0**, Inspector 2.13.0. **[Verified via package registries]**

### Lab 1: a stdio server and a client (`mcp-labs/server.mjs`, `client.mjs`) **[Verified]**
```
cd mcp-labs && npm install && node client.mjs
server: { name: 'pet-demo', version: '0.1.0' } caps: [ 'resources', 'tools' ]
tools: [ 'say' ]
call: [{"type":"text","text":"The pet said: Hello!"}]
bad call: ... isError ... "expected string to have >=1 characters at text"
resource: "{\"pose\":\"idle\",\"tasksOpen\":3}"
```
What to notice in `server.mjs`: a tool is a name + description + schema + async handler; stdout is untouched; the SDK validates input before your handler runs, builds `tools/list` from your schema, and handles negotiation.

### The build loop
1. Write the tool contracts (§4) first.
2. Implement handlers as **plain functions** with no protocol types in them (pure, testable).
3. Wire them to the SDK in a thin adapter.
4. Test: unit tests on the functions; **in-memory client/server pair** for protocol tests; **Inspector** for exploration; a real host for the final check.
5. Add auth, logging, limits.

### Test and debug tools
- **MCP Inspector** (`npx @modelcontextprotocol/inspector node server.mjs`): web UI, CLI and TUI clients; lists tools, calls them, shows raw messages; has a "protocol eras" page for the 2025 vs 2026 difference. **[Verified exists; Memory for flags]**
- **Wire trace**: pipe the four lines from §2 into your server by hand. If you can't, you don't yet understand it.
- Always log to stderr; the host usually keeps those logs.

---

## 6. Rust, because Loaf is Rust

Loaf's core is Rust and **Rust is a Tier-1 official SDK** (`rmcp`). Why use it rather than writing JSON-RPC by hand: the spec moved from a handshake to stateless in one revision; an SDK tracks that for you, validates schemas, and handles cancellation, pagination and error codes. Hand-rolling is fine to *learn* (do it once in a lab) and wrong to *ship*.
Typical shape **[Memory: check rmcp's docs for current macro names]**: a struct holding your app handle; methods annotated as tools with `schemars`-derived input types; a server handler; a transport (stdio, or any `AsyncRead + AsyncWrite` pair such as a pipe).
**Decision to take before building Loaf's server:** does `rmcp` 3.x already speak both 2025-11-25 and 2026-07-28? Read its README and changelog, run the Inspector against a hello-world, and record the answer in `DECISIONS.md`. If it only speaks one era, we either wait, pin and test against the clients we target, or put a small adapter in front.

---

## 7. Hosting: where the server runs

| Kind | How it is launched | Good for | Watch out |
|---|---|---|---|
| **Local, stdio** | The host spawns your binary or `npx`/`uvx` command from its config | Anything touching the user's machine: files, apps, Loaf | Runs with full user rights; distribution and updates are on you |
| **Local, HTTP on loopback** | You run it; hosts connect to `http://127.0.0.1:port/mcp` | Long-lived local services | Must bind loopback, check `Origin`, require a token |
| **Remote, Streamable HTTP** | A service on the internet | Shared SaaS data, multi-user, no install | Real auth (OAuth), multi-tenancy, scaling, abuse |

### Running a remote server in production
- **Stateless by default** (2026-07-28 makes it the norm): any instance can answer any request; scale with a load balancer; no sticky sessions. If you need state, mint a **handle** in a tool result and store state in a database or cache keyed by it.
- **Where:** a container on Fly.io, Cloud Run, ECS or Kubernetes; or serverless (Cloudflare Workers, AWS Lambda) since stateless fits. **[Memory]**
- **Reverse proxy / gateway:** TLS termination, auth, rate limits, request size limits. The `Mcp-Method` and `Mcp-Name` headers let a gateway allow, deny or meter per tool **without parsing bodies**.
- **Streaming caveat:** SSE needs proxies that don't buffer and timeouts long enough; 2026-07-28 removed stream resume, so a dropped stream means the client re-sends.
- **Observability:** structured logs with a request id; metrics per tool (calls, errors, latency p50/p95/p99); tracing with W3C `traceparent` in `_meta` (the spec documents this convention). Alert on error rate and latency.
- **Config and secrets:** environment or a secret manager, never in the repo or in tool output.
- **Versioning:** semver for your server; tool names and schemas are a public API, so add, don't change; deprecate with notice. Pin the spec revisions you support and test both eras.
- **Distribution/discovery:** the official **MCP Registry** lists servers; for local servers publish a package (`npm`, `PyPI`, a signed binary) with a one-line config snippet.

### Local packaging for Loaf specifically
Hosts launch a **subprocess**, but Loaf is already running as a desktop app. The standard answer is a **bridge**: a tiny executable `loaf-mcp` that the host spawns; it speaks stdio to the host and relays to the running Loaf over the private pipe/socket. §10 designs it.

---

## 8. Security — read this twice

Treat an MCP server as **code that an AI, steered by untrusted text, can run with your user's power.** Official guidance lives in Documentation → Security (Authorization, Security Best Practices, Local Server Security). Core ideas:

1. **Prompt injection through tool output.** Anything a tool returns (a web page, an email, a note, a task title) can contain instructions aimed at the model. Mark untrusted text, never let tool output change permissions, keep powerful tools behind confirmation.
2. **Tool poisoning and "rug pulls".** A malicious server can ship innocent descriptions and later change them. Hosts show tools; users should pin and review. As an author: keep descriptions honest and stable.
3. **Confused deputy / token passthrough.** A server must **not** accept a token that was issued for something else and forward it downstream. Validate that tokens were issued *for your server* (audience).
4. **Local servers:** a config entry is a command that runs on your machine. Only install servers you trust; sandbox where you can; run with least privilege; do not run as admin.
5. **Network-reachable local servers:** loopback only, `Origin` check, token, no CORS wildcard (DNS rebinding).
6. **SSRF:** if a tool fetches URLs, block private ranges and metadata addresses.
7. **Least privilege and data minimisation:** read-only by default; narrow scopes; return the fields needed.
8. **Human in the loop:** destructive or outward-facing actions need explicit user confirmation in the host; log every call.
9. **Rate and size limits** on every tool; timeouts; bounded memory.
10. **Secrets** never in tool results or logs.

### Authorization for remote servers (OAuth) **[Verified headings; details Memory, read the Authorization pages]**
HTTP servers use **OAuth 2.1**: your server is an OAuth **resource server**; it advertises its authorization server through **protected-resource metadata**; clients do the code flow with **PKCE** and ask for tokens bound to your server using **resource indicators**; clients register dynamically (2026-07-28 tightens this: persisted credentials are bound to the issuer that issued them; the `iss` parameter must be checked; `application_type` must be set). **stdio** servers do **not** use this: they read credentials from their environment. Plan for: scopes per tool group, token expiry and refresh, revocation, and a way to see which client did what.

---

## 9. Quality: how you know it works

- **Unit tests** on each tool function: valid, boundary, hostile inputs (empty, huge, unicode, injection-looking text).
- **Protocol tests** with an in-memory client↔server: list, call, error paths, cancellation, large result, concurrent calls.
- **Contract test of the schema:** snapshot `tools/list`; a change fails the build unless intended.
- **Compatibility matrix:** run the same tests against both spec eras and the hosts you care about.
- **Eval the descriptions:** give a model your tool list and 20 realistic requests; measure whether it picks the right tool with the right arguments. Rewrite descriptions until it does. This is the highest-leverage activity in MCP work.
- **Failure drills:** kill the server mid-call; slow responses; garbage on stdout; reconnect.
- **Soak and load:** for remote servers.

---

## 10. Loaf's MCP server: the design, for your sign-off

**Approved shape (2026-10-22):** stdio + named pipe + per-run token; tools `status`, `react`, `say`. **Local only, no network port.** Below is how I would build it. Nothing is built yet.

### Architecture
```
 Claude Code / Cursor / any host
        │  spawns, speaks stdio (newline JSON-RPC)
        ▼
  loaf-mcp  (tiny bridge binary, ships with Loaf)
        │  named pipe (Windows) / unix socket 0600 (macOS, Linux), token handshake
        ▼
  Loaf app (Tauri shell)  ── hosts the pipe listener, speaks MCP via the SDK
        │  calls
        ▼
  loaf-core::mcp   (pure: tool definitions, input validation, rate limits, privacy rules)
        │
        ▼  existing services: pet bubble/pose, status snapshot
```
- **`loaf-core` stays free of Tauri** (our `pnpm check:core-deps` guard enforces it): the tool definitions, schemas, validation and limits live there and are tested without a window.
- **Shell** owns the pipe and wires `react`/`say` to the pet window through events we already have.
- **Bridge** does no logic: it connects to the pipe, sends the token, then copies bytes both ways. It exits when either side closes. Keep it under ~100 lines so there is nothing to attack.

### Token and pipe security
- Per-run random token (32 bytes) written to a file in Loaf's data folder readable only by the current user (Windows ACL / mode 0600); the bridge reads it at start. Reject a wrong token with no detail. A new token every Loaf start.
- Windows pipe name includes the user; the pipe's ACL allows only the current user. Unix socket lives in a user-only directory.
- Off by default: the MCP page has one switch; off closes the pipe and deletes the token.
- Max one active session; reject oversize messages; per-tool rate limit (for example `say` 10 per minute) so a runaway agent cannot spam the desktop.

### The three tools (draft contracts)
| Tool | Description (what the model sees) | Input | Output | Limits |
|---|---|---|---|---|
| `status` | "Read what the Loaf pet is doing right now (pose, focus timer running, how many tasks are open today). Read-only. Use before `say` to avoid interrupting a focus session." | none | `{pose, focus: {running, minutesLeft}, tasksOpenToday}` | read-only, cached 1 s |
| `react` | "Make the pet play one reaction." | `name` enum of allowed reactions (`cheer`, `think`, `work`, `worried`, `sleep`, …), no free text | `{played: true}` or `isError` if the pet is hidden or in focus mode | 10 per minute |
| `say` | "Show a short message in the pet's speech bubble. Max 140 characters. Never include secrets." | `text` 1–140 chars, plain text; optional `pose` enum | `{shown: true}` | 10 per minute; plain text only (no markup); obeys the user's quiet hours |

Not exposed by default: tasks, notes, diary, time data. A later opt-in "read-only lookups" step adds `search_tasks` with its own switch and per-field minimisation. **The diary is never exposed.**
Resources/prompts: none in v1 (tools only keeps the surface tiny).

### Test plan (high-end)
1. Unit tests in `loaf-core` for every schema and limit (boundary, unicode, 10k-char input, control characters).
2. In-memory protocol tests: list, call, bad args, rate-limit error, cancellation, concurrent calls.
3. Pipe tests: wrong token refused, no token refused, second client refused, pipe closed on switch-off, oversize message dropped.
4. Bridge tests: pass-through of a full session; clean exit when Loaf quits.
5. Compatibility: Inspector and one real host, both protocol eras if the SDK supports both.
6. Eval: 20 phrasings ("congratulate me", "tell me when the build is done") → right tool, right arguments.
7. Windows tested by you; macOS in CI (unix socket path); Unverified until then.

### Decisions I need from you before building
1. Reactions allowed to agents: all, or a safe subset?
2. Should an agent be able to say things during a focus session? (My default: **no**; `status` shows it, `say` is refused.)
3. Rate limits (my default 10 per minute per tool).
4. Do you want the later read-only lookups at all, and which data (never the diary)?
5. Should the bridge be a separate binary in the installer, or a flag of the main app (`loaf --mcp-bridge`)? (My pick: **flag of the main app**: one file to sign and update.)

---

## 11. Your 4-week path to proficiency

**Week 1: the protocol.** Read §0–3. Do Lab 1. Hand-type the §2 wire trace into the server. Read the official *Architecture* and *Tools* spec pages. Write, by hand, a 60-line stdio server in any language that answers `initialize`, `tools/list` and one `tools/call` with no SDK. *Check:* you can explain request vs notification, protocol error vs tool error, and why stdout is sacred.
**Week 2: craft.** Read §4 and §9. Build a 3-tool server for something you own (your notes folder, read-only). Write descriptions, then run the eval from §9 with 20 requests and iterate until 19 of 20 pick the right tool. Add unit and in-memory protocol tests. *Check:* tests fail when you break a schema.
**Week 3: remote and security.** Read §7–8 and the official Authorization pages. Do Lab 2; add a bearer token check and rate limit; put it in a container; run two instances behind a proxy and show a call works on either. Try a prompt-injection string in a tool result and write down what a host does. *Check:* you can draw the OAuth flow for a remote MCP server from memory.
**Week 4: Rust and Loaf.** Read §6 and §10. Build hello-world with `rmcp` over stdio, then over a Unix socket. Review the Loaf design above, answer the five questions, and we build milestone P4.1 together. *Check:* you can review a pull request for the MCP server and find a missing limit.

### You are proficient when you can, without notes
- Draw host / client / server and the message flow of one tool call.
- Write a correct tool description and schema and explain every token it costs.
- Say what changed between 2025-11-25 and 2026-07-28 and what it does to hosting.
- Explain three attacks (injection, DNS rebinding, token passthrough) and the defence for each.
- Deploy a stateless server behind a gateway and read its metrics.
- Decide, for a new feature, tool vs resource vs prompt, and local vs remote.

### Self-test (answers at the bottom)
1. Why must a stdio server never `print` to stdout? 2. Tool error vs protocol error: which one lets the model recover? 3. Why is "stateless" good for hosting? 4. Who chooses to use a resource, a tool, a prompt? 5. Why can't a server forward the token it received to another API? 6. What does a Windows named pipe have in common with stdio in the spec's eyes? 7. Why do tool descriptions matter more than code comments? 8. What is MRTR, in one sentence?

**Answers:** 1. stdout is the protocol channel; extra bytes corrupt framing. 2. Tool error (`isError: true`) with an actionable message. 3. Any instance can serve any request, so you scale by adding instances; no sticky sessions or shared memory. 4. Tool: model. Resource: app or user. Prompt: user. 5. That is the confused-deputy / token-passthrough hole: the token wasn't issued for the second API, and the server would act with someone else's authority. 6. Both carry newline-delimited JSON-RPC over a byte stream; the spec says to reuse stdio framing. 7. The model reads them to decide what to call; they are executable instructions. 8. Instead of the server sending its own request mid-call, it replies "input required" with what it needs and the client retries with the answers.

---

## 12. References
- Spec and docs: `modelcontextprotocol.io` (Specification, Docs, SDKs, Registry, SEPs, Inspector).
- Changelog for 2026-07-28: `modelcontextprotocol.io/specification/2026-07-28/changelog`.
- Official SDKs: `github.com/modelcontextprotocol/{typescript,python,rust,go,csharp,ruby,java}-sdk`.
- Local files: this folder's `mcp-labs/`; Loaf plan: `MASTER_PLAN.md` P4; decision history: `DECISIONS.md` (2026-10-22 "MCP shape").
