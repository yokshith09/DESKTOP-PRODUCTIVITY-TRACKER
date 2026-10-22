# V2 feature specifications (FR-41 … FR-58)

> Written 2026-10-22 from the owner's V2 issue list ([`../V2_ISSUES.md`](../V2_ISSUES.md)). Same 13 sections as [`FR-requested-features.md`](FR-requested-features.md): 1 metadata · 2 user story · 3 behaviour · 4 plain language · 5 technical design · 6 choices · 7 ordered tasks · 8 tests · 9 edge cases · 10 acceptance · 11 checklist · 12 docs to update · 13 dependencies/exclusions. **Nothing here is built.** Every status is Planned unless stated. Every checklist is unticked. Any feature that needs a real OS stays Unverified until run on Windows. Test IDs are proposals; coverage is "missing" until a test runs.

Common to every spec: **12 Docs** = spec + checklist, FEATURE_ROADMAP, ROADMAP, PROJECT_STATUS, CHANGELOG, DECISIONS, test results, Current Focus.

---

## FR-41 — Notifications as toasts, and return to the dashboard after add/edit

**1 Metadata** — Group: Shell · Status: Planned · Milestone: FM-V2 · Effort: M · Decision: Q1 open · Origin: owner V2-02 · Evidence: toast library already used in `SettingsPage.tsx` (`toast.error`).
**2 Story** — As a user I want a clear pop-up when something happens, and after I add or edit a task I want to land back on the dashboard.
**3 Behaviour** — One toast stack, bottom-right. Types: success, info, warning, error, with an optional action ("Undo", "Open"). Auto-dismiss 5 s (errors 8 s), pausable on hover, max 3 visible, keyboard dismiss with Esc. Saving a new task from Today or Quick add returns to Today; editing from Today returns to Today; editing from Tasks stays in Tasks. Navigate-back target = the screen the user came from.
**4 Plain language** — Little messages appear, say what happened, and go away. After you add a task you are back where you started.
**5 Technical** — Single `notify()` helper over the existing toast library; a `returnTo` route stored in router state when a detail/edit view opens; reduced-motion respected. Pet bubbles are not used (FR-43).
**6 Choices** — Toast stack (simple, no state) vs bell + history list (more code, needs a table). Suggested: toasts now, history later. Back via router state vs always-dashboard: router state, since "always dashboard" is wrong when editing from Tasks.
**7 Tasks** — 1 `notify()` helper and types · 2 replace ad-hoc toasts · 3 `returnTo` in task add/edit/meeting convert flows · 4 a11y (aria-live) · 5 mock-shell support.
**8 Tests** — T-41-01 component: toast auto-dismiss and pause · T-41-02 component: add task from Today returns to Today · T-41-03 component: edit from Tasks stays in Tasks · T-41-04 a11y: aria-live polite/assertive · T-41-05 Manual-Win: stack position with the window resized.
**9 Edge cases** — Burst of toasts (queue); window minimised while a toast is open; route no longer exists; screen reader announce twice.
**10 Acceptance** — The three flows pass; no toast is stuck; tests executed and results recorded.
**11 Checklist** — [ ] helper · [ ] flows · [ ] a11y · [ ] tests pass · [ ] docs
**13 Deps** — none. Excludes: notification history (later), OS notifications (existing reminders).

---

## FR-42 — Links that lead somewhere (task↔note, links in Notes)

