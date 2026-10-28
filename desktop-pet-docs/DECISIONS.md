# Loaf — Decisions

One place to see what was decided, by whom, and what is still open. Long reasoning stays where it already lives:

- Architecture decisions ADR-001 … ADR-019: [`docs/01-build-principles/07-architecture-decisions.md`](docs/01-build-principles/07-architecture-decisions.md)
- V-2 RAM metric: [`docs/05-backend/adr-020-ram-metric-v2.md`](docs/05-backend/adr-020-ram-metric-v2.md) (ADR-020; was wrongly numbered ADR-001)
- Product decisions D-1 … D-10: [PRD §9](docs/02-prd/PRD.md) and amendments in PRD §12

**Source tags:** *Owner* = said by the project owner in chat; *Doc* = written in a locked document; *Claude* = proposed by Claude and accepted by silence or not yet reviewed.

---

## 1. Open decisions

### Open since 2026-10-13 (roadmap redesign)

| # | Question | Why it matters |
|---|----------|-----------------|
| U12 | Which AI provider for M5 (writing/prompt assistant)? Claude via the Anthropic API is the default fit for this stack; OpenAI or a local model are alternatives. Also: is there a free/local fallback for someone without an API key, and should the key live in the OS keychain (same mechanism M10/MCP will need)? | **Blocks M5 from starting at all** — the provider interface, the settings UI and the "this sends text to the provider" notice all depend on the answer. Nothing else in the new roadmap is blocked on it. |
| U13 | Old M5 "Developer reactions" (git/build awareness, now M12) is not on the owner's 2026-10-13 feature list. Still wanted, just lower priority, or dropped? | Decides whether M12 stays in the roadmap or is retired like the global-search and Progress-card items in §4.7 of PROJECT_STATUS. Nothing is deleted yet — it is kept, flagged, at the end of the order. |
| U14 | The owner's 2026-10-13 list orders Voice (now M9) ahead of MCP (now M10). This changes part of **ADR-015**, which locked Developer → MCP → Voice. Confirm the new order (Quick Actions → Writing assistant → Reminders/pet → Meeting-to-action → Focus & wellbeing → Voice → MCP → Privacy-radar report → Developer → Character), or say if ADR-015's order should stand instead. | ADR-015 is a locked architecture decision; this session changed its practical effect without a new ADR entry. The roadmap now reflects the owner's explicit new list, but the ADR document itself is unchanged — flagging this so the discrepancy is never silently resolved either way. |
| U15 | Item 9, Privacy radar, is scheduled with two parts: capture rides with **M3** (shares the browser-extension groundwork), the report is its own milestone **M11**, later in the order. If the owner wants both shipped together, M11 folds back into M3. | Pure scheduling; doesn't change what gets built, only when the report UI appears relative to Voice/MCP. |
| U16 | **Privacy radar (M3 capture / M11 report): how can Loaf see third-party requests with no browser extension?** The address bar shows only the page, not what it loads. Options: (a) allow an extension just for this feature; (b) Windows-only DNS event tracing (needs administrator rights; no macOS equivalent); (c) a local proxy the browser is pointed at (invasive, breaks HTTPS inspection, not recommended); (d) drop "third-party requests" and make the radar about *sites you visit* (categories, time, known-tracker sites you visited) with honest wording. | Decides whether M11 is buildable as written. Recommendation: (d) now, (a) later only if you want real tracker detection. **Taken provisionally 2026-10-18** (owner said "complete M3"): option d. Core helper and the Time › Sites Privacy radar panel are built (2026-10-18; owner: "no need to track requests"). Confirm or change. |
| U17 | **AI assistant notifications** (owner request 2026-10-14; plan in `docs/features/AN-assistant-notifications.md`): may Loaf edit `~/.claude/settings.json` to install the hooks (with a backup and one-click undo), or only show a snippet to paste? | Recommendation: guided install with backup, off until the owner clicks. Editing another tool's config is the riskiest step of the feature. |
| U18 | Notifications: show a short preview of Claude's last message, or only "Finished in <project>"? | Recommendation: off by default. A preview can contain private code or secrets, and it is shown on the lock screen. |
| U19 | The hook helper (`loaf-hook`) must ship as a signed sidecar next to Loaf. | Blocked on signing certificates (already outstanding). Until then it works from a dev build only. |
| U20 | Should "needs your input" break through quiet hours? | Default: no, to match the quiet-hours promise. Changing it means a blocked agent waits until morning. |
| U21 | Should existing reminders adopt the same quiet hours and policy (M6.2)? | Recommendation: yes, one policy for every notification. |
| U22 | Claude Code on the web / cloud sessions cannot reach a local pipe. Accept "local sessions only"? | Documented as unsupported; no workaround without a network service, which ADR-010 rejects. |
| U17 | **Answered 2026-10-18 by owner: auto-edit.** Loaf edits `~/.claude/settings.json` itself (adds its hook entries, keeps everything else, writes a backup first, and offers one-click removal). | Plan AN-07 updated accordingly. Snippet-only mode is no longer planned. |
| U18 | Message preview (Claude's last message) | Still open. Default when built: off. |
| U20 | **Answered 2026-10-18 by owner, partly:** in quiet mode (manual or scheduled) assistant events show a small bubble above the pet, with no sound and no OS toast. This overrides the earlier default of "breaks through quiet hours: no". | Conflicts with ROADMAP M6.2 ("no bubbles inside quiet hours"). M6.2 must be amended in the same change, or the owner confirms the conflict. |
| U23 | Notification channel: is the pet bubble the primary channel, with the OS toast optional (off by default)? | Assumed yes from the owner's wording ("a small bubble above the pet"). Confirm before AN-05. |

None of these block the roadmap document itself, already updated in `ROADMAP.md`. They block the *code* for M5, M9/M10's relative order, and M12's fate.

### Resolved on 2026-10-11 (owner)

### Resolved on 2026-10-11 (owner)

| # | Question | Answer | What was done |
|---|----------|--------|---------------|
| U1 | First release name | **v0.1.0** for M1; **v1.0.0** stays for the full Phase 1 | Roadmap; version bump happens at release time |
| U2 | Post-v1 order | **As locked:** Developer → MCP → Voice (ADR-015) | Roadmap unchanged |
| U3 | Where Daily Logs history lives | **On the Time page, short** | "Daily log" list on the Time page |
| U4 | Progress card | **Do not create one** | R1-70's yesterday/today summary dropped |
| U5 | Autosave and delete rules | **Update the PRD to match the code** | PRD v1.5: 500 ms; Bin + Undo |
| U6 | Merge PR #1 | **Merge now; build in one branch** | PR #1 merged as `3cdaa9e`; work continues on the one designated branch via new PRs to `main` |
| U7 | Repo rename | **Update the remote** | Done in docs; this cloud session's git proxy only allows the old name, so you must run the `git remote set-url` command in PROJECT_STATUS R7 on your PC |
| U8 | Two documents called ADR-001 | "Do something" (not understood) | Claude renamed the RAM one to **ADR-020** (file, heading and references) |
| U9 | Week calendar | **Next 7 days** | Calendar starts today |
| U10 | Task search | "Leave to M1" — read as **include it in M1** | Search box on the Tasks page. If you meant "leave it out", delete that box |
| U11 | Autostart | **Build before the first version** | F0-09 built |

## 2. Decisions made

### Owner decisions (from chat)

- **2026-10-22 (owner), character pipeline:** a limited first release of personal characters (few states from one photo, honestly labelled) is fine. **Peekoo** is the reference competitor. Face motion is not faces-only (can be the full image) and is built after the character studio has more characters. **GPU usage: no**, so GPU-based and generative models are out; CPU-only local deformation only. Open-source tools preferred; check each version's licence.
- **2026-10-22 (owner), Emote and Reactions System (FR-40):** define the features and finish the documents first; do not build yet. Eight emotes specified in `docs/character/EMOTE_FEATURE_SPECS.md` (all Planned). Open: D-EMOTE-ORDER, D-EMOTE-MILESTONE, D-EMOTE-DOUBLECLICK, D-EMOTE-ART, D-EMOTE-MASTER.
- **2026-10-22 (owner), emote decisions:** FM-8b order approved; `pet.emotes_enabled` default on (the character studio will later define look, behaviour and abilities); double-click keeps hiding the main window; milestones planned by Claude (EM-06: 10th/50th/100th then every 100th task, 7 and 30 day streaks, once each, shared cooldown and daily cap, off by default); bear back and three-quarter art to be built (done, Unverified); Rive trial to be run (blocked: needs a `.riv` authored in the Rive editor); detailed feature docs wait until the character system is consistent and final.
- **2026-10-22 (owner), back-turn shake scope:** only built-in characters (bear, Mochi, Pip, Bolt, Ghosty) get drawn back and three-quarter views and the back-turn shake. Personal-photo characters (CH-05, CH-06) never get it; the emote falls back honestly (no fake mirrored back).

- **2026-10-21 (owner), character pipeline (FR-39):** D-UPLOAD **allowed** (personal photos may be uploaded; consent text and local-first processing required). D-FORMAT **approved** as a starting point; the owner says the format will be found by trial and error. D-RIVE **yes, run the one-character trial**. D-CHARS: the owner will supply reference images and Claude designs the built-in characters. Source: `docs/archive/CHARACTER_PIPELINE_RESEARCH.md` §10.
- **2026-10-21 (owner), order of work:** define and complete **all local features and characters first** (including personalised human characters and several built-in characters). **Cloud and AI integration come after**, and the V2 issues the owner will list are fixed before new features.

- **2026-10-19 (owner):** keep all existing features and add the new ones. Keyboard shortcuts are **off by default**; users enable them with a button (FR-37; default for existing installs to be confirmed, D-SHORTCUT-DEFAULT). Keep one Git branch, `main`; the other branch is removed. Code signing **on hold**. Meetings does not make sense to the owner; the owner will define the problem and asked to be asked about it next time Meetings comes up (FR-38, D-MEETINGS). Shortcuts off by default "in the coming versions" (FR-37). Source version stays 0.2.0 (D-VERSION, owner: "leave it"); tag `v2.0.0` is the owner's label. Only the feature document and current-state docs for now.

| Date | Decision | Where it shows |
|------|----------|----------------|
| 2026-10-03 | PRD §9 D-1 … D-10 approved; documents D0–D7 locked | PRD, `desktop-pet-docs/README.md` |
| 2026-10-12 | Four characters (Mochi, Pip, Bolt, Ghosty) designed early, pulled forward from Phase 7; Ember, Sprout and Byte dropped. Bear first. | Character page (preview) |
| 2026-10-12 | Mac parity (owner: "bring mac and windows features to parity"): app tracking via `NSWorkspace.frontmostApplication` looked at every 1 s (exception to ADR-009: the activation notification needs a run loop); sites via AppleScript for Chrome-family browsers only. Safari skipped because private windows can't be detected (privacy over coverage). Signing will need the `com.apple.security.automation.apple-events` entitlement | `src-tauri/src/tracking.rs`, `src-tauri/src/sites.rs`, `src-tauri/Info.plist` |
| 2026-10-13 | **No browser extension, ever, for this** (owner: "we will allow users to give permissions to our pet and it does it all"). Open tabs built the same way as site time: Windows UI Automation (tab strip titles for every tab; domain only for the tab actually showing — a background tab isn't rendered, so there's nothing to read), macOS AppleScript (every tab's URL directly, no switching, for the same Chrome-family browsers as site time). Close-tab the same way: invoke the tab's own close button (Windows) or `close tab` (macOS AppleScript). Nothing stored; read fresh each time the panel is open. Replaces the planned Chrome/Edge extension + native-messaging bridge for this feature (ROADMAP M3's extension line removed) | `crates/loaf-core/src/sites.rs` (`OpenTab`), `src-tauri/src/tabs.rs`, `src/features/time/OpenTabsPanel.tsx` |
| 2026-10-12 | Website time: **address bar first** (no extension), behind its own switch `tracking.sites` (off by default, needs `tracking.apps`). Domain only; the full address is in memory for a moment, then dropped. Private windows skipped (Edge/Firefox by title, Chrome/Brave by the Incognito/Private button, English only); a window that can't be read records nothing. 2 s polling while a browser is in front (exception to ADR-009: no OS event for address changes). Extension later only if the open-tabs feature is wanted; its bridge would be **native messaging** (owner) | `crates/loaf-core/src/sites.rs`, `src-tauri/src/sites.rs` |
| 2026-10-12 | Typing reaction approved: count key presses only (never which key), off by default with its own switch, nothing stored or sent; macOS needs Input Monitoring | `pet.typing`, `src-tauri/src/typing.rs`, `src/pet/typing.ts` |
| 2026-10-12 | Typing sequence: laptop out of the pocket → types → stops 3 s after the last key and looks at you → puts it away after 20 s. Owner asked to wait "until the text box is open"; approved 2026-10-12: Windows text-caret check (`GetGUIThreadInfo`), macOS Accessibility role check; 20 s wait only where the OS can't tell | Character page, pet |
| 2026-10-03 | Global search removed from v1 (ADR-017) | Architecture decisions |
| 2026-10-03 | Phase order: Developer → MCP → Voice (ADR-015); CI status after MCP (ADR-016) | Architecture decisions |
| 2026-10-04 | Windows is developed and tested on the owner's PC; macOS and Windows are built by GitHub Actions and sent for testing | CI |
| 2026-10-04 | V-2 RAM is gated on **private working set**, not private bytes (ADR-020) | `05-backend/adr-020-ram-metric-v2.md` |
| 2026-10-04 | The UI must look polished and professional, structured tiles, not a "kids" UI | `src/index.css`, dashboard |
| 2026-10-04 | App window opens maximized | `tauri.conf.json` |
| 2026-10-04 | Reminders live inside Today (one agenda) | Today overview |
| 2026-10-04 | Today and Overview merged into one **Today overview** page; it is the landing page | `App.tsx` |
| 2026-10-04 | Sidebar: Today overview, Time, Notes, Character, MCP; Library (Archive, Bin); Settings. Labels live inside Notes, not the sidebar | `Sidebar.tsx` |
| 2026-10-04 | Notes tab order: Today, This-week calendar, Pinned (distinct row), All notes. Search, New note and Ctrl/⌘ K/N only on Notes | `NotesPage.tsx` |
| 2026-10-04 | Bin (30 days) and plain notes search added (reverses part of ADR-017) | PRD amendment v1.4 |
| 2026-10-04 | App and site time tracking pulled forward from Phase 2: **opt-in, off by default, domain-only (no URLs or titles), local, deletable** (ADR-019) | Architecture decisions |
| 2026-10-04 | Time = "where my time went": per-app time, browser sites, click for active spans, with period, category and app/site filters; no calendar, no log | `TimePage.tsx` |
| 2026-10-04 | Today agenda shows time, tasks, reminders; calendar events arrive with MCP (Phase 5) | Roadmap M10 (renumbered 2026-10-13; was M6) |
| 2026-10-13 | Milestone roadmap redesigned around the owner's new core-features list: added M4 Quick Actions, M5 Writing/prompt assistant, M7 Meeting-to-action (AI), M8 Focus & wellbeing, M11 Privacy-radar report; renumbered old M4→M6, M5→M12, M6→M10, M6b→M10b, M7→M9, M8→M13. See open questions U12–U15 above. | `ROADMAP.md` §2 and the new M4–M13 sections |
| 2026-10-05 | Remove Progress tile and "Coming up"; Links in their own card; total time in a large tile with Apps and Websites under it | `TodayOverviewPage.tsx` |
| 2026-10-05 | Today tasks are editable: priority, deadline, reminder | `TaskEditor.tsx` |
| 2026-10-05 | Overview tiles can be dragged and the order is remembered; Overview page is "fine" | `MovableTiles.tsx` |
| 2026-10-05 | Notes next, then continue in order | This roadmap |
| 2026-10-11 | **P0 = Notes and daily work management is the first release.** Later: browser tracking, desktop companion, voice, MCP, developer reactions, characters | `ROADMAP.md` |
| 2026-10-12 | Next release only after Phase 2 (M2 + M3) is complete; no version bumps until then | Owner, after testing 0.1.3 |
| 2026-10-12 | First run (F1-26): one welcome screen, start empty (no sample data), pet on by default; tracking and login off until chosen | Owner chose the recommended options |
| 2026-10-12 | Global `Mod+Shift+T` and the quick-add popup (F1-24) removed | Owner: "remove the shortcut ctrl+shift+T completely" |
| 2026-10-11 | U1–U11 answered (table above): v0.1.0 for M1, ADR-015 order kept, Time page history, no Progress card, PRD v1.5, merge PR #1, next-7-days calendar, autostart before release | PRD, `ROADMAP.md`, code |

### Technical decisions made by Claude (open to review)

| Date | Decision | Reason |
|------|----------|--------|
| 2026-10-04 | Use ts-rs 11 to generate TypeScript types from Rust; CI fails if they are stale | One source of truth for IPC types |
| 2026-10-04 | In-memory mock shell (`src/ipc/mock.ts`) for design work in a browser | Fast UI iteration without the desktop shell |
| 2026-10-04 | Use the official single-instance plugin, not a lock file | The hand-rolled version was unreliable |
| 2026-10-04 | Opener plugin with narrow permissions; the UI calls our own `open_url`, which only allows http, https and mailto | Limits what a pasted link can do |
| 2026-10-04 | Tracking idle check: one 60 s timer only while a session is open and tracking is on; 5 min idle threshold (ADR-019 exception to ADR-009) | No OS event exists for "no input" |
| 2026-10-05 | A reminder created from the task editor is a normal reminder with the task's title, not linked to the task | No schema change |
| 2026-10-05 | `@dnd-kit` for tile drag, for keyboard support | Native drag has no keyboard path |
| 2026-10-05 | Overview tiles share one height so dragging leaves no gaps | Mixed heights left empty holes |
| 2026-10-11 | Export is a plain JSON dump of every table by column name; import inserts the same way, in one transaction, and recomputes label `name_folded` | New tables are covered without a second list to maintain; a bad row undoes everything |
| 2026-10-11 | The export/import file dialogs are opened by Rust (dialog plugin), never by the webview | The webview never holds or supplies a file path |
| 2026-10-11 | Delete all lifts the append-only triggers inside one transaction, wipes every table, puts the triggers back, then runs `VACUUM` | Keeps the "history is append-only" rule everywhere else, and removes deleted text from the file |
| 2026-10-11 | Autostart: the OS login item is the truth; if it disagrees with the setting at startup, the setting changes. The main window is created hidden and shown unless `--hidden` | A removed login item can't leave the switch lying |
| 2026-10-11 | Windows installer uses `embedBootstrapper` for WebView2 | Works on a clean PC without a separate download step for most systems |
| 2026-10-11 | A day's log is exported by copying Markdown to the clipboard | No file dialog needed for a short text; a save-to-file option can follow |
| 2026-10-11 | Tasks got their own sidebar page ("Tasks") between Today overview and Time | R1-27 needs the five views somewhere; the owner approved the sidebar order earlier but not this addition: tell Claude if you want it elsewhere |
| 2026-10-11 | Coverage floors: core ≥ 90% lines (measured 97%), frontend lines 80 / branches 70 / functions 55 (measured 88 / 80 / 65) | Catches large drops without failing on small ones |
| 2026-10-11 | The pet (F1-22) was built before M2 starts because the owner reported its absence as a v0.1 bug | Owner request after testing v0.1.0 |
| 2026-10-11 | Pet window: one transparent window that grows to show the hover card toward the free side of the screen, instead of a second card window | One webview; the pet never jumps |
| 2026-10-11 | Pet animations use CSS transforms only (breathe, blink, wave, hop); no JS animation loop. R1-65 (~0 idle CPU) is not measured yet (risk R9) | Cheapest animation the webview offers |
| 2026-10-11 | Click vs double-click on the pet: a click waits 260 ms; a second click inside that window hides Loaf instead | Owner asked for click = open, double-click = close |
| 2026-10-11 | Pet right-click menu is a native OS menu (Tauri `popup_menu`), not an HTML menu | A transparent 128 px window cannot fit an HTML menu |
| 2026-10-11 | Global shortcuts `Mod+Shift+L` (Loaf), `N` (note), `T` (task), `P` (pet). A key already taken by another app is skipped with a log warning, not an error | Owner asked for pet shortcuts; startup must not fail over a key clash |
| 2026-10-11 | Main window opens at 1180×760, centred, not maximized; the window-state plugin remembers size, position and maximized state (not the pet) | Owner: "open halfway, full screen only when I choose" |
| 2026-10-11 | Any task can be deleted. An unfinished task is cancelled first (so history records it), then deleted; two-step "Delete?" confirm on rows | Owner asked for delete on every task; core only deletes finished tasks |
| 2026-10-11 | Colour pass: darker dark-mode canvas, raised cards with a 1px border and top-edge highlight, stronger muted text; one accent colour | Owner said the colours were confusing; follows the 60-30-10 / subtle-border rules |
| 2026-10-11 | Bear stays a drawn SVG ("soft 3D": shading, rim light, contact shadows), not real 3D. Owner chose it over three.js | Real 3D needs an artist-made model and keeps the GPU busy; an artist Rive/Lottie file can replace the SVG later |
| 2026-10-11 | Pet reactions are one table of event → pose, bubble, duration, priority (`src/pet/reactions.ts`); at most 3 wait, highest priority first | Owner: "lot more to come" — new moments must be one line each |
| 2026-10-11 | ~~"Overdue" reaction noticed by the pet once a minute~~ **Removed in 0.1.3** (owner) | Owner did not want it |
| 2026-10-11 | The bear sleeps after 15 minutes with no activity (hover, click, any Loaf event, tracked app time), not by the clock | Owner works late; clock-based sleep looked like "always asleep". With tracking off, only Loaf activity keeps it awake |
| 2026-10-11 | Speech bubbles grow the pet window the same way the hover card does, and never take focus | A bubble must not interrupt typing in another app |
| 2026-10-11 | Scrollbars are invisible until the pointer is over the scrolling area | Owner asked for no visible scrollbars; hiding them fully would remove the only hint that a list scrolls |
| 2026-10-12 | A due reminder is shown four ways: system notification, taskbar flash, pet bell (15 s), in-app alert with Done / Snooze | The system notification can be swallowed silently (Do not disturb, notifications off) and the plugin never reports it |
| 2026-10-12 | Dragging the pet with its card open moves the grown window; the shell computes the pet's new square from how far the window moved | Resizing the window at the start of a drag cancels the drag on Windows |
| 2026-10-12 | Meetings save themselves 600 ms after the last change (like notes); a new meeting is created the first time it has a title | No Save button to forget; matches notes |
| 2026-10-12 | Decisions and action items keep their ids across saves, and the UI makes the id for a new item | A converted action item stays linked to its task when the list is edited or reordered, and the page never has to match rows up after a save |
| 2026-10-12 | Converting an action item: task planned date stays empty (it shows under All/Upcoming by due date, not Today) | R1-34 sets title, project, due and description only |
| 2026-10-12 | Meetings page is `Mod+5`; `Mod+4` stays Time | The UI brief puts Meetings at `Mod+4`, but Time already owns it and the owner uses it |
| 2026-10-12 | Today shows only "Yesterday: X of Y done · N still open" from R1-70; a click opens Tasks filtered to those tasks. Meeting follow-ups and pinned notes are not on Today | Owner chose only this |
| 2026-10-12 | Two global shortcuts are changeable (open/hide Loaf, new note); the pet's stays fixed. A combination needs Ctrl/⌘ or Alt plus a letter, digit or F-key, checked in the core and in the UI | Matches the existing settings keys; Shift-only combos would steal typing |
| 2026-10-12 | Log level changes apply immediately (reloadable filter), no restart | Debug logging is most useful right when a problem is happening |
| 2026-10-12 | Reset settings resets settings only, not data or layout preferences | "Reset" next to a Delete-all button must not be a second delete |
| 2026-10-12 | End-to-end tests drive the real binary with WebDriver (tauri-driver + selenium-webdriver, Node's own test runner) on Windows; macOS gets a launch smoke test only | Tauri's WebDriver works on Windows and Linux, not macOS; one small dependency, no new test framework |
| 2026-10-12 | `LOAF_DATA_DIR` overrides where data and logs live | Tests (and anyone running a second copy) must never touch real data |

### Documented conflicts (code differs from a locked document)

| Document says | Code does | Resolution |
|---------------|-----------|------------|
| UI brief §8: `Mod+4` Meetings, `Mod+5` Daily Logs, global `Mod+Shift+T` quick-add | `Mod+4` Time, `Mod+5` Meetings, no `Mod+Shift+T` | Owner removed `Mod+Shift+T`; Time kept `Mod+4` |
| R1-02 autosave after 800 ms | 500 ms | U5 |
| R1-05 no trash, 5 s undo | 30-day Bin, undo toast | Owner addition; PRD amended in v1.4; U5 for the rest |
| R1-09 label list in the sidebar | Label chips on Notes | Owner decision 2026-10-04 |
| D-9 home = Today + Dashboard | Home = Today overview | PRD amendment v1.4 |
| R1-46, R1-84 hide activity and tracking until Phase 2 | Shown when tracking is on | PRD amendment v1.4 |

## 2026-10-22 — Owner decisions after testing v2.0.0 (source 0.2.0)

Source: the owner's V2 testing message. Issues are logged in `docs/V2_ISSUES.md`; specs are FR-41..FR-58 in `docs/features/FR-v2-features.md`.

| Decision | Detail |
|----------|--------|
| **Student-first positioning: APPROVED** | Students first, developers second, everyone else third. Milestone ids are kept; only the delivery order changes (see ROADMAP.md "Delivery order"). Supersedes the "proposed" note. |
| Backend: YES (closes D-BACKEND) | Needs a written privacy statement first: Loaf stays local-first, and nothing leaves the PC unless the owner of the data opts in. |
| Gallery: YES | Static catalog first (FR-56). |
| Rive dropped; sprite characters | Packs follow the OpenPets/Codex sprite-sheet layout (FR-50). Rive trial closed as not pursued. |
| Character Studio like OpenPets | Spec: `docs/character/CHARACTER_STUDIO_SPEC.md`. |
| Plugins downloadable from the website | `.loafplugin`, permission prompt, sandbox (FR-55). Code signing is on hold. |
| Linux build: YES | AppImage and .deb (FR-57). Unverified until run on Linux. |
| Local MCP server: YES | Connects only to applications on this PC; shape proposed in D-MCP-SHAPE (stdio + local socket, no open port). |
| Pet window shortcuts editable, default OFF | FR-48. |
| Project Spaces: opt-in, default OFF | Setting adds a left-menu item (FR-53). |
| Developer reactions (M12): confirmed | Comes after the student pack. |
| Personal-photo characters: HOLD | Owner will say when. |
| Code signing: HOLD | Plugins and installers show an unsigned warning until then. |
| Quiz from notes | Waits for AI integration (M5). |
| Guide with a skip option | Credits "Built by QUORBIT TECHNOLOGIES" (FR-51). |

Still open: Q1-Q6 in `docs/V2_ISSUES.md`, D-SIZE (sprite cell size), D-MCP-SHAPE, D-PLUGIN-MODEL, D-LICENCE, AI provider.

## 2026-10-22 (later) — Owner answers Q2, Q3, Q6; auto-chosen items

| Decision | Detail |
|---|---|
| Backend: not now | Stay local-only. A written privacy statement comes first, when the backend is actually built. |
| Q2 (reverses V2-03) | Notifications **do** show above the pet, and emote speech bubbles too. V2-03 becomes "make the pop-ups above the pet work properly", not "remove them". |
| Q3 auto-delete | Applies to Time/activity history and completed tasks: data the user no longer needs after the days pass. Notes, meetings and open tasks are not auto-deleted. Deletion still goes to the Bin first. |
| Q6 | Yes: tasks converted from meeting action items appear on Today, labelled with the meeting name. |
| D-SIZE (auto-chosen) | 192×208 cells, 8×9 atlas: keeps compatibility with the hatch-pet/OpenPets layout. Revisit only if a real OpenPets pack proves different. |
| D-LICENCE (auto-chosen) | Built-in pack art: CC BY 4.0 (share and remix with credit to QUORBIT TECHNOLOGIES). Owner may change before the gallery opens. |
| AI provider (auto-chosen) | Local first: Ollama (MIT licence, runs on the PC, no account, nothing leaves the machine). A bring-your-own cloud key can be added later as opt-in. Note: no GPU is assumed, so small models only and slower answers. |
| D-MCP-SHAPE, D-PLUGIN-MODEL | **HOLD** (owner). |
| Sprite rows | All 9 rows now have drawn art; `running-left` is the right-facing art mirrored and re-lit (standard sprite practice). |

Still open: Q1 (toast stack vs bell), Q4 ("tabs opened"), Q5 (confirm the V2-01 link plan).

## 2026-10-22 (evening) — Owner answers Q1, Q4, Q5; AI on hold; OpenPets research

| Decision | Detail |
|---|---|
| Q2 confirmed | Notifications and emote bubbles above the pet stay and are fixed (FR-43). |
| AI provider: HOLD | Supersedes the auto-choice (Ollama) above. M5 and quiz-from-notes stay blocked. |
| Q1: toast stack | Bottom-right stack, auto-dismiss, action button (FR-41). No bell. |
| Q5: V2-01 plan confirmed | "Open note" on the task, "Linked tasks" in the note, "Create note from task" (FR-42). |
| Q4: browser tabs on the dashboard | Show the tabs open in the user's browsers, switch to one, close one, all from the dashboard. **Constraint:** no browser extension (locked). Proposed method: Windows UI Automation reads the tab strip of Chrome, Edge and Firefox, selects and closes tabs through the accessibility tree. Off by default, local only, titles never stored. Risk: breaks when a browser changes its UI; macOS/Linux need separate work. Needs a spike before it is promised. |
| Pack file format | OpenPets research (below) shows `spritesheet.webp` is the standard; packs now ship `spritesheet.webp` (and a PNG preview), and `pet.json` points at the WebP. |

Still open: none of Q1-Q7 except the Q4 spike result.

## 2026-10-22 (night) — Master plan; OpenPets source research

- `MASTER_PLAN.md` is the single plan: phases P0-P7, milestones, every feature with "done when". All owner questions Q1-Q6 are closed.
- OpenPets researched from its source (OpenPetsHQ/openpets 4.1.0, MIT): `docs/competitors/OPENPETS_RESEARCH_2026-10-22.md`. Their site does not resolve from our build environment.
- Packs: `pet.json` now holds only the four OpenPets fields; our own details moved to `loaf.json` so strict importers do not reject unknown keys.
- New features: FR-59 cursor gaze rows, FR-60 drag-and-throw and wander, FR-61 rename links (V2-16). Accessories (FR-49) will use the OpenPets `wardrobe` format; emotes export as OpenPets `activities`.

## 2026-10-22 (late) — Owner: all OpenPets features in Loaf

- Every OpenPets feature is planned: FR-59…FR-82, specs in `docs/features/FR-openpets-parity.md`, mapping table in `MASTER_PLAN.md`.
- Features needing on-hold decisions stay on hold: talk-to-pet AI (FR-75), coding-agent MCP (FR-76), plugin SDK (FR-77), AI Pet Studio (FR-80).
- Because plugins are on hold, OpenPets' plugin features (wellbeing, timer, fun pack, launcher, system badge) are built **into** Loaf.
- Not copied: Spotify Buddy, Higgsfield Watch (low value). Electron not adopted (Tauri stays).
- FR-49 accessories → FR-64 wardrobe; FR-49a → FR-62; FR-09 merged into FR-72.
- Open for the owner: hosting for the gallery (FR-66), first extra languages (FR-79).

## 2026-10-22 (final) — Planning closed; role profiles; cleanup

- Gallery hosting: **GitHub Pages** (static, no server, no accounts). First extra languages: **Hindi and Telugu**.
- **Role profiles (FR-83):** first run asks Student / Developer / Student who codes / General; each role sets which features start on or off; users can turn anything on; privacy features stay off for every role. Matrix in `docs/features/FR-83-role-profiles.md`.
- **Planning is closed.** Next phase is building only, in MASTER_PLAN order. Blocker options: `docs/BLOCKERS_AND_OPTIONS.md` (owner to decide: open-source yes/no, AI hybrid spike, plugin model B, MCP shape).
- Cleanup: removed unused UI code (`separator.tsx`, `tabs.tsx`, `charts/Ring.tsx`); pack PNG previews no longer committed (WebP is the pack file); superseded docs moved to `docs/archive/` (not deleted); docs README has a hierarchy map.

## 2026-10-22 (owner answers on blockers) — open source, AI, plugins, MCP; pet library built

| Decision | Detail |
|---|---|
| **Loaf is open source** | Code: MIT (`LICENSE`, copyright QUORBIT TECHNOLOGIES — owner may change the holder). Character art: CC BY 4.0. Unblocks code signing through **SignPath Foundation (free for open source)**; apply once the repo is public. |
| AI | Local first, **BYOK** kept, **we never pay for AI**. Local runtime: lighter than Ollama preferred — see `docs/BLOCKERS_AND_OPTIONS.md` §2 (llama.cpp sidecar or in-process Rust, small Apache-licensed models). Spike still needed to pick. |
| **Plugin model** | Plugins = **packs** (art only, no code): characters, wardrobe outfits, activities. Users add them to their library/wardrobe. Closes D-PLUGIN-MODEL. Code plugins (FR-77) not planned. |
| MCP shape | Approved: stdio + named pipe + per-run token; tools status / react / say. Closes D-MCP-SHAPE. |
| Backend | Closed for now. |
| Personal-photo characters | Still on hold (no answer). |
| Product name | Owner asks for suggestions only (`docs/BLOCKERS_AND_OPTIONS.md` §8). |
| Windows test | Owner will release a build, install it, then test. |
| **Codex pet library: built now** | FR-63 first slice: import a pet folder, auto-list `~/.codex/pets` (Petdex/Codex installs), preview, "Use" as the desktop pet; reactions map to OpenPets rows. ZIP import and catalog later. Third-party pets are **not bundled** in Loaf: each pet's licence belongs to its creator. Unverified on Windows. |
| Finding | Browser tabs on the dashboard (FR-62) already exist (`src-tauri/src/tabs.rs`, Time tab "Open tabs") but only appear when **both** app and website tracking are on. FR-62 reduces to making this visible/understandable. |

- 2026-10-22: Bundling third-party Codex/Petdex pets in Loaf: **no** without each creator's written permission. Petdex states pet assets are owned by their submitters under licences they choose, and Petdex claims no rights; the MIT licence covers Petdex's code only. Instead Loaf also scans `~/.petdex/pets`, so pets installed with `npx petdex install <name>` appear automatically. Owner asked (2026-10-22) whether crediting them as "Codex pets" allows bundling: **no** — credit is a condition of a licence, not a substitute for one. Bundle only pets whose creator declared an open licence (CC0, CC BY) or gave permission. Option for later: an opt-in "Get pets" browser that downloads from Petdex on the user's request (user fetches, we don't redistribute).

## 2026-10-22 — Pet sources: what we may bundle, how to make pets, community uploads

- **OpenPets' own pet (Hoodie Cat + pajamas/summer/halloween outfits)** is inside the OpenPetsHQ/openpets repository, which is MIT-licensed with no separate art licence found (checked LICENSE, README, docs/pets.md, docs/catalog.md). [Likely] It may be bundled **with the MIT copyright notice "Copyright (c) 2026 OpenPets" and credit**. Owner decides; recommend confirming with the OpenPets maintainer first because art licensing is easy to get wrong.
- **OpenPets catalog / Studio pets** (the 1,000+ online) are **not** in the repo and carry no licence: same rule as Petdex — not bundled; users install them themselves.
- **Making pets with Codex:** OpenAI's `hatch-pet` skill creates Codex pets from character art: output `pet.json` + `spritesheet.webp`, 8×9 grid, saved to `~/.codex/pets/<id>/` — exactly what Loaf's library reads. Our own characters can also be exported by our pack exporter.
- **Community uploads (owner wants):** planned as the gallery's next step: users submit packs (art only), Loaf validates them (FR-63 checker), a human approves, and each upload must carry a declared licence (CC BY / CC0) and an "I made this or have the right to share it" confirmation, plus a takedown process. Needs a place to accept uploads → backend or a GitHub-based flow (pull requests to a `pets` repo, no server). Backend stays closed, so the GitHub flow is the proposal.
- **OpenPets AI Studio:** not free for drawing — the site says "credits are only spent when Studio draws"; the price and any free allowance were not visible from here.
- Tests for everything built this round are listed in `TESTS_NEW_FEATURES.md` (automated + manual Windows steps).

## 2026-10-23 — Owner: community server, routine, diary, reactions; research findings

- **Backend reopened for the community pets website + upload server (FR-84)**, instead of pull requests. Everything else stays local. Privacy statement before launch.
- New features: FR-85 daily routine (built now), FR-86 private encrypted diary with task pick-up (local rules, no AI), FR-87 per-event reactions with a feature-by-feature event audit.
- Research (`docs/business/MARKET_RESEARCH_2026-10-23.md`): direction confirmed (pet + student tools + local tracking is an unfilled gap); scope warning (~87 features for one founder → P2 student release is the only goal until 100 weekly users); added FR-88 now strip and FR-89 quiet modes, the two strongest-evidence missing items.
- Business: stay MIT open core; money from a one-time supporter licence, paid art packs with artist revenue share, sponsors, later optional sync; never paywall study features, no ads, no data selling. GTM sheet `docs/business/GTM_PLAN.csv`.
- Pet art: `docs/character/PET_ART_SPEC.md` (format, sizes, rows/emotions, style, standard prompt for the first character).

- 2026-10-23: **Supabase** chosen for the community pets backend (FR-84). Routine reminder now also above the pet. Meeting tasks planned for today with the meeting named on Today (FR-52).
- 2026-10-23: Firecrawl social research saved (`docs/business/SOCIAL_RESEARCH_2026-10-23.md`). Reddit/LinkedIn/Instagram remain unreadable even with Firecrawl (excerpts only); Product Hunt and openpets.dev read in full. Adopted: no-guilt rule (FR-90), earned growth (FR-91), study hours per subject as the student pack's headline.

## 2026-10-23 — Companion principles (owner)
- Never make the user feel guilty (no-guilt rule, FR-92, test-enforced). Pets signal, never demand (attention ladder). No notification spam (FR-96 budget + quiet hours).
- Pet ages from the day you met, remembers the user's and its own birthday, greets once a day (FR-93/94). Year of birth never asked.
- Leaderboards only among friends, opt-in, weekly reset (FR-97) — no public global leaderboard (it recreates guilt/comparison).
- Backup: data export already includes preferences (routine, companion, chosen pet); FR-95 adds pet pack files and an automatic weekly backup to a folder the user picks (works with OneDrive/Drive folders, no server).
- Release: the owner wants to release after this phase. The source version is locked at 0.2.0 (D-VERSION, "leave it") and v0.2.0 already exists, so a new release needs a new version number — **owner to choose** (proposed 0.3.0).

## 2026-10-23 (afternoon)
- Notification limits are **user-adjustable** (Settings → Pet notifications); defaults stay 4/day, 1 h apart, quiet 22:00-08:00.
- Leaderboards: user chooses **Off (default) / Friends only / Everyone** (owner; supersedes friends-only), weekly reset, ranked by study hours not streaks.
- Pet packs can be imported from a ZIP. Owner's Kayadu pack: structurally valid, imports; its README says the frames are placeholder transforms of one image (no real poses yet). If the character is based on a real person, that is the on-hold personal-character feature and needs that person's consent before sharing.
- Testing before release: owner cannot test before a release → releases go out as **drafts/pre-releases for owner testing**; nothing is called Complete until tested.
- Docs: active work is FM-V2 + companion, not M1 (README, ROADMAP, PROJECT_STATUS, CLAUDE.md updated).

## 2026-10-23 (evening)
- Owner approved the pet-visibility fixes → implemented.
- macOS browsers: Arc and Firefox read with private windows excluded; **Safari opt-in** (`tracking.safari`, off by default) because Safari can't report private windows — the owner asked for Safari; the switch keeps the "private windows are skipped" promise true by default. Firefox tabs can't be closed from Loaf (no API without an extension).
- A once-a-minute wake/screen watcher is an accepted exception to ADR-009 (no portable OS event for wake/monitor change).

## 2026-10-23 (night) — Notifications only above the pet
- Owner: "i dont want any notifications inside the dashboard; i want them only above the pet as a bubble." **Supersedes Q1 / FR-41's bottom-right toast stack.** Every `notify.*` message (Task saved, Moved to Bin, errors, Export saved…) is now a pet bubble; the toast library (`sonner`) is removed.
- An action such as **Undo** (or a reminder's **Done**) is offered in the bubble ("· click: Undo"); clicking the pet while it shows runs the action instead of opening the dashboard. Reminder **Snooze** is no longer offered in the app (system notification stays).
- Known consequence (accepted for now, raise again if it bites): when the pet is hidden or turned off, these messages are **not shown anywhere**. Errors are the risky ones. Option for later: show errors inline next to the control that failed.
- Owner: stop building new features; fix the remaining FM-V2 items, then make the path clear and release a version (draft). Student-pack screens to be improved and a "now strip" (FR-88) preview built — previews only, no code.
- Previews done (same night): student pack redesigned and the now strip added as board 4 (`docs/features/FR-88-now-strip.md`). Choices made inside the preview, for the owner to confirm: leaderboard default **Nobody**; classes don't remind by default; suggestions are rule-based on this PC (no AI), at most one a day; the strip is not a notification. **Open:** the four FR-88 questions in that file.

## 2026-10-23 (late night) — Task upgrades, focus timer by the pet
- Owner: build now; the owner decides when to release ("ill give you command when we should release").
- Tasks: multiple **links** shown next to the task (FR-106); **star** for tasks and reminders (FR-107); **chosen days** (FR-108); **repeating** with a tick per day, an evening reminder for unticked ones and a record of days not ticked (FR-109). Spec: `docs/features/FR-106-110-task-upgrades.md`.
- No-guilt applied to FR-109: days not ticked are shown neutrally ("not ticked"), counted as "done N of the last M", reminder once a day through the nudge budget.
- Owner (same night): focus sessions are **saved** (count as study hours later); at the end the pet **cheers and offers a 5-minute break** (click the pet). Not a nudge: you started it, so it doesn't count toward the daily limit.
- Owner: when the pet is hidden, messages appear in the dashboard (refines "notifications only above the pet"). Hover card gets shortcuts Focus, Add note, Sleep, Wake, and tasks are highlighted (FR-111).
- Owner approved the FR-46 rules (time history + completed tasks only; never by default; preview first; completed tasks to a restorable Bin for 30 days; time history deleted). A task Bin was added for this (migration 006).
- FR-44 built as snapped layout presets (width + height) instead of free drag-resize: same outcome, far less to break in a webview. Owner may still ask for drag later.
- Owner: "release 0.3.0" → source version bumped 0.2.0 → 0.3.0 (supersedes D-VERSION "stays 0.2.0"); the release workflow builds a **draft**; the owner tests before publishing.
- **FR-88 now strip replaced by FR-110:** only the focus timer sits above/below the pet; the rest goes on the hover card. New setting to turn the hover card off; then hovering shows the info as a bubble. The four FR-88 open questions are superseded.

## 2026-10-23 (late) — page-mascot audit
- Audited koboyo.com/page-mascot (`docs/competitors/PAGE_MASCOT_AUDIT_2026-10-23.md`): MIT, head-only cursor-watching characters for websites. We may reuse the art with the MIT notice and credit, **except `kamran` (a real person's likeness)**. They don't fit the Codex full-body format; proposed FR-112 "head pet that watches your cursor" — **awaiting owner decision, not built**.
- Release test checklist: `RELEASE_0.3.0_CHECKLIST.md`.

## 2026-10-25 — UI reset requests (preview first)
- Owner: the task editor, Today, Notes, Character and Settings are confusing; "before changing the UI show me UI preview". A preview canvas was published; **no screen is changed until the owner approves it.**
- Fixed without waiting (bugs, not design): Save in the task editor was disabled when nothing changed, so clicking it did nothing; now it always closes. The daily hello could show twice when several checks started together; one check at a time now. File Explorer was counted for the desktop, taskbar, tray and Alt+Tab (all `explorer.exe`); only folder windows count now (Windows, Unverified; macOS Finder not changed).
- Claude's proposals inside the preview (owner to confirm or change):
  - The **next 7 days** go on the Tasks page as a **Week** view (large), not on Today: Today stays about today and links to it. Removed from the Notes tab (with Today strip and Links).
  - **Today** keeps four tiles: Today (overdue shows "N days overdue"), Focus (its own tile, the hover card's Focus opens it), Time today, Routine + Links. Activity and Done this week removed.
  - **Task editor**: one row per property; "When" is one menu (Today, Tomorrow, Next week, Pick a date, Several days, Repeats, Someday) instead of three toggles plus five presets; reminder "N min before" with −/+ and a sound; **focus length per task**; Activity collapsed. Save always enabled.
  - **Settings**: six groups (General, Notifications, Shortcuts, Privacy and tracking, Data, About); every pet setting lives only on Character; each setting in exactly one place. Archive becomes a Notes filter; the MCP "coming soon" item leaves the sidebar until it exists.
  - **Projects** (FR-53, pulled forward from P4): a project has its own tasks and notes, numbered, in the sidebar.
  - **Character**: the current pet first (name, age in days, animation preview); Outfits and Reactions shown as "Later" (FR-49/64, FR-68); default reactions listed so they can become editable.
  - **Music controls** under the pet use the OS media session (Windows SMTC; no browser extension, per the standing rule). macOS has no public API for this; media keys only.
  - **Daily quote**: a bundled list of public-domain quotes, on by default with a switch; no network.
  - **Analytics**: allowed as long as it is computed on this PC from data already stored and nothing is sent anywhere (local-first rule). Sending usage data out would break the rule.
- Open (owner): approve or change the preview; character-creation skill — when, and which image source (Codex image tool or the owner's OpenAI key; we never pay for AI); what exactly the "hello" looks like when it repeats (greeting text, or the wave when the pointer is over the pet).

## 2026-10-26 — Redesign request: task editor, Projects, tile sizes, J1–J3

- **J1 format, J2 skill and prompt, J3 reactions and hello** (owner, 2026-10-26). The "standard format" is the existing Codex/OpenPets V1 pack plus Loaf's pose → row map and reaction defaults (no new file format). Reactions are stored as `ui.reactions` and applied on top of the defaults when an event arrives (read fresh per event).
- **Hello is one text bubble** with the pet's name, then the most useful fact (overdue, else today's count, else the quote). It still comes once a day (notification budget); **Say hello now** is the owner's repeat and does not use up the day's one.
- **Suggestions in the task editor** are plain rules, no AI, and kind (the no-guilt copy test covers them). "Make it due today" and "Plan for today" only fill the form; Save makes them stick.
- **Resizable Today tiles**: three sizes per tile rather than free drag-resize, because the grid snaps to 12 columns (FR-44 decision). Open: free resize if wanted later.
- Renaming a project (added the same day): the name is rewritten on every task and note under it (archived notes excluded).

## 2026-10-26 — Time tracking audit

- The stretch in progress is shown in the totals but never stored until it ends (`UsageService::set_live`, set by the collector). Reason: storing partial checkpoints would split sessions and double count on reload.
- Pages that show usage refetch every 30 s while open (no new background timer in Loaf).
- macOS media keys use `osascript` (JavaScript for Automation) instead of a new crate, to avoid a dependency and a build step; Unverified.

## 2026-10-26 — UI reset batch 2 built (F, G, H, I2)

- **Settings has no sub-tabs or groups** (owner, G1). Pet settings only on the Character page; settings that belong to another tab moved there.
- **Time has two views**: General (unchanged) and Analytics (owner, I2).
- **Media buttons** use the Windows media keys (`SendInput`) only; no browser extension, ever. macOS is not implemented. They show beside the focus timer only while a session runs and only on Windows (Unverified). A standalone media strip or an opt-in setting is **not** built — open question for the owner.
- **Open:** J1–J3 (standard character format, one-prompt character-building skill and prompt using the owner's Codex image tool — Loaf never pays for AI — default changeable reactions, hello repeat as a text bubble). "J3" is not defined in the docs; treated as the character prompt/image pipeline until the owner confirms.

## 2026-10-25 (later) — UI reset batch 1 built
- Owner: delete the preview, then build A4, A6, B1–B7, C1–C5, D1–D4, E1 now; the rest next turn. The preview canvas was deleted.
- Owner: the Tasks page stays as it is, with a **separate Next 7 days tile** (not on Today). Extras in the task editor are **not collapsed**; they sit in neat cards. The quote is **bigger, editable, user quotes can be added**, in an empty place (beside the greeting).
- Claude's choices inside the owner's direction (owner may change):
  - Today's tiles: Today (left, tall), Focus and Daily routine (right), Time today and Links (below). Tiles stay movable.
  - Clicking a task on Today opens the full task editor; the small pop-up editor is removed (one editor, one way).
  - Task reminders are real reminders linked to the task (`task_id`), created at "start − N min"; N steps 0, 5, 10, 15, 20, 30, 45 min, 1, 1.5, 2, 3, 4 h, 1 day. Sound is per reminder, on by default. Windows sound "Reminder", macOS "Glass".
  - Focus length is one remembered value shared by the Focus tile and the task editor (5–240 min, steps of 5), not stored per task.
  - Note font is one choice for all notes (Sans / Serif / Mono). Formatting writes Markdown; Preview shows it.
  - A note's own window shows only that note; the dashboard's daily jobs don't run there.
  - Projects are names on tasks and notes (no separate table); a project exists while something uses it. Meeting action items are left out of Projects (their project field holds the meeting name).
  - Built-in characters: Bolt, Ghosty, Mochi, Pip ship as packs (the bear pack is left out; the drawn bear stays the default). ~3.9 MB added to the installer.
  - Small windows (< 1024 px): icon-only sidebar.
- Built-in quotes: 21 short lines by authors long dead (Aristotle … Theodore Roosevelt); misattributed favourites were left out on purpose.
- Owner: "build a draft release so I can test" → version 0.3.0 → 0.4.0; the release workflow builds a **draft**; the owner tests before publishing.

## 2026-10-26 (later) — Music option, session view, wardrobe

- **Music buttons are opt-in** (`pet.media`, default off). Reason: they press the system media keys, which also reach whatever app is playing; the owner asked for an enable/disable switch. With no focus session the buttons show alone under the pet.
- **Wardrobe works on every character** (owner, 2026-10-26, overriding my first cut that limited it to the bear). On the bear, accessories are SVG inside its head group. On sprite packs (Mochi, Pip, Bolt, Ghosty, imports) Loaf reads each frame's pixels once per sheet, finds the head top, width and neck (thin parts like antennas and sparkles ignored), and draws the same gear scaled onto it, per frame. It is a heuristic: a per-character **Fit** (x, y, size) is saved in `ui.wardrobe.fits` for packs where it sits wrong. If the browser cannot read pixels, a default spot is used. The bear's back-turn views have no accessories (open).
- **Everything is free from day one**: no unlocks, streaks or "earned" gear, in line with the no-guilt rule. One item per place (head, face, neck); an outfit is a preset of those. The party hat on birthdays is a rule, not a schedule engine; the seasonal and weekday schedule (FR-64) stays **Planned**.
- The pet window is a separate window, so after a change the dashboard sends a short "New look!" say; the pet reads `ui.wardrobe` again when it hears it (prefs have no change event).


## 2026-10-27 — Owner's polish list and the time-tracking gaps

- **Wardrobe has no manual fit.** Placement comes from the idle row only; per-frame head width was inflated by raised flippers. Reason: the owner asked for the up/down/left/right/size options to go; a pack that places badly is fixed in the pack, not by the user.
- **Music buttons parked.** Setting `pet.media` and the Rust command stay (default off); the UI is gone. Re-plan in ROADMAP before bringing it back.
- **Confirm every delete/remove/✕** through one shared `ConfirmAction`. Undo toasts remain where they exist.
- **Two tile sizes** (small, large) on Today and Time.
- **Drag/save diagnosis:** the pet's own spot is saved even while the card is open; controls on the card never start a drag.
- **Loaf's own windows are not tracked** (`IGNORED` in `usage.rs`). Reason: planning inside Loaf is not time spent elsewhere, and the owner listed it as a gap. Easy to flip if they want it back.
- **Idle:** the live total stops at the last input once a look finds the person away for a full interval (stored sessions already ended at the last input).
- **Store apps / Mac desktop:** Windows looks inside `ApplicationFrameHost.exe` for the real process; macOS treats Finder with no on-screen window (layer 0) as the desktop. Neither has run on a real machine.
- **Pet never moves by itself (2026-10-27).** Hover and reaction motions are in place (scale, tilt, shake); the window is moved and resized in one step where the OS allows it, and the page is laid out for the new window before it grows and after it shrinks.

## 2026-10-28 — Phase 1 of the owner's polish list

- **Nothing was taken out of the task editor.** The owner asked for fewer visible buttons, not fewer features, so the extras live in one "Advanced options" fold whose summary names what is set.
- **The pet steps aside in full screen** (`pet.hide_fullscreen`, on). Only the window is hidden; the setting is left alone, so the pet returns by itself. Checked every 2 seconds while the pet is wanted, one cheap call per look.
- **The right-click menu is a plain list** (`menu_spec`), decided from the settings alone, so what it offers is tested without a window.
- **Break and water nudges sit outside the daily nudge budget (2026-10-28).** Four a day would swallow a reminder meant to repeat every 50 minutes. They keep quiet hours, and one is shown at a time. They count screen time when app tracking is on, and the clock when it is off, because time away from the desk is already a break.

## 2026-10-28 (later) — Every delete asks

Owner: deleting a link did not ask; anything deleted should ask. Rule: every delete or remove goes through the shared `ConfirmAction` (Delete / Cancel, Cancel focused); no bespoke inline confirms. Reversible resets (wardrobe "Take everything off") are not deletes and do not ask.

## 2026-10-28 (later) — Reactions per character, one special each (D-REACT, answered)

Owner: each pack may have its own reactions, the events are common, the user can pick a specific animation per event; one special reaction per character; keep nine rows. Built as: `loaf.json` (pack default pose per common moment + one special: pose, line, trigger click / tasks / daily), layered Loaf default → pack → user. Because Codex and OpenPets only accept the nine-row sheet, a special reuses a row (pose, words and trigger are the character's own); truly new special art needs a tenth row, which the owner has ruled out for now. Research behind the skill rebuild: `docs/character/RESEARCH_PET_PIPELINES.md`.
