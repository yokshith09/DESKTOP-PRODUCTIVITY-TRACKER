# Requested-feature specifications (FR-xx)

> Canonical spec for every feature in [`FEATURE_ROADMAP.md`](../../FEATURE_ROADMAP.md). Roadmap status, milestones and test IDs live there; this file holds the per-feature design. Status vocabulary: [PROJECT_STATUS §2](../../PROJECT_STATUS.md). Nothing here is implemented unless its Status says so; `Unverified` = code exists, no real-OS run.

Every feature has the same 13 sections: 1 metadata · 2 user story · 3 behaviour/workflow · 4 plain-language summary · 5 technical design · 6 tech choices/trade-offs · 7 ordered tasks · 8 tests · 9 edge cases · 10 acceptance/DoD · 11 checklist · 12 documentation updates · 13 dependencies/exclusions.

## FR-01 — Customisable floating pet (appearance, position)

**1 Metadata** — Group: Companion · Status: **Partial** · Milestone: FM-8 · Effort: M · Decision state: U-none; M13 scope · Origin: explicitly requested by owner · Evidence: `src-tauri/src/pet.rs` (always-on-top, size, visibility prefs); `src/features/character/CharacterPage.tsx` (preview only). No appearance editor in code.

**2 User story** — As a user I want to change how my pet looks and where it sits so it feels like mine.

**3 Behaviour / workflow** — Character page lists options (colour, accessory, size); change applies live to the pet window; dragging the pet saves its position per monitor and restores it at launch.

**4 Plain language** — Pick how your pet looks and where it lives; it remembers.

**5 Technical design** — Appearance = JSON in `settings` (`pet.appearance`), validated in core; position keyed by monitor id; pet window reads settings through the existing event bus.

**6 Choices and trade-offs** — Settings JSON (no new table, reversible) vs new table (queryable, not needed). Chosen: settings JSON.

**7 Ordered tasks**

1. Define `PetAppearance` type + validation in core, run `pnpm gen:types`
2. Persist/restore position with off-screen clamping in `pet.rs`
3. Character page controls bound to settings
4. Live-apply via event bus
5. Mock shell support in `src/ipc/mock.ts`

**8 Tests** (IDs in the matrix)

- T-01-01 · Unit · appearance validation rejects unknown values · coverage: missing
- T-01-02 · Component · controls update setting · coverage: missing
- T-01-03 · Manual-Win · position restored after restart, monitor unplugged · coverage: missing

**9 Edge cases** — Saved monitor gone; DPI change; value from newer version; pet dragged off-screen.

**10 Acceptance / DoD** — Appearance and position survive restart on Windows; off-screen position falls back to primary monitor; idle CPU stays <1%. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Define `PetAppearance` type + validation in core, run `pnpm gen:types`
- [ ] Persist/restore position with off-screen clamping in `pet.rs`
- [ ] Character page controls bound to settings
- [ ] Live-apply via event bus
- [ ] Mock shell support in `src/ipc/mock.ts`
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: M0 shell; ROADMAP M13. Excludes: Photo/artwork pets (FR-02), packs (FR-03).

---

## FR-02 — User photos / supported artwork as pets

**1 Metadata** — Group: Companion · Status: **Planned** · Milestone: FM-8 · Effort: L · Decision state: Open: U-new-1 (art format, content rules) · Origin: explicitly requested by owner · Evidence: No image import code (grep for photo/upload in `src/features` finds none).

**2 User story** — As a user I want my own picture or artwork to be my pet.

**3 Behaviour / workflow** — Choose an image (PNG/WebP/SVG), crop/mask, preview, set as pet; stored under app data, referenced by path+hash.

**4 Plain language** — Use your own picture as your pet.

**5 Technical design** — Import via `tauri-plugin-dialog` (already present); copy into app data dir; validate magic bytes, max 2 MB/1024px, re-encode to strip metadata; pet window renders via asset protocol.

**6 Choices and trade-offs** — Re-encode (safe, loses animation) vs raw copy (keeps animation, malicious-file risk). Chosen: re-encode; animated formats later.

**7 Ordered tasks**

1. Decide supported formats (owner)
2. Import command with validation + re-encode
3. Crop/mask UI
4. Render in pet window
5. Delete on pet removal

**8 Tests** (IDs in the matrix)

- T-02-01 · Unit · rejects non-image / oversize / polyglot · coverage: missing
- T-02-02 · Component · crop UI · coverage: missing
- T-02-03 · Manual-Win · large photo, animated GIF · coverage: missing

**9 Edge cases** — EXIF location data; 100 MB file; corrupt file; file deleted later; non-square image.

**10 Acceptance / DoD** — Valid image becomes the pet; invalid files rejected with message; EXIF stripped (test asserts); app data size bounded. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Decide supported formats (owner)
- [ ] Import command with validation + re-encode
- [ ] Crop/mask UI
- [ ] Render in pet window
- [ ] Delete on pet removal
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-01. Excludes: Sharing (FR-31), AI-generated art.

---

## FR-03 — Character packs: install, project-aware behaviour

**1 Metadata** — Group: Companion · Status: **Planned** · Milestone: FM-8 · Effort: XL · Decision state: Open: U-new-2 (pack format, executable content), M13 scope · Origin: explicitly requested by owner · Evidence: ROADMAP M13 outline only; no pack format.

**2 User story** — As a user I want to install a character pack and have it react to my project.

**3 Behaviour / workflow** — Install from a local `.loafpack` file; manifest lists art, animations, optional reaction rules; project-aware = pet reacts to active Project Space type.

**4 Plain language** — Add new characters from a file; they can react to what you're working on.

**5 Technical design** — Pack = zip with `manifest.json` (schema-versioned) + assets, **no code**; installed under app data; verified by sha256 listed in manifest; reactions are declarative rules.

**6 Choices and trade-offs** — Declarative packs (safe, limited) vs scripted packs (powerful, arbitrary code). Chosen: declarative.

**7 Ordered tasks**

1. Manifest schema + validator in core
2. Safe unzip (zip-slip, size caps)
3. Install/uninstall/list commands
4. Character page pack list
5. Reaction rule engine tied to FR-06 project type

**8 Tests** (IDs in the matrix)

- T-03-01 · Unit · zip-slip, oversize, bad manifest · coverage: missing
- T-03-02 · Integration · install/uninstall roundtrip · coverage: missing
- T-03-03 · Manual-Win · pack with 50 MB assets · coverage: missing

**9 Edge cases** — Duplicate pack id; version upgrade; missing asset; removing the active pack.

**10 Acceptance / DoD** — Hostile packs (path traversal, >limit) rejected by tests; removing active pack falls back to default. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Manifest schema + validator in core
- [ ] Safe unzip (zip-slip, size caps)
- [ ] Install/uninstall/list commands
- [ ] Character page pack list
- [ ] Reaction rule engine tied to FR-06 project type
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-01, FR-02, FR-06 (project-aware). Excludes: Online sharing (FR-31), scripted packs.

---

## FR-04 — Referral codes and points (unlock after 3 qualifying referrals)