**1 Metadata** — Group: Notes/Tasks · Status: Planned · Milestone: FM-V2 · Effort: M · Decision: Q5 open · Origin: V2-01, V2-08 · Evidence: `TaskDetail.tsx:126` stores `noteId` only; `src/features/links` shows on Today only.
**2 Story** — As a user I want a linked note to open, and a note to show the tasks linked to it, and the links list inside Notes.
**3 Behaviour** — On a task with a linked note: "Open note" button and note title shown as a link. On a note: "Linked tasks" section listing tasks (click opens the task). "Create note from task" creates a note titled with the task and links it. Notes tab gets a Links section (same data as Today). Unlinking is one click.
**4 Plain language** — A link now does something: click it and you go there, from either side.
**5 Technical** — Reuse the existing `note_id` on tasks; add a read query `tasks_for_note(note_id)` in core (no schema change); links feature component moved to a shared component used by Today and Notes. Possible type change → `pnpm gen:types`.
**6 Choices** — Backlinks by query (no migration) vs a join table (needed only for many-to-many; not asked). Chosen: query.
**7 Tasks** — 1 core query + test · 2 Open note button · 3 Linked tasks panel · 4 Create note from task · 5 Links section in Notes · 6 mock-shell.
**8 Tests** — T-42-01 Rust: tasks_for_note · T-42-02 component: Open note navigates · T-42-03 component: Linked tasks shown · T-42-04 component: Links in Notes · T-42-05 component: unlink.
**9 Edge cases** — Linked note deleted (show "Note in Bin", offer restore); several tasks to one note; note without title.
**10 Acceptance** — Every link is clickable both ways; deleted note handled; tests executed.
**11 Checklist** — [ ] query · [ ] UI both sides · [ ] Notes links · [ ] tests · [ ] docs
**13 Deps** — M1 notes/tasks. Excludes: wiki-style [[links]] in note text (possible later).

---

## FR-43 — No pop-ups above the pet

**1 Metadata** — Group: Companion · Status: Planned · Milestone: FM-V2 · Effort: S · Decision: Q2 open · Origin: V2-03.
**2 Story** — I do not want text bubbles above the pet.
**3 Behaviour** — Pet reactions are animation only. Text messages go to toasts (FR-41) in the main window. A setting "Pet speech bubbles" exists, off, if the owner wants them back for emotes.
**4 Plain language** — The pet moves and reacts but does not put words over its head.
**5 Technical** — Remove the bubble element from the pet window; route reaction messages to `notify()`.
**6 Choices** — Delete the code vs hide behind a setting: hide behind a setting, off, so Q2 does not force a rewrite.
**7 Tasks** — 1 find the bubble component · 2 gate behind setting default false · 3 route text to toast.
**8 Tests** — T-43-01 component: no bubble by default · T-43-02 component: setting on shows it · T-43-03 Manual-Win: pet window.
**9 Edge cases** — Reaction with no animation (use a small motion); upgrade from a version with bubbles.
**10 Acceptance** — No bubble by default on a fresh and an upgraded install.
**11 Checklist** — [ ] gate · [ ] reroute · [ ] tests · [ ] docs
**13 Deps** — FR-41. Excludes: emote art.

---

## FR-44 — Time tiles: fill the space, resize

**1 Metadata** — Group: Time · Status: Planned (extends FR-22, FR-25) · Milestone: FM-V2 · Effort: L · Origin: V2-04.
**2 Story** — Tiles should not leave empty space and I want to resize them.
**3 Behaviour** — Grid layout with snap sizes (S/M/L/wide). Drag handle on the tile corner. Tiles reflow to fill rows; content scales (charts grow, lists show more rows, small tiles show a summary). Layout saved per user.
**4 Plain language** — Make tiles bigger or smaller, and they fill the page without gaps.
**5 Technical** — Evaluate `react-grid-layout` (MIT) against a small CSS-grid + pointer-resize implementation; saved as JSON in settings; each tile declares min/max size and a compact/expanded render.
**6 Choices** — Library (fast, adds a dependency) vs own code (more work, none added). The principle "learn fundamentals first" and the dependency rule favour own CSS grid; decide after a spike.
**7 Tasks** — 1 spike and decision · 2 tile size model · 3 resize interaction · 4 per-size content · 5 persist/restore · 6 keyboard resize.
**8 Tests** — T-44-01 unit: layout packing leaves no gap · T-44-02 component: resize persists · T-44-03 component: keyboard resize · T-44-04 Manual-Win: window resize does not reshuffle (FR-23).
**9 Edge cases** — Tiny window; saved layout from older version; empty data.
**10 Acceptance** — No empty cell at any supported size; resize works by mouse and keyboard.
**11 Checklist** — [ ] spike · [ ] model · [ ] resize · [ ] content · [ ] tests · [ ] docs
**13 Deps** — FR-22/23/25. Excludes: other pages' tiles.

