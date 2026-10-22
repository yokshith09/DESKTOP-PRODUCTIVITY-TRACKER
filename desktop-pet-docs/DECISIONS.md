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

- **2026-10-21 (owner), character pipeline (FR-39):** D-UPLOAD **allowed** (personal photos may be uploaded; consent text and local-first processing required). D-FORMAT **approved** as a starting point; the owner says the format will be found by trial and error. D-RIVE **yes, run the one-character trial**. D-CHARS: the owner will supply reference images and Claude designs the built-in characters. Source: `docs/character/CHARACTER_PIPELINE_RESEARCH.md` §10.
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