**1 Metadata** — Group: Companion · Status: **Blocked** · Milestone: FM-10 · Effort: XL · Decision state: Blocked: backend (U-new-3) · Origin: explicitly requested by owner · Evidence: No network code, no server. `reqwest`/HTTP client absent from both Cargo.toml files.

**2 User story** — As a user I want to invite friends and unlock rewards when 3 of them install and really use Loaf.

**3 Behaviour / workflow** — Each install has a referral code; a referral counts only after install + first-use + N active days; at 3 qualifying, a reward unlocks.

**4 Plain language** — Invite three friends who actually use Loaf and unlock a reward.

**5 Technical design** — Server-side ledger (code, install id, events); client sends signed, consented events; reward unlocked by signed token verified offline.

**6 Choices and trade-offs** — Server ledger (only way to stop fraud) vs client-only (trivially forgeable). Chosen: server; therefore conflicts with local-first and needs owner approval.

**7 Ordered tasks**

1. Owner decision on backend
2. Threat model
3. Ledger schema + API
4. Client opt-in + code UI
5. Signed reward token verify
6. Abuse rules (FR-33)

**8 Tests** (IDs in the matrix)

- T-04-01 · Unit · qualifying rules table · coverage: missing
- T-04-02 · Integration · fake-install replay rejected · coverage: missing
- T-04-03 · Manual · two-machine referral · coverage: missing

**9 Edge cases** — Self-referral; VM farms; reinstall; offline unlock; clock tampering.

**10 Acceptance / DoD** — Only referrals meeting install+first-use+active-days count; duplicates by install id rejected; user can opt out and delete data. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Owner decision on backend
- [ ] Threat model
- [ ] Ledger schema + API
- [ ] Client opt-in + code UI
- [ ] Signed reward token verify
- [ ] Abuse rules (FR-33)
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FM-9 backend, FR-32 consent, FR-33. Excludes: Cash value, third-party ad networks.

---

## FR-05 — Focus Sessions with Pomodoro

**1 Metadata** — Group: Productivity · Status: **Planned** · Milestone: FM-4 · Effort: M · Decision state: ROADMAP M8; U-none · Origin: explicitly requested by owner · Evidence: `src/features` has no focus module; scheduler exists (`loaf-core/src/scheduler.rs`).

**2 User story** — As a student I want timed focus/break cycles with my pet.

**3 Behaviour / workflow** — Start 25/5 (configurable) session optionally attached to a Project Space; pet shows state; end triggers break reminder; session logged.

**4 Plain language** — A timer for focused work and breaks, tied to a project.

**5 Technical design** — `focus_sessions` table (migration 004); timer driven by scheduler events (no polling); state survives restart by storing `started_at` and recomputing.

**6 Choices and trade-offs** — Store start time (restart-safe) vs tick counter (drifts). Chosen: start time.

**7 Ordered tasks**

1. Migration + core service
2. Scheduler events for end/break
3. Timer UI + pet states
4. Session history in Time tab
5. Link to FR-06

**8 Tests** (IDs in the matrix)

- T-05-01 · Unit · restart mid-session recomputes remaining · coverage: missing
- T-05-02 · Component · timer UI · coverage: missing
- T-05-03 · Manual-Win · sleep/resume during session · coverage: missing

**9 Edge cases** — Sleep/hibernate; clock change; two sessions; app quit mid-session.

**10 Acceptance / DoD** — Remaining time correct after restart and sleep (test); session logged once; idle CPU <1% while running. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Migration + core service
- [ ] Scheduler events for end/break
- [ ] Timer UI + pet states
- [ ] Session history in Time tab
- [ ] Link to FR-06
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FM-3 (project link optional). Excludes: Blocking apps (FR-08).

---

## FR-06 — Project Spaces (notes, tasks, files, resources, links, context, setup)

**1 Metadata** — Group: Productivity · Status: **Planned** · Milestone: FM-3 · Effort: XL · Decision state: Open: U-new-4 (type taxonomy) · Origin: explicitly requested by owner · Evidence: Notes/tasks/links exist separately (`notes.rs`, `tasks.rs`, `links.rs`); no project entity.

**2 User story** — As a user I want one space per project that holds everything for it.

**3 Behaviour / workflow** — Create project (student/developer/personal), attach notes, tasks, links, files (paths), resources, free-text context and setup steps; project switcher; later types (researcher, freelancer, general) added by data, not code.

**4 Plain language** — One place per project for everything about it.

**5 Technical design** — `projects` table + nullable `project_id` on notes/tasks/links (migration 004, additive); project type is a string enum validated in core; files stored as references, never copied.

**6 Choices and trade-offs** — Additive FK (no data rewrite, reversible) vs new join tables. Chosen: nullable FK.

**7 Ordered tasks**

1. Migration 004 + backup-before-migrate test
2. Core `projects` service
3. Link existing entities
4. Project UI + switcher
5. Context + setup instruction fields
6. Export/delete coverage (F0-11)

**8 Tests** (IDs in the matrix)

- T-06-01 · Unit · migration keeps existing rows · coverage: missing
- T-06-02 · Integration · delete project keeps notes (unlinked) · coverage: missing
- T-06-03 · Component · switcher · coverage: missing

**9 Edge cases** — Deleting a project with tasks; file path moved; 10k notes; type added in newer version.

**10 Acceptance / DoD** — Existing notes/tasks unchanged after migration (test on seeded DB); project delete never deletes user notes without explicit choice. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Migration 004 + backup-before-migrate test
- [ ] Core `projects` service
- [ ] Link existing entities
- [ ] Project UI + switcher
- [ ] Context + setup instruction fields
- [ ] Export/delete coverage (F0-11)
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: M1 data model. Excludes: Credentials content (FR-13 stores references only), sharing.

---

## FR-07 — Prompt Improvement

**1 Metadata** — Group: Productivity · Status: **Blocked** · Milestone: FM-5 · Effort: M · Decision state: Blocked: U12 (AI provider) · Origin: explicitly requested by owner · Evidence: ROADMAP M5 blocked on U12.

**2 User story** — As a user I want a rough prompt rewritten more clearly.

**3 Behaviour / workflow** — Select text/clipboard, press hotkey, see improved prompt, accept or copy.

**4 Plain language** — Turns a rough prompt into a clearer one.

**5 Technical design** — Calls AI router (FR-28/29); prompt templates versioned in core; output never auto-sent.

**6 Choices and trade-offs** — Router abstraction vs direct provider. Chosen: router.

**7 Ordered tasks**

1. Resolve U12
2. Router interface
3. Template + hotkey
4. Result panel

**8 Tests** (IDs in the matrix)

- T-07-01 · Unit · template rendering · coverage: missing
- T-07-02 · Integration · fake provider · coverage: missing

**9 Edge cases** — Empty input; huge input; provider offline; secrets in prompt.

**10 Acceptance / DoD** — Works fully offline with local model; no text leaves machine unless cloud enabled. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Resolve U12
- [ ] Router interface
- [ ] Template + hotkey
- [ ] Result panel
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-28. Excludes: Auto-submit to other apps.