---

## FR-45 — Date and time picker redesign

**1 Metadata** — Group: Shell · Status: Planned · Milestone: FM-V2 · Effort: M · Origin: V2-05.
**2 Story** — Picking a date or time should be quick and not look like a generic browser control.
**3 Behaviour** — Popover with presets (Today, Tomorrow, This weekend, Next week, +3 days, None), a month grid with keyboard arrows, a typed field accepting "tom", "fri", "3pm", and for reminders a time list in 15-minute steps. Same component for planned date, deadline, reminders, exam dates.
**4 Plain language** — Click "Tomorrow" instead of hunting through a calendar.
**5 Technical** — Own component built on the existing UI primitives; date maths in the core clock (the app already has a clock module); no heavy date library unless a spike shows need.
**6 Choices** — `react-day-picker` (MIT, small) for the grid vs own. Decide after a spike.
**7 Tasks** — 1 component · 2 natural-language parse (small, tested) · 3 swap into Task detail, reminders, meetings · 4 a11y.
**8 Tests** — T-45-01 unit: parse "tom", "fri", "3pm" · T-45-02 component: presets set value · T-45-03 component: keyboard · T-45-04 unit: week start and DST day.
**9 Edge cases** — Locale first day of week; DST; past dates; clearing a date.
**10 Acceptance** — All date fields use it; ISO values stored unchanged.
**11 Checklist** — [ ] component · [ ] parse · [ ] swapped · [ ] tests · [ ] docs
**13 Deps** — none. Excludes: calendar sync.

---

## FR-46 — Data retention and auto-delete

**1 Metadata** — Group: Privacy · Status: Planned · Milestone: FM-V2 · Effort: M · Decision: Q3 open · Origin: V2-06.
**2 Story** — I choose how long my data is kept; older data is removed automatically.
**3 Behaviour** — Settings → Privacy → "Keep data for": per type (Activity/time history, Meetings, Completed tasks, Bin). Options Never delete, 30 days, 90 days, 6 months, 1 year. Shows "N items would be removed" before enabling. Runs daily at startup; items go to the Bin first (except Bin and activity, which are removed). Notes are excluded unless the owner asks.
**4 Plain language** — Tell Loaf how long to keep things; it cleans up for you.
**5 Technical** — Core job in the db writer using the clock module; settings keys `retention.<type>`; a dry-run count query; a summary event to show in a toast. Backup rule: nothing is deleted before the preview has been shown once.
**6 Choices** — Delete vs Bin-first: Bin-first for user content. Run at startup vs timer: startup plus midnight rollover (already exists).
**7 Tasks** — 1 settings keys and validation · 2 dry-run queries · 3 purge job · 4 UI · 5 tests with fake clock.
**8 Tests** — T-46-01 Rust: dry run counts match purge · T-46-02 Rust: boundary day · T-46-03 Rust: Never deletes nothing · T-46-04 component: preview shown · T-46-05 Rust: crash mid-purge leaves consistent data.
**9 Edge cases** — Clock set backwards; huge first purge (batch it); data from an import; a user who sets 30 days by accident (undo via Bin).
**10 Acceptance** — Preview matches purge; nothing outside the chosen types is touched.
**11 Checklist** — [ ] settings · [ ] queries · [ ] job · [ ] UI · [ ] tests · [ ] docs
**13 Deps** — M0 clock, Bin. Excludes: cloud data (FR-56).

---

## FR-47 — Remove Logs from Settings

**1 Metadata** — Group: Settings · Status: Planned · Milestone: FM-V2 · Effort: XS · Origin: V2-07 · Evidence: `SettingsPage.tsx:166-167`.
**2 Story** — Normal users do not need log files.
**3 Behaviour** — Remove the "Log files" and "Log detail" rows. Logging stays on at a fixed level. Support can still reach logs through the data folder.
**4 Plain language** — A confusing setting goes away.
**5 Technical** — Delete the UI rows; keep the Rust log commands; update mock shell and tests that reference them.
**6 Choices** — Hide vs delete the IPC: keep IPC (tests and support use it), remove UI only.
**7 Tasks** — 1 remove rows · 2 fix tests · 3 docs.
**8 Tests** — T-47-01 component: no Log rows · T-47-02 existing settings tests updated.
**9 Edge cases** — Saved `log.level` setting still honoured.
**10 Acceptance** — Rows gone; app still logs; tests pass.
**11 Checklist** — [ ] rows · [ ] tests · [ ] docs
**13 Deps** — none. Excludes: a hidden "developer mode" (not asked).

---

## FR-48 — Editable pet shortcuts, default off

**1 Metadata** — Group: Companion · Status: Planned (extends FR-37) · Milestone: FM-V2 · Effort: S · Origin: V2-11 · Open: D-SHORTCUT-DEFAULT upgrade detail.
**2 Story** — I can set my own pet-window shortcuts and they are off until I turn them on.
**3 Behaviour** — Settings → Pet: "Pet shortcuts" master switch (off). When on, each action (show/hide, play emote, quiet mode) has an editable key. Same validation as the global shortcuts (Ctrl/⌘/Alt plus a key).
**4 Plain language** — Shortcuts for the pet, only if you want them.
**5 Technical** — Reuse the existing shortcut validation in core and the UI recorder; settings keys `pet.shortcuts.enabled` and per-action keys.
**6 Choices** — Window-focused keys vs global: global needs an OS grab and can clash; start with the pet window focused plus the existing global one. 
**7 Tasks** — 1 keys and validation · 2 UI recorder · 3 register/unregister on toggle · 4 conflict check.
**8 Tests** — T-48-01 Rust: validation · T-48-02 component: off by default · T-48-03 component: conflict warning · T-48-04 Manual-Win: global register and unregister.
**9 Edge cases** — Key taken by another app; layout differences; upgrade from fixed shortcut.
**10 Acceptance** — Default off on fresh and upgraded installs; changes apply without restart.
**11 Checklist** — [ ] keys · [ ] UI · [ ] tests · [ ] docs
**13 Deps** — FR-37. Excludes: system-wide custom macros.

---

## FR-49 — Character accessories (and the "tabs" question)

**1 Metadata** — Group: Companion · Status: Planned · Milestone: FM-CS (Character Studio) · Effort: L · Origin: V2-09, V2-10 (Blocked on Q4).
**2 Story** — I can put accessories on my character.
**3 Behaviour** — Slots: head (hat, headphones, crown), face (glasses), neck (scarf, bow), held item. Each accessory is drawn per character and per pose, anchored to a named point. Choose in Character page / Studio; saved in `pet.appearance`.
**4 Plain language** — Dress your pet.
**5 Technical** — Accessory = SVG layer (now) or a sprite layer (after FR-50) with anchors per pose; z-order list; `PetAppearance` gains `accessories: string[]`.
**6 Choices** — Layers per character (accurate, more art) vs one shared set with anchors (less art, can look off). Start with anchored shared set, check it on all five characters.
**7 Tasks** — 1 anchor points per character · 2 six first accessories · 3 picker UI · 4 persistence · 5 turned views.
**8 Tests** — T-49-01 unit: anchors exist for each pose · T-49-02 component: picker updates · T-49-03 snapshot: render per character · T-49-04 Manual-Win.
**9 Edge cases** — Accessory hidden in the back view; two items in the same slot; personal-photo characters (excluded for now).
**10 Acceptance** — Same accessory looks right on all five characters in all poses.
**11 Checklist** — [ ] anchors · [ ] art · [ ] UI · [ ] tests · [ ] docs
**13 Deps** — FR-50 for sprite form. Excludes: purchasable items (FR-04).

---

## FR-50 — Sprite-pack format and the Character Studio