---

## FR-08 — Tab Tantrum (pet reacts to tab overload)

**1 Metadata** — Group: Productivity · Status: **Blocked** · Milestone: FM-4 · Effort: L · Decision state: Blocked: no-extension decision · Origin: explicitly requested by owner · Evidence: `src-tauri/src/tabs.rs` reads open tabs without extension; Windows: showing tab only (PROJECT_STATUS §4.8).

**2 User story** — As a user I want my pet to notice when I have too many tabs.

**3 Behaviour / workflow** — Above a threshold the pet reacts; clicking offers (user-approved) tab list.

**4 Plain language** — Your pet complains when you open too many tabs.

**5 Technical design** — Count source = existing tab reader; Windows can see only the visible tab, so count is unreliable there.

**6 Choices and trade-offs** — Tab count via UI Automation (partial) vs extension (rejected by owner). Chosen: reaction on available data, label as approximate.

**7 Ordered tasks**

1. Owner decision on accuracy
2. Threshold setting
3. Pet reaction
4. Opt-in toggle

**8 Tests** (IDs in the matrix)

- T-08-01 · Unit · threshold logic · coverage: missing
- T-08-02 · Manual-Win · count accuracy vs real tabs · coverage: missing

**9 Edge cases** — Private windows; multiple browsers; fullscreen (FR-26).

**10 Acceptance / DoD** — Count labelled approximate where source is partial; reaction off by default. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Owner decision on accuracy
- [ ] Threshold setting
- [ ] Pet reaction
- [ ] Opt-in toggle
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: M3 tabs, FR-26. Excludes: Closing tabs automatically.

---

## FR-09 — One-Click Workspace Launcher

**1 Metadata** — Group: Productivity · Status: **Planned** · Milestone: FM-3 · Effort: M · Decision state: Open: U-new-5 (what may be launched) · Origin: explicitly requested by owner · Evidence: `tauri-plugin-opener` present; no launcher.

**2 User story** — As a developer I want one click to open my project's apps, folders and URLs.

**3 Behaviour / workflow** — Project defines launch items; button opens each; failures listed, never silent.

**4 Plain language** — Open everything for a project with one click.

**5 Technical design** — Launch list stored in project; only paths/URLs the user added; executed via opener plugin; no shell strings.

**6 Choices and trade-offs** — Opener plugin (no shell injection) vs shell exec. Chosen: opener only.

**7 Ordered tasks**

1. Launch item model
2. Validation (no shell metacharacters)
3. Run + report results
4. UI

**8 Tests** (IDs in the matrix)

- T-09-01 · Unit · rejects shell-injection strings · coverage: missing
- T-09-02 · Manual-Win · launch 5 items · coverage: missing

**9 Edge cases** — Missing app; path with spaces; URL with scheme javascript:.

**10 Acceptance / DoD** — Only http(s)/file paths accepted; per-item failure shown. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Launch item model
- [ ] Validation (no shell metacharacters)
- [ ] Run + report results
- [ ] UI
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-06. Excludes: Arbitrary command execution.

---

## FR-10 — Group Project Tracker and team leaderboards

**1 Metadata** — Group: Productivity · Status: **Blocked** · Milestone: FM-10 · Effort: XL · Decision state: Blocked: backend (U-new-3), privacy of ranking · Origin: explicitly requested by owner · Evidence: No multi-user code.

**2 User story** — As a student group I want to see shared progress.

**3 Behaviour / workflow** — Group members share task status (opt-in); leaderboard shows agreed metrics only.

**4 Plain language** — See your team's progress together.

**5 Technical design** — Requires shared store; metrics are explicit user-chosen aggregates, never raw activity.

**6 Choices and trade-offs** — Hosted server vs peer export files. Chosen: undecided; export-file MVP keeps local-first.

**7 Ordered tasks**

1. Owner decision
2. Privacy design
3. Sync model
4. UI

**8 Tests** (IDs in the matrix)

- T-10-01 · Integration · conflict merge · coverage: missing

**9 Edge cases** — Member leaves; conflicting edits; ranking harms morale.

**10 Acceptance / DoD** — No metric shared without per-field consent. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Owner decision
- [ ] Privacy design
- [ ] Sync model
- [ ] UI
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FM-9, FR-06. Excludes: Raw activity sharing.

---

## FR-11 — Student Project Organizer

**1 Metadata** — Group: Student & developer · Status: **Planned** · Milestone: FM-3 · Effort: M · Decision state: none · Origin: explicitly requested by owner · Evidence: Depends on FR-06; tasks/calendar exist.

**2 User story** — As a student I want deadlines, milestones and files per assignment.

**3 Behaviour / workflow** — Student project type adds deadline, course, milestones; shows on calendar.

**4 Plain language** — Keep assignments and deadlines organised.

**5 Technical design** — Type-specific fields in `projects.meta` JSON; reuses calendar/reminders.

**6 Choices and trade-offs** — JSON meta (flexible) vs columns. Chosen: JSON, validated per type.

**7 Ordered tasks**

1. Student type schema
2. Deadline→reminder
3. Calendar integration
4. UI

**8 Tests** (IDs in the matrix)

- T-11-01 · Unit · meta validation · coverage: missing
- T-11-02 · Component · form · coverage: missing

**9 Edge cases** — Past deadline; no course; timezone.

**10 Acceptance / DoD** — Deadline creates one reminder; editing updates it. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Student type schema
- [ ] Deadline→reminder
- [ ] Calendar integration
- [ ] UI
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-06. Excludes: LMS integration.

---

## FR-12 — Study Companion

**1 Metadata** — Group: Student & developer · Status: **Planned** · Milestone: FM-5 · Effort: L · Decision state: Depends on U12 · Origin: explicitly requested by owner · Evidence: None.

**2 User story** — As a student I want quizzes/summaries from my notes.

**3 Behaviour / workflow** — Select notes → local model produces questions; answers tracked.

**4 Plain language** — Quiz yourself on your own notes.

**5 Technical design** — Uses AI router; results stored per project.

**6 Choices and trade-offs** — Local-first model; cloud opt-in.

**7 Ordered tasks**

1. Router
2. Prompt templates
3. Quiz UI
4. Result storage

**8 Tests** (IDs in the matrix)

- T-12-01 · Integration · fake provider quiz · coverage: missing

**9 Edge cases** — Tiny notes; hallucinated answers.

**10 Acceptance / DoD** — Questions cite note text; offline works with local model. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Router
- [ ] Prompt templates
- [ ] Quiz UI
- [ ] Result storage
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-28, FR-06. Excludes: Grading for credit.

---

## FR-13 — Secure Credential Access (references only)

**1 Metadata** — Group: Student & developer · Status: **Planned** · Milestone: FM-6 · Effort: XL · Decision state: Open: U-new-6 (storage policy) · Origin: explicitly requested by owner · Evidence: No keyring dependency. `tauri-plugin-*` list has none for secrets.

**2 User story** — As a developer I want project API keys available without pasting them in notes.