**1 Metadata** — Group: Companion · Status: Planned (supersedes the Rive path) · Milestone: FM-CS · Effort: XL · Decisions: D-SIZE open · Origin: V2-15.
**2 Story** — I can browse, add, preview and make characters as sprite packs.
**3 Behaviour** — Studio tabs: Library (installed packs), Gallery (FR-56, later), Create (describe or upload, uses the allowed upload path), Preview (all states, the Emotes), Settings (state→animation mapping, speed, size). A pack = `pet.json` + one spritesheet (8 columns × 9 rows, cells 192×208 [Likely, from the OpenPets/Codex format]). Our five built-ins ship as packs.
**4 Plain language** — Characters are image packs you can add, swap and share.
**5 Technical** — Renderer plays rows by frame rate on a canvas or CSS sprite; `pet.json` schema validated in core; packs stored in the data dir; export script `scripts/export-sprite-packs` renders our SVG poses to the atlas. Rows we have no art for are marked missing in `pet.json` and fall back to idle plus a transform. See [`../character/CHARACTER_STUDIO_SPEC.md`](../character/CHARACTER_STUDIO_SPEC.md).
**6 Choices** — Match the OpenPets format (import their packs, MIT) vs our own format. Matching costs us nothing and gives 1,000+ packs; the risk is that their schema is not confirmed from the docs (fetch failed). Verify with a real pack before locking.
**7 Tasks** — 1 schema and validator · 2 renderer · 3 export script and five packs · 4 Library UI · 5 Preview · 6 import/export · 7 state mapping.
**8 Tests** — T-50-01 unit: manifest validation · T-50-02 unit: atlas size and frame counts · T-50-03 component: renderer plays rows · T-50-04 Rust: import rejects bad packs and oversize files · T-50-05 Manual-Win.
**9 Edge cases** — Wrong size sheet; missing rows; huge image; hostile manifest paths (`..`); transparent edges; reduced motion.
**10 Acceptance** — Five built-in packs load through the same path as an imported pack.
**11 Checklist** — [ ] schema · [ ] renderer · [ ] packs · [ ] Studio UI · [ ] import · [ ] tests · [ ] docs
**13 Deps** — FR-02, CH-01..08. Excludes: personal-photo characters (on hold), Rive.

---

## FR-51 — Guide, tour and credit

**1 Metadata** — Group: Onboarding · Status: Planned · Milestone: FM-V2 · Effort: M · Origin: V2-12.
**2 Story** — I learn what each tab does, can skip, and can reopen the guide later.
**3 Behaviour** — First run offers a tour (skip anywhere, "Explore on my own"). The tour highlights each sidebar tab with one sentence and one try-it action. Guide page lists every tab and feature (Notes, Tasks, Today, Time, Meetings, Character, Settings, Bin), shortcuts, privacy promises, and the footer **"Built by QUORBIT TECHNOLOGIES"**. A "Take the tour again" button. Optional short quiz ("trivia"): 1 question per tab, no score pressure, skippable.
**4 Plain language** — A friendly walkthrough you can skip.
**5 Technical** — Steps as data (tab id, text, anchor selector); focus-trapped popover; completion stored in settings; Guide content is static and lives in the app.
**6 Choices** — Library (Driver.js MIT / react-joyride) vs own popover: own, to avoid a dependency for ~10 steps.
**7 Tasks** — 1 step data · 2 popover · 3 Guide page · 4 credit footer · 5 quiz · 6 first-run hook.
**8 Tests** — T-51-01 component: skip at any step · T-51-02 component: completes and is not shown again · T-51-03 component: credit text rendered · T-51-04 a11y: focus trap.
**9 Edge cases** — Tab hidden by setting (Project Spaces off); window too small; tour anchor missing.
**10 Acceptance** — Skippable, reopenable, credit visible.
**11 Checklist** — [ ] steps · [ ] popover · [ ] Guide · [ ] credit · [ ] tests · [ ] docs
**13 Deps** — M2 first run. Excludes: AI quiz from notes (FR-58 / M5).

---

## FR-52 — Meetings: action items on Today, and more

**1 Metadata** — Group: Meetings · Status: Planned · Milestone: FM-V2 · Effort: M · Open: D-MEETINGS definition · Origin: V2-13.
**2 Story** — Action items from a meeting show on Today's tasks, saying which meeting they came from.
**3 Behaviour** — Converting an action item sets the task's source = meeting; the row shows "From: <meeting title>" and clicking opens the meeting. If the item has a due date it shows in Today when due (the earlier rule that converted tasks keep an empty planned date stays unless the owner changes it; **Q6**). **Suggested additions (owner picks):** attendee list, agenda template, "carry over open items" from the last meeting with the same title, decisions log search, recurring meetings, meeting countdown on Today, and notes-to-tasks in one click.
**4 Plain language** — You can see where a task came from.
**5 Technical** — Task already stores the meeting item id; add a read join `task → meeting` and a source chip component; no schema change if the id is stored, else an additive migration.
**6 Choices** — Show on Today by default vs only when due: needs Q6.
**7 Tasks** — 1 query · 2 chip · 3 Today rule · 4 suggestions picked by owner.
**8 Tests** — T-52-01 Rust: join returns meeting · T-52-02 component: chip links · T-52-03 component: deleted meeting.
**9 Edge cases** — Meeting deleted; item edited after conversion; two items converted twice.
**10 Acceptance** — Every converted task shows its meeting.
**11 Checklist** — [ ] query · [ ] chip · [ ] Today · [ ] tests · [ ] docs
**13 Deps** — M2 Meetings. Excludes: AI summaries (M7).

---

## FR-53 — Project Spaces: opt-in, in the left menu

**1 Metadata** — Group: Projects · Status: Planned (shell of FR-06) · Milestone: FM-V2 then FM-PS · Effort: S for the switch, XL for the feature · Origin: V2-14.
**2 Story** — I can turn Project Spaces on; then it appears in the left menu.
**3 Behaviour** — Setting "Project Spaces" off by default. On → sidebar item and its shortcut appear; off → they go away, data stays. Contents per FR-06 (notes, tasks, files, links, context, setup), shared by students and developers.
**4 Plain language** — A project area you turn on only if you need it.
**5 Technical** — `features.project_spaces` setting; sidebar items built from a registry filtered by flags (also used by FR-55 plugins).
**6 Choices** — Feature-flag registry (reusable) vs one-off conditional. Registry.
**7 Tasks** — 1 sidebar registry · 2 setting · 3 empty page placeholder · 4 FR-06 build later.
**8 Tests** — T-53-01 component: hidden by default · T-53-02 component: appears when enabled · T-53-03 component: data kept when disabled.
**9 Edge cases** — Disabled while on that page (redirect to Today); shortcut clash.
**10 Acceptance** — Off by default, appears and disappears live.
**11 Checklist** — [ ] registry · [ ] setting · [ ] tests · [ ] docs
**13 Deps** — FR-06 for contents.

---

## FR-54 — Local MCP server and agent integration

**1 Metadata** — Group: Integrations · Status: Planned · Milestone: FM-INT · Effort: XL · Decisions: D-MCP-SHAPE open · Origin: owner 2026-10-22.
**2 Story** — My local AI tools (Claude Code, editors) can talk to Loaf on my PC, and nothing else can.
**3 Behaviour** — Loaf can run a local MCP server (off by default) that offers tools: `loaf_status`, `loaf_react` (thinking, editing, testing, success, error), `loaf_say` (toast, not a bubble), `loaf_add_task`, `loaf_search_notes` (read tools off unless allowed). Each tool needs a user-approved permission per client.
**4 Plain language** — Your coding assistant can make the pet react, and ask your permission to add a task.
**5 Technical** — Two options: stdio (the client launches `loaf-mcp`, which talks to the app over a local socket) or local HTTP on 127.0.0.1 with a random token. Recommended: stdio client + named pipe/Unix socket: no open port. Loopback-only, token or OS-user check, no remote binding. Rust crate with an MCP SDK (check licence) or a thin implementation.
**6 Choices** — HTTP loopback (easy for clients, port exposed to other local processes, browsers could reach it) vs stdio + socket (safer, slightly more setup). OpenPets uses MCP the same way ([Likely]).
**7 Tasks** — 1 decision (D-MCP-SHAPE) · 2 socket server · 3 tool set · 4 permission prompts · 5 `loaf-mcp` bin · 6 docs for client config.
**8 Tests** — T-54-01 Rust: refuses non-local · T-54-02 Rust: unpermitted tool denied · T-54-03 Rust: add_task through the writer · T-54-04 Manual-Win: Claude Code connects.
**9 Edge cases** — Two clients; app closed; DNS rebinding if HTTP; prompt injection from tool text (tool output is data).
**10 Acceptance** — Cannot be reached from the network; every write needs approval.
**11 Checklist** — [ ] decision · [ ] server · [ ] tools · [ ] permissions · [ ] tests · [ ] docs
**13 Deps** — M10 connectors design. Excludes: agent that controls the PC (FR-30, D-COMPUTER).