**3 Behaviour / workflow** — Project stores references (label, purpose, service); secret value lives in Windows Credential Manager / macOS Keychain; copy-to-clipboard auto-clears; env-var template renders names only; rotation reminders.

**4 Plain language** — Your keys stay in the system keychain; Loaf only remembers which key is for what.

**5 Technical design** — `keyring` crate behind a trait in the shell (core stays tauri/OS-free); SQLite stores label+service+key id only; clipboard cleared after 30 s; rotation uses reminders.

**6 Choices and trade-offs** — OS keychain (best isolation) vs own vault (rejected: building a password manager). Integrate with existing managers later.

**7 Ordered tasks**

1. Owner policy decision
2. Threat model
3. Reference table (migration)
4. Keychain trait + Win/Mac impl
5. Clipboard auto-clear
6. Env template renderer
7. Rotation reminders
8. Test that raw secrets never reach DB/logs

**8 Tests** (IDs in the matrix)

- T-13-01 · Unit · DB/log dump contains no secret (canary value) · coverage: missing
- T-13-02 · Unit · clipboard clear timing · coverage: missing
- T-13-03 · Manual-Win · Credential Manager entry created/removed · coverage: missing
- T-13-04 · Manual-Mac · Keychain prompts · coverage: missing

**9 Edge cases** — Keychain locked; entry deleted outside app; clipboard overwritten by user; export/import (must exclude secrets).

**10 Acceptance / DoD** — Canary secret never in SQLite, logs, export or notes (automated); clipboard cleared in 30±2 s; Win/Mac manual verified before Complete. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Owner policy decision
- [ ] Threat model
- [ ] Reference table (migration)
- [ ] Keychain trait + Win/Mac impl
- [ ] Clipboard auto-clear
- [ ] Env template renderer
- [ ] Rotation reminders
- [ ] Test that raw secrets never reach DB/logs
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-06, reminders. Excludes: Own password manager, cloud sync of secrets.

---

## FR-14 — Project Setup Assistant

**1 Metadata** — Group: Student & developer · Status: **Planned** · Milestone: FM-3 · Effort: M · Decision state: none · Origin: explicitly requested by owner · Evidence: Needs FR-06 setup instructions.

**2 User story** — As a developer I want a checklist to set a project up on a new machine.

**3 Behaviour / workflow** — Project setup steps shown as checklist, optional launcher actions.

**4 Plain language** — A step-by-step setup list per project.

**5 Technical design** — Ordered steps in project; checkbox state stored; optional AI suggestions later.

**6 Choices and trade-offs** — Manual first, AI later.

**7 Ordered tasks**

1. Steps model
2. Checklist UI
3. Launcher link (FR-09)

**8 Tests** (IDs in the matrix)

- T-14-01 · Component · check/uncheck persists · coverage: missing

**9 Edge cases** — Reordering; stale commands.

**10 Acceptance / DoD** — State persists; nothing executes without click. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Steps model
- [ ] Checklist UI
- [ ] Launcher link (FR-09)
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-06, FR-09. Excludes: Auto-running commands.

---

## FR-15 — Presentation Practice Companion

**1 Metadata** — Group: Student & developer · Status: **Planned** · Milestone: FM-5 · Effort: L · Decision state: Voice stack open (M9) · Origin: explicitly requested by owner · Evidence: None.

**2 User story** — As a student I want to rehearse a talk with timing feedback.

**3 Behaviour / workflow** — Start rehearsal with target length; timer; optional speech pace via local STT.

**4 Plain language** — Practice your talk with a timer and pace feedback.

**5 Technical design** — Timer first (no mic). Mic/STT only after M9 decisions.

**6 Choices and trade-offs** — Ship timer-only MVP.

**7 Ordered tasks**

1. Timer MVP
2. Slide notes import
3. Pace feedback (after M9)

**8 Tests** (IDs in the matrix)

- T-15-01 · Component · timer · coverage: missing

**9 Edge cases** — Mic denied.

**10 Acceptance / DoD** — MVP needs no microphone. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Timer MVP
- [ ] Slide notes import
- [ ] Pace feedback (after M9)
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-05. Excludes: Video recording.

---

## FR-16 — Coding Error Translator

**1 Metadata** — Group: Student & developer · Status: **Planned** · Milestone: FM-5 · Effort: M · Decision state: Depends on U12 · Origin: explicitly requested by owner · Evidence: None.

**2 User story** — As a beginner I want error messages explained plainly.

**3 Behaviour / workflow** — Paste/select error → plain explanation + likely fix; local model.

**4 Plain language** — Explains confusing error messages.

**5 Technical design** — AI router; static rules for common errors first (no AI).

**6 Choices and trade-offs** — Rule table first (offline, testable).

**7 Ordered tasks**

1. Rule table
2. Router fallback
3. UI

**8 Tests** (IDs in the matrix)

- T-16-01 · Unit · rules map known errors · coverage: missing

**9 Edge cases** — Secrets in stack trace (redact).

**10 Acceptance / DoD** — Common errors answered offline. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Rule table
- [ ] Router fallback
- [ ] UI
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-28. Excludes: Auto-fix code.

---

## FR-17 — QR Code Scanner (image, camera, screen)

**1 Metadata** — Group: Utilities · Status: **Planned** · Milestone: FM-7 · Effort: L · Decision state: Camera/screen permission policy · Origin: explicitly requested by owner · Evidence: None; no image/QR dependency.

**2 User story** — As a user I want to scan a QR from a file, webcam or part of my screen.

**3 Behaviour / workflow** — Image/screen first; camera behind explicit permission; result shown, never auto-opened.

**4 Plain language** — Read QR codes from pictures, screen or camera.

**5 Technical design** — `rqrr`/`rxing` crate in shell; screen capture one-shot on click; no stored frames.

**6 Choices and trade-offs** — Image+screen MVP, camera later.

**7 Ordered tasks**

1. Decoder + fixtures
2. Image import
3. Screen region capture
4. Camera (later)
5. Result safety (show URL, confirm)

**8 Tests** (IDs in the matrix)

- T-17-01 · Unit · decode fixtures incl. damaged · coverage: missing
- T-17-02 · Manual-Mac · screen-recording permission · coverage: missing

**9 Edge cases** — Malicious URL; multiple codes; HiDPI.

**10 Acceptance / DoD** — Never opens link without confirm; no frames written to disk. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Decoder + fixtures
- [ ] Image import
- [ ] Screen region capture
- [ ] Camera (later)
- [ ] Result safety (show URL, confirm)
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: none. Excludes: Always-on scanning.

---

## FR-18 — Notification Triage

**1 Metadata** — Group: Utilities · Status: **Planned** · Milestone: FM-7 · Effort: XL · Decision state: OS notification access varies; relates to AN-xx · Origin: explicitly requested by owner · Evidence: `notify.rs` sends only; AN spec covers AI-assistant notices.

**2 User story** — As a user I want fewer, prioritised interruptions.

**3 Behaviour / workflow** — Loaf groups its own notifications by priority and quiet hours; reading other apps' notifications only if OS allows and user opts in.

**4 Plain language** — Calmer, prioritised notifications.

**5 Technical design** — Phase 1 = Loaf's own notices (AN-xx). Reading other apps needs per-OS APIs (Windows listener, macOS none stable).

**6 Choices and trade-offs** — Scope to own notices first; cross-app is research.

**7 Ordered tasks**

1. Priority model
2. Quiet hours
3. AN integration
4. Research spike on OS APIs

**8 Tests** (IDs in the matrix)

- T-18-01 · Unit · priority/quiet-hour rules · coverage: missing

**9 Edge cases** — DND; fullscreen.

**10 Acceptance / DoD** — Own notices follow quiet hours. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Priority model
- [ ] Quiet hours
- [ ] AN integration
- [ ] Research spike on OS APIs
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: AN-xx. Excludes: Reading private notification contents without opt-in.

---

## FR-19 — Website and app activity tracking

**1 Metadata** — Group: Utilities · Status: **Unverified** · Milestone: FM-0 · Effort: S (verify) · Decision state: U16 option d decided · Origin: explicitly requested by owner · Evidence: `loaf-core/src/usage*`, `src-tauri/src/tracking.rs`, `sites.rs`; migration 003; core tests pass.

**2 User story** — As a user I want to see where my time goes.

**3 Behaviour / workflow** — Collector records active app and browser site time; per-day totals.

**4 Plain language** — Shows time per app and website.

**5 Technical design** — Event-driven collector, single DB writer.

**6 Choices and trade-offs** — No extension, no request tracking.

**7 Ordered tasks**

1. Owner runs G1 / RELEASE_0.2.0_TEST
2. Fix defects
3. Mark Complete per OS

**8 Tests** (IDs in the matrix)

- T-19-01 · Unit · usage aggregation · coverage: existing
- T-19-02 · Manual-Win · real browsing · coverage: missing
- T-19-03 · Manual-Mac · real browsing · coverage: missing

**9 Edge cases** — See PROJECT_STATUS §4.8 parity gaps.

**10 Acceptance / DoD** — Windows checklist passes; mac stays Unverified until a Mac run. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Owner runs G1 / RELEASE_0.2.0_TEST
- [ ] Fix defects
- [ ] Mark Complete per OS
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: none. Excludes: Extension, request tracking.

---

## FR-20 — GitHub-style Time-tab visualisations

**1 Metadata** — Group: Utilities · Status: **Partial** · Milestone: FM-1 · Effort: M · Decision state: none · Origin: explicitly requested by owner · Evidence: `src/features/time`, `src/features/charts`, `calendar`; heatmap status to confirm in code.

**2 User story** — As a user I want a contribution-style heatmap of my activity.

**3 Behaviour / workflow** — Year grid coloured by daily active time; click day for detail.

**4 Plain language** — A year-at-a-glance activity grid.

**5 Technical design** — Pure SVG/CSS grid from daily totals query.

**6 Choices and trade-offs** — Own SVG vs chart lib. Chosen: SVG (no dependency).

**7 Ordered tasks**

1. Audit existing charts
2. Heatmap component
3. Day detail
4. a11y labels

**8 Tests** (IDs in the matrix)

- T-20-01 · Component · grid renders N days, empty state · coverage: missing

**9 Edge cases** — Leap year; timezone; no data.

**10 Acceptance / DoD** — Keyboard and screen-reader labels; renders 365 cells <50 ms. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Audit existing charts
- [ ] Heatmap component
- [ ] Day detail
- [ ] a11y labels
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-19. Excludes: Social sharing.

---

## FR-21 — GitHub commit tracker

**1 Metadata** — Group: Utilities · Status: **Planned** · Milestone: FM-7 · Effort: L · Decision state: Open: U-new-7 (token vs local git) · Origin: explicitly requested by owner · Evidence: None.

**2 User story** — As a developer I want my commits counted in my activity.

**3 Behaviour / workflow** — Read local git repos chosen by user (no token); count commits per day.

**4 Plain language** — Counts your commits.

**5 Technical design** — Local `git log` via `gix`/process on user-chosen folders; GitHub API only if user supplies token (stored via FR-13).

**6 Choices and trade-offs** — Local git first (offline, no secrets).

**7 Ordered tasks**

1. Repo picker
2. Commit scan
3. Cache
4. Heatmap feed

**8 Tests** (IDs in the matrix)

- T-21-01 · Integration · fixture repo · coverage: missing

**9 Edge cases** — Huge repos; rebased history; author email mismatch.

**10 Acceptance / DoD** — Fixture repo counts match. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Repo picker
- [ ] Commit scan
- [ ] Cache
- [ ] Heatmap feed
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-20, FR-13 for token. Excludes: Reading private repo contents.

---

## FR-22 — Resizable, reorderable dashboard tiles with auto layout

**1 Metadata** — Group: Utilities · Status: **Partial** · Milestone: FM-1 · Effort: L · Decision state: none · Origin: explicitly requested by owner · Evidence: `src/features/overview/MovableTiles.tsx`: reorder via @dnd-kit, order saved as pref `ui.overview_order`; spans are fixed constants; no resize.

**2 User story** — As a user I want to resize and arrange tiles.

**3 Behaviour / workflow** — Drag handle to reorder (exists); resize handle snaps to grid; Auto-layout button restores default.

**4 Plain language** — Move and resize dashboard tiles.

**5 Technical design** — Add `ui.overview_layout` {id:{w,h}} pref next to order; grid snap; validation drops unknown ids.

**6 Choices and trade-offs** — dnd-kit + own resize (no new dep) vs react-grid-layout (heavy). Chosen: own.

**7 Ordered tasks**

1. Layout pref + clean function
2. Resize handle
3. Auto-layout
4. Tests

**8 Tests** (IDs in the matrix)

- T-22-01 · Component · order/size clean + persist · coverage: existing (order only)
- T-22-02 · Component · resize persists · coverage: missing

**9 Edge cases** — Unknown ids; small window; tile added in new version.

**10 Acceptance / DoD** — Resize and order persist; Auto resets; keyboard accessible. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Layout pref + clean function
- [ ] Resize handle
- [ ] Auto-layout
- [ ] Tests
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: none. Excludes: Free-form overlap.

---

## FR-23 — Tile order kept on minimise/restore; no rearranging on window resize

**1 Metadata** — Group: Utilities · Status: **Unverified** · Milestone: FM-1 · Effort: S · Decision state: none · Origin: explicitly requested by owner · Evidence: Order is a persisted pref (`useTileOrder`), so minimise/restore should not change it; CSS spans are fixed so window resize reflows only. No test for either.

**2 User story** — As a user I don't want my layout to shuffle.

**3 Behaviour / workflow** — Order identical after minimise/restore and window resize.

**4 Plain language** — Your layout stays put.

**5 Technical design** — Add regression tests; no code change expected.

**6 Choices and trade-offs** — Test first, then decide.

**7 Ordered tasks**

1. Test: remount keeps order
2. Test: viewport change keeps order
3. Manual-Win check

**8 Tests** (IDs in the matrix)