---

## FR-55 — Plugins from the website

**1 Metadata** — Group: Platform · Status: Planned · Milestone: FM-PLUG · Effort: XL · Decisions: D-PLUGIN-MODEL, signing on hold · Origin: owner 2026-10-22.
**2 Story** — I can download a plugin from the Loaf website and install it.
**3 Behaviour** — Plugin = `.loafplugin` archive: `plugin.json` (id, version, name, permissions, pages), code and assets. Install by double-click or drag into Plugins settings. A permission sheet lists what it asks for; the user approves. Plugins can add a sidebar page, a pet reaction, a scheduled job, storage. They cannot run scripts in the pet window or reach the network except declared hosts.
**4 Plain language** — Add-ons you download and approve.
**5 Technical** — Model like OpenPets (sandboxed window per plugin, declared permissions, host-limited network, no raw HTML in the pet window) [Likely]. Our approach: sandboxed iframe or separate webview with a message-passing API; manifest validated in Rust; archive size limit, path traversal guard, hash shown at install. **Code signing is on hold**: until it exists, installs show an "unverified publisher" warning and the website lists a SHA-256.
**6 Choices** — WebView sandbox (fast to build, JS-only) vs WASM (stronger isolation, much more work). Start with WebView sandbox and a tiny permission set.
**7 Tasks** — 1 manifest and permission list · 2 archive install with guards · 3 sandbox host · 4 API surface (storage, ui page, notify, react) · 5 sample plugin · 6 uninstall · 7 website listing contract.
**8 Tests** — T-55-01 Rust: reject traversal paths · T-55-02 Rust: reject undeclared permission · T-55-03 component: permission sheet · T-55-04 component: sandbox cannot reach host DOM · T-55-05 Rust: uninstall removes data.
**9 Edge cases** — Malicious plugin; update with new permissions (re-prompt); plugin crash; two plugins with one id.
**10 Acceptance** — A sample plugin installs, shows a page, and cannot read other data.
**11 Checklist** — [ ] manifest · [ ] installer · [ ] sandbox · [ ] API · [ ] sample · [ ] tests · [ ] docs
**13 Deps** — FR-53 registry, FR-56 website. Excludes: paid plugins, code signing.

---

## FR-56 — Backend and gallery

**1 Metadata** — Group: Platform · Status: Planned · Milestone: FM-BE · Effort: XL · Decision: D-BACKEND closed yes; scope open · Origin: owner 2026-10-22.
**2 Story** — I can browse a gallery of characters and plugins and download them.
**3 Behaviour** — Website + API serving a gallery (characters, plugins), submissions with review, downloads with hashes. The app works fully without an account. Accounts, sync and referrals (FR-04) are separate decisions.
**4 Plain language** — A shop window for packs, run by us.
**5 Technical** — Static catalog JSON + object storage first (cheapest, no user data); later an API. Supabase is available in this environment but not chosen. Privacy: the app sends only a download request, no user data; a settings switch for "Check the gallery".
**6 Choices** — Static catalog (cheap, safe) vs full backend (accounts, ratings): static first.
**7 Tasks** — 1 catalog schema · 2 hosting decision · 3 in-app Gallery tab · 4 hash verify · 5 submission flow · 6 moderation.
**8 Tests** — T-56-01 Rust: hash mismatch rejected · T-56-02 component: gallery offline state · T-56-03 Rust: no identifying headers sent.
**9 Edge cases** — Offline; catalog tampered; huge download; takedown of a pack already installed.
**10 Acceptance** — A pack downloads, verifies, and installs; no user data leaves the PC.
**11 Checklist** — [ ] catalog · [ ] tab · [ ] verify · [ ] tests · [ ] docs
**13 Deps** — FR-50, FR-55. Excludes: accounts, sync, payments.
**Tension to settle:** the project principle is local-first. The backend must not collect user data by default; this needs a written privacy statement before launch.

---

## FR-57 — Linux build

**1 Metadata** — Group: Release · Status: Planned · Milestone: FM-LIN · Effort: M · Origin: owner 2026-10-22.
**2 Story** — I can install Loaf on Linux.
**3 Behaviour** — AppImage and .deb from CI. Tray, autostart and global shortcuts depend on the desktop (Wayland limits global shortcuts and always-on-top).
**4 Plain language** — Loaf for Linux, with some pet features limited on Wayland.
**5 Technical** — Add an ubuntu job to the build matrix; Tauri bundles AppImage/deb; test tray (libayatana-appindicator); document Wayland caveats; the activity collector needs an X11 path first, Wayland later.
**6 Choices** — AppImage (portable) first, .deb second, Flatpak later.
**7 Tasks** — 1 CI job · 2 bundle config · 3 collector stub for Linux · 4 caveats doc.
**8 Tests** — T-57-01 CI: build succeeds · T-57-02 CI: launch smoke test under xvfb · T-57-03 Manual-Linux.
**9 Edge cases** — No tray support; Wayland; missing webkit2gtk.
**10 Acceptance** — CI artifacts install and launch on a clean Ubuntu.
**11 Checklist** — [ ] CI · [ ] bundle · [ ] smoke · [ ] docs
**13 Deps** — M3 collectors. Excludes: code signing.

---

## FR-58 — Student pack

**1 Metadata** — Group: Students · Status: Planned · Milestone: FM-ST (first after the V2 fixes) · Effort: L · Origin: owner 2026-10-22 and the student-first decision.
**2 Story** — As a student I track deadlines by course, focus on a task, see my weekly study time, count down to exams and capture ideas fast.
**3 Behaviour** — (a) Tasks get a **course** label and a deadline view grouped by course. (b) **Focus session linked to a task**; time is added to that task and its course. (c) **Weekly study report** from existing time tracking. (d) **Exam countdowns** on Today. (e) **Quick capture** hotkey: a small box that creates a note or task. (f) Quiz from notes waits for AI (M5) and is not part of this.
**4 Plain language** — Deadlines by subject, focus on a task, a weekly summary, exam countdowns and a fast notepad.
**5 Technical** — Course = reuse labels or a new `course` field (additive migration); focus sessions table gains `task_id` (additive); report is a query over existing tracked time; exam = task with a type flag; quick capture uses the existing global-shortcut path.
**6 Choices** — Course as label (no migration) vs field (cleaner queries). Suggested: field.
**7 Tasks** — 1 migration · 2 course UI · 3 focus↔task · 4 weekly report · 5 exam countdown · 6 quick capture.
**8 Tests** — T-58-01 Rust: migration additive · T-58-02 Rust: focus time added to task · T-58-03 Rust: weekly totals with timezone/DST · T-58-04 component: countdown · T-58-05 Manual-Win: quick capture hotkey.
**9 Edge cases** — Week start; DST week; task deleted during focus; exam in the past.
**10 Acceptance** — Each of (a)–(e) works and tests pass.
**11 Checklist** — [ ] migration · [ ] course · [ ] focus link · [ ] report · [ ] exams · [ ] capture · [ ] docs
**13 Deps** — FR-05 Focus, FR-45 picker. Excludes: AI quiz, group projects (FR-10).