- T-23-01 · Component · order stable across unmount/mount · coverage: missing
- T-23-02 · Manual-Win · minimise/restore · coverage: missing

**9 Edge cases** — Reduced widths at lg breakpoint.

**10 Acceptance / DoD** — Tests pass; Windows check done before Complete. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Test: remount keeps order
- [ ] Test: viewport change keeps order
- [ ] Manual-Win check
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-22. Excludes: none.

---

## FR-24 — Correct separation of website and app activity

**1 Metadata** — Group: Utilities · Status: **Unverified** · Milestone: FM-1 · Effort: S · Decision state: none · Origin: explicitly requested by owner · Evidence: Separate lists exist in Time tab (commit bd2d6f5); browsers counted as app AND site? not confirmed.

**2 User story** — As a user I want a browser's time not double counted as both app and website.

**3 Behaviour / workflow** — Browser focus time is shown as websites; apps list excludes or flags browsers.

**4 Plain language** — Apps and websites don't mix.

**5 Technical design** — Audit aggregation query; add test with browser + site fixture.

**6 Choices and trade-offs** — Audit before change.

**7 Ordered tasks**

1. Read usage aggregation
2. Fixture test
3. Fix if double counted

**8 Tests** (IDs in the matrix)

- T-24-01 · Unit · browser time not counted twice · coverage: missing

**9 Edge cases** — Unknown browser; private window.

**10 Acceptance / DoD** — Test proves no double counting or documents the rule. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Read usage aggregation
- [ ] Fixture test
- [ ] Fix if double counted
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-19. Excludes: none.

---

## FR-25 — Time tab layout fix

**1 Metadata** — Group: Utilities · Status: **Planned** · Milestone: FM-1 · Effort: S · Decision state: Needs owner screenshot of the defect · Origin: explicitly requested by owner · Evidence: Defect not reproduced in code review; polish done in bd2d6f5.

**2 User story** — As a user I want the Time tab laid out cleanly.

**3 Behaviour / workflow** — Defined by owner screenshot.

**4 Plain language** — Fix how the Time tab looks.

**5 Technical design** — Reproduce at 3 window widths.

**6 Choices and trade-offs** — n/a

**7 Ordered tasks**

1. Get screenshot / repro
2. Fix
3. Visual check

**8 Tests** (IDs in the matrix)

- T-25-01 · Component · no overflow at widths · coverage: missing
- T-25-02 · Manual-Win · visual · coverage: missing

**9 Edge cases** — Small windows.

**10 Acceptance / DoD** — Owner confirms. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Get screenshot / repro
- [ ] Fix
- [ ] Visual check
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: none. Excludes: Redesign.

---

## FR-26 — Tab Tantrum, Project Spaces and Focus in full-screen scenarios

**1 Metadata** — Group: Utilities · Status: **Planned** · Milestone: FM-4 · Effort: L · Decision state: Open: U-new-8 · Origin: explicitly requested by owner · Evidence: Pet uses always-on-top (`pet.rs:435`); full-screen behaviour untested.

**2 User story** — As a user I want pet and focus cues to work while another app is full-screen.

**3 Behaviour / workflow** — Pet stays visible above full-screen windows where the OS allows, or stays hidden by user rule.

**4 Plain language** — Works when a game or video is full-screen.

**5 Technical design** — Windows borderless full-screen vs exclusive differ; macOS Spaces need window level flags.

**6 Choices and trade-offs** — Per-OS spike first.

**7 Ordered tasks**

1. Spike per OS
2. Setting 'hide in full-screen'
3. Tests of the setting logic

**8 Tests** (IDs in the matrix)

- T-26-01 · Manual-Win · video/browser full-screen · coverage: missing
- T-26-02 · Manual-Mac · Spaces · coverage: missing

**9 Edge cases** — Exclusive-mode games.

**10 Acceptance / DoD** — Documented behaviour per OS, verified on Windows. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Spike per OS
- [ ] Setting 'hide in full-screen'
- [ ] Tests of the setting logic
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-05, FR-06, FR-08. Excludes: Overlay on exclusive-mode games.

---

## FR-27 — Clean shutdown/restart and state preservation

**1 Metadata** — Group: Utilities · Status: **Partial** · Milestone: FM-1 · Effort: M · Decision state: none · Origin: explicitly requested by owner · Evidence: Tray/lifecycle F0-08, single DB writer, DB backups (`db.rs` damaged-database test), window-state plugin.

**2 User story** — As a user I want nothing lost when I quit or the PC restarts.

**3 Behaviour / workflow** — Quit flushes writer; restart restores window/state.

**4 Plain language** — Closing and reopening loses nothing.

**5 Technical design** — Verify flush on exit and crash recovery.

**6 Choices and trade-offs** — n/a

**7 Ordered tasks**

1. Kill-during-write test
2. Restart state checklist

**8 Tests** (IDs in the matrix)

- T-27-01 · Integration · writer flush on shutdown · coverage: existing (partial)
- T-27-02 · Manual-Win · kill process then relaunch · coverage: missing

**9 Edge cases** — Power loss during write.

**10 Acceptance / DoD** — No lost committed rows; restore verified on Windows. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Kill-during-write test
- [ ] Restart state checklist
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: none. Excludes: none.

---

## FR-28 — Local AI via Ollama

**1 Metadata** — Group: AI · Status: **Planned** · Milestone: FM-5 · Effort: L · Decision state: Blocked: U12 · Origin: explicitly requested by owner · Evidence: No HTTP client dependency.

**2 User story** — As a user I want AI that runs on my machine.

**3 Behaviour / workflow** — Detect Ollama at localhost, list models, route requests.

**4 Plain language** — Use AI that never leaves your PC.

**5 Technical design** — Loopback HTTP client in shell; core defines `AiProvider` trait; request timeouts.

**6 Choices and trade-offs** — Ollama (existing runtime) vs bundled model (huge installer). Chosen: Ollama.

**7 Ordered tasks**

1. Resolve U12
2. Provider trait
3. Ollama client
4. Settings UI
5. Status when not installed

**8 Tests** (IDs in the matrix)

- T-28-01 · Integration · mock server · coverage: missing

**9 Edge cases** — Not installed; model missing; slow model.

**10 Acceptance / DoD** — No non-loopback traffic (test). Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Resolve U12
- [ ] Provider trait
- [ ] Ollama client
- [ ] Settings UI
- [ ] Status when not installed
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: U12. Excludes: Bundling models.

---

## FR-29 — Optional cloud fallback with cost-aware routing

**1 Metadata** — Group: AI · Status: **Blocked** · Milestone: FM-11 · Effort: L · Decision state: Blocked: owner + secrets (FR-13) · Origin: explicitly requested by owner · Evidence: None.

**2 User story** — As a user I want cloud AI only when I allow it and within a budget.

**3 Behaviour / workflow** — Router tries local; cloud used only if enabled, under a monthly cap, with visible per-request disclosure.

**4 Plain language** — Cloud help only if you turn it on, with a spending cap.

**5 Technical design** — Key in keychain (FR-13); cost estimator; hard cap; log of what was sent.

**6 Choices and trade-offs** — Opt-in default off.

**7 Ordered tasks**

1. Router policy
2. Budget cap
3. Disclosure UI
4. Key storage

**8 Tests** (IDs in the matrix)

- T-29-01 · Unit · cap blocks request · coverage: missing

**9 Edge cases** — Offline; cap reached; key revoked.

**10 Acceptance / DoD** — Default off; nothing sent without toggle; cap enforced by test. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Router policy
- [ ] Budget cap
- [ ] Disclosure UI
- [ ] Key storage
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-28, FR-13. Excludes: Silent fallback.

---

## FR-30 — Computer-Use Assistant (permissions, approved actions, verification)

**1 Metadata** — Group: AI · Status: **Blocked** · Milestone: FM-12 · Effort: XL · Decision state: Blocked: safety design + owner approval · Origin: explicitly requested by owner · Evidence: None.

**2 User story** — As a user I want the assistant to act on my computer only as I approve.

**3 Behaviour / workflow** — Assistant proposes each action; user approves; result is verified (screenshot/state) and reported.

**4 Plain language** — The assistant does tasks only after you approve each step.

**5 Technical design** — Action allow-list, per-action approval, kill switch, audit log; no unattended runs.

**6 Choices and trade-offs** — Approve-every-action default.

**7 Ordered tasks**

1. Threat model
2. Permission model
3. Action executor
4. Verification
5. Audit log

**8 Tests** (IDs in the matrix)

- T-30-01 · Unit · unapproved action refused · coverage: missing
- T-30-02 · Manual · kill switch · coverage: missing

**9 Edge cases** — Prompt injection from screen content; destructive actions.

**10 Acceptance / DoD** — No action runs without approval (test); audit log complete. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Threat model
- [ ] Permission model
- [ ] Action executor
- [ ] Verification
- [ ] Audit log
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-28/29. Excludes: Autonomous mode.

---

## FR-31 — Character sharing

**1 Metadata** — Group: Community · Status: **Blocked** · Milestone: FM-10 · Effort: L · Decision state: Blocked: backend; content moderation · Origin: explicitly requested by owner · Evidence: None.

**2 User story** — As a creator I want to share my character.

**3 Behaviour / workflow** — Export pack; optional upload to a gallery.

**4 Plain language** — Share characters with others.

**5 Technical design** — File export first (works offline); gallery needs server + moderation.

**6 Choices and trade-offs** — File sharing MVP.

**7 Ordered tasks**

1. Export pack (after FR-03)
2. Gallery decision

**8 Tests** (IDs in the matrix)

- T-31-01 · Unit · export/import roundtrip · coverage: missing

**9 Edge cases** — Copyrighted art; offensive content.

**10 Acceptance / DoD** — Export works without server. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Export pack (after FR-03)
- [ ] Gallery decision
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-03. Excludes: Gallery until backend decided.

---

## FR-32 — Transparent telemetry (consent, opt-out, retention)

**1 Metadata** — Group: Community · Status: **Blocked** · Milestone: FM-9 · Effort: L · Decision state: Blocked: backend; legal · Origin: explicitly requested by owner · Evidence: No network code.

**2 User story** — As a user I control what is reported.

**3 Behaviour / workflow** — Off until consent; shows exact payload; opt-out; retention window; delete request.

**4 Plain language** — Anonymous usage counts only if you agree.

**5 Technical design** — Separate counters: downloads (website), installs, first use, active users.

**6 Choices and trade-offs** — Aggregate counters only.

**7 Ordered tasks**

1. Event schema
2. Consent UI
3. Payload viewer
4. Server ingest

**8 Tests** (IDs in the matrix)

- T-32-01 · Unit · nothing sent before consent · coverage: missing

**9 Edge cases** — Offline queue.

**10 Acceptance / DoD** — Zero requests before consent (test). Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Event schema
- [ ] Consent UI
- [ ] Payload viewer
- [ ] Server ingest
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FM-9. Excludes: Content or window titles.

---

## FR-33 — Abuse and duplicate prevention

**1 Metadata** — Group: Community · Status: **Blocked** · Milestone: FM-10 · Effort: L · Decision state: Blocked: backend · Origin: explicitly requested by owner · Evidence: None.

**2 User story** — As the owner I want fake referrals rejected.

**3 Behaviour / workflow** — Rate limits, install-id uniqueness, activity thresholds.

**4 Plain language** — Stops fake referrals.

**5 Technical design** — Server rules.

**6 Choices and trade-offs** — n/a

**7 Ordered tasks**

1. Rules
2. Tests

**8 Tests** (IDs in the matrix)

- T-33-01 · Integration · replay/dupe · coverage: missing

**9 Edge cases** — Shared IPs (campus).

**10 Acceptance / DoD** — Replay/dupe rejected. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Rules
- [ ] Tests
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FR-04. Excludes: Invasive fingerprinting.

---

## FR-34 — Product website and downloads

**1 Metadata** — Group: Distribution · Status: **Planned** · Milestone: FM-9 · Effort: M · Decision state: Blocked: product name (undecided) · Origin: explicitly requested by owner · Evidence: No website in repo.

**2 User story** — As a visitor I want to download the app.

**3 Behaviour / workflow** — Static site with download links to GitHub Releases.

**4 Plain language** — A website to get the app.

**5 Technical design** — Static site; no tracking until FR-32.

**6 Choices and trade-offs** — Static hosting.

**7 Ordered tasks**

1. Name decision
2. Site
3. Download links

**8 Tests** (IDs in the matrix)

- T-34-01 · E2E · links resolve · coverage: missing

**9 Edge cases** — Unsigned warnings.

**10 Acceptance / DoD** — Links resolve to signed artifacts. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Name decision
- [ ] Site
- [ ] Download links
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: FM-2. Excludes: Final name.

---

## FR-35 — In-app announcements and release notes

**1 Metadata** — Group: Distribution · Status: **Planned** · Milestone: FM-2 · Effort: M · Decision state: none · Origin: explicitly requested by owner · Evidence: CHANGELOG exists.

**2 User story** — As a user I want to see what changed.

**3 Behaviour / workflow** — 'What's new' after update from bundled changelog; remote announcements optional.

**4 Plain language** — See what's new.

**5 Technical design** — Bundle notes at build; remote feed off by default.

**6 Choices and trade-offs** — Bundled first.

**7 Ordered tasks**

1. Bundle changelog
2. What's new dialog

**8 Tests** (IDs in the matrix)

- T-35-01 · Component · shows once per version · coverage: missing

**9 Edge cases** — Skipped versions.

**10 Acceptance / DoD** — Shown once. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Bundle changelog
- [ ] What's new dialog
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: none. Excludes: Remote feed.

---

## FR-36 — Secure auto-update (integrity, recovery, rollback)

**1 Metadata** — Group: Distribution · Status: **Blocked** · Milestone: FM-2 · Effort: XL · Decision state: Blocked: signing certificates (owner) · Origin: explicitly requested by owner · Evidence: No `tauri-plugin-updater`; `release.yml` builds unsigned drafts.

**2 User story** — As a user I want safe updates.

**3 Behaviour / workflow** — Check, verify signature, install, keep previous version for rollback.

**4 Plain language** — Updates install safely.

**5 Technical design** — tauri-plugin-updater with minisign key; Windows code-signing; DB backup before migrate (exists).

**6 Choices and trade-offs** — Official updater.

**7 Ordered tasks**

1. Order certs
2. Updater keys
3. Plugin integration
4. Failure/rollback test

**8 Tests** (IDs in the matrix)

- T-36-01 · Manual-Win · update from 0.2.0 to next, tampered artifact rejected · coverage: missing

**9 Edge cases** — Interrupted download.

**10 Acceptance / DoD** — Tampered artifact rejected; previous version recoverable. Plus: tests above executed and passing, docs in 12 updated, no `Complete` without a real-OS run for OS-facing behaviour.

**11 Checklist**

- [ ] Order certs
- [ ] Updater keys
- [ ] Plugin integration
- [ ] Failure/rollback test
- [ ] All tests in 8 pass (results recorded, not assumed)
- [ ] Docs in 12 updated in the same change

**12 Documentation updates** — Spec + checklist, FEATURE_ROADMAP.md status, ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md (user wording), affected TRD/schema/app-flow docs, test results, Current Focus.

**13 Dependencies / exclusions** — Depends on: owner certs. Excludes: Silent forced updates.

---

## FR-37 — Keyboard-shortcut master switch (off by default)

**1 Metadata** — Group: Utilities · Status: **Planned** · Milestone: FM-1 · Effort: S · Decision state: owner decided, 2026-10-19: off by default "in the coming versions"; upgrade detail open (D-SHORTCUT-DEFAULT) · Origin: explicitly requested by owner (2026-10-19) · Evidence: `src-tauri/src/shortcuts.rs` registers global shortcuts at startup with no master switch; only `shortcuts.global_open` and `shortcuts.global_new_note` are settable (`crates/loaf-core/src/settings.rs`).

**2 User story** — As a user I want no system-wide keys taken by Loaf until I choose to turn them on.

**3 Behaviour / workflow** — One setting, `shortcuts.enabled`, default `false`. Settings › Shortcuts shows an Enable / Disable button and a status line. When off, no global shortcut is registered and in-app shortcuts are inactive. When on, the configured keys register immediately; a key another app owns is skipped with the existing log warning.

**4 Plain language** — Shortcuts are off until you turn them on.

**5 Technical design** — New key in `loaf-core` settings (`shortcuts.enabled`, bool, default false, validated). `shortcuts::start` registers nothing when it is false and re-registers on change (the existing `register_all` path). In-app shortcuts (`src/hooks/useShortcuts.ts`) read the same flag through `src/ipc/settings.ts`. Mock shell (`src/ipc/mock.ts`) mirrors the default.

**6 Choices and trade-offs** — A single master switch versus per-key switches. Chosen: one master switch, because the owner asked for one button; per-key rebinding stays as it is. Changing the default alters current behaviour, so the upgrade path needs owner confirmation (D-SHORTCUT-DEFAULT).

**7 Ordered tasks**
1. Confirm upgrade behaviour (D-SHORTCUT-DEFAULT) with the owner.
2. Add `shortcuts.enabled` (default false) to core settings; run `pnpm gen:types`.
3. Gate registration in `src-tauri/src/shortcuts.rs`.
4. Gate in-app shortcuts in `src/hooks/useShortcuts.ts`.
5. Enable / Disable button and status in `SettingsPage` / shortcuts settings.
6. Mock shell default.

**8 Tests**
- T-37-01 · Unit · no shortcut registered when the switch is off (`cargo test --workspace`) · missing
- T-37-02 · Component · button toggles state and persists across restart (`pnpm test`) · missing
- T-37-03 · Manual-Win · Ctrl+Shift shortcut works only after enabling · missing

**9 Edge cases** — Switch changed while the app is in the tray; another app already owns a key; settings written by an older version without the key.

**10 Acceptance / DoD** — Fresh install registers zero global shortcuts (test); enabling registers the configured keys (test); disabling unregisters all (test); Windows manual check recorded before Complete. Plus docs in 12 updated in the same change.

**11 Checklist**
- [ ] Upgrade behaviour confirmed (D-SHORTCUT-DEFAULT)
- [ ] Core setting and default
- [ ] Global registration gated
- [ ] In-app shortcuts gated
- [ ] Enable / Disable button
- [ ] Mock shell default
- [ ] T-37-01 to T-37-03 run and recorded

**12 Documentation updates** — This spec and checklist; FEATURE_ROADMAP.md status; PROJECT_STATUS; CHANGELOG (user wording); DECISIONS (the default); settings reference if one exists.

**13 Dependencies / exclusions** — Depends on: existing shortcut code (M2 F1-…; `src-tauri/src/shortcuts.rs`). Excludes: new shortcuts, per-key on/off, changes to key defaults.

---

## FR-38 — Meetings redesign (deferred to a later phase)

**1 Metadata** — Group: Utilities · Status: **Planned (deferred by owner)** · Milestone: FM-13 · Effort: M (unknown until described) · Decision state: Blocked on D-MEETINGS. Owner will define it and asked to be asked about it next time Meetings comes up · Origin: owner feedback (2026-10-19): "The Meetings feature does not make sense to me and needs fixing, but this can be addressed in a later phase." · Evidence: built as F1-17…19 (`src/features/meetings/MeetingsPage.tsx`, `MeetingEditor.tsx`, `crates/loaf-core/src/meetings.rs`).

**2 User story** — As a user I want meetings to be quick to record and useful afterwards. The owner has not yet said which part fails.

**3 Behaviour / workflow** — Not defined yet. Current behaviour is documented in `ROADMAP.md` (F1-17…19: create/edit, participants, filters). The redesign will be written after the owner describes the problem.

**4 Plain language** — Meetings is being rethought; nothing changes now.

**5 Technical design** — Not defined. Do not change code before the owner describes the problem.

**6 Choices and trade-offs** — Redesign now versus after the owner's description. Chosen: wait, because the owner asked for a later phase and gave no defect list.

**7 Ordered tasks**
1. Owner describes what does not make sense (D-MEETINGS). Ask the owner when Meetings is next discussed; do not start it unprompted.
2. Walk through the current flow with the owner and log each defect.
3. Write the redesigned flow here, then get approval.
4. Only then implement.

**8 Tests** — To be defined after step 3. Manual walkthrough logged as T-38-01 (Manual-Win, missing).

**9 Edge cases** — Not defined yet.

**10 Acceptance / DoD** — Owner approves the written redesign; each agreed defect is closed with a test; Windows check recorded.

**11 Checklist**
- [ ] Owner description received
- [ ] Defect list written
- [ ] Redesign approved
- [ ] Implemented, tested, documented

**12 Documentation updates** — This spec; ROADMAP M2/F1-17…19 wording; PROJECT_STATUS §4; CHANGELOG when shipped.

**13 Dependencies / exclusions** — Depends on: owner input. Excludes: any change in the current phase.

---
