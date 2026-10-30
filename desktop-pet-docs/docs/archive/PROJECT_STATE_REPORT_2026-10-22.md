# Project state report — 2026-10-22

Evidence tags: **Fact** (code/tests/Git), **Inference**, **Unknown**. Numbers below are the ones recorded in PROJECT_STATUS on 2026-10-19 plus the 138 frontend tests run this session; the Rust numbers were not re-run today.

## 1. Uncomfortable truths

1. **Nothing is verified on a real PC.** Every OS feature (tray, notifications, tracker, autostart, file dialogs, installer, pet window) is Unverified. The owner installed v2.0.0 but results are not recorded (PROJECT_STATUS §8).
2. **The owner's V2 issue list and G1 checklist are still open.** New character work (turned views) is built on top of an unverified base.
3. **The roadmap is not student-oriented.** M4–M13 follow a 2026-10-13 list that is feature-led. If students come first, the order changes (see §7).
4. **Scope vs. one developer:** FEATURE_ROADMAP lists ~40 features (FR-01…40), many blocked on decisions only the owner can make.

## 2. Progress

| Area | State |
|---|---|
| M1 Notes/Tasks/Daily progress | Code complete, tests pass, **Unverified** on Windows |
| M2 Meetings, pet, shortcuts | Code complete; Meetings needs redesign (FR-38, deferred) |
| M3 App/site tracking, privacy panel | Option-d scope shipped as 0.2.0 / tag v2.0.0, **Unverified** |
| Characters | Bear + Mochi, Pip, Bolt, Ghosty with typing/wait/cheer/sleep; turned views + back-turn shake for all five, preview only, **Unverified**, not wired to the pet window |
| Tests (this session) | 138 frontend tests pass, typecheck and lint clean. Rust: 376 as of 2026-10-19 (not re-run today) |
| Docs | Character, Emote (FR-40), pipeline, feature roadmap written |

## 3. Blockers

| Blocker | Owner action |
|---|---|
| G1: no recorded Windows results | Run `RELEASE_0.2.0_TEST.md`, send results |
| V2 issue list | Send the list |
| Code signing on hold (blocks updater, FM-2) | Lift hold when ready |
| Rive trial (CH-08) | Author `src/assets/rive/bear.riv` |
| AI provider (U12/D-AI) blocks M5, FM-5 | Decide |
| D-BACKEND blocks community, gallery, telemetry | Decide |
| Meetings (FR-38) | Describe what doesn't work |
| Remote branch still exists, wrong upstream, `git remote` may be stale | `git push origin --delete claude/repo-context-review-trprp8`, `git remote set-url origin <URL>`, `git branch -u origin/main` |

## 4. Incomplete tasks

- Emote registry/state machine, right-click Emotes menu, pet-window wiring (FM-8b-0/1).
- Master switch for shortcuts (FR-37) not built; D-SHORTCUT-DEFAULT upgrade detail open.
- Personal-photo characters CH-01…CH-08 (specs only).
- Reference images for built-in characters not supplied.
- D-LICENCE (model weights), D-SIZE (256×256 vs 192×208) open.
- 13-point definitions for the other local features.
- Dashboard/Time-tab fixes FM-1 (waiting on the V2 list).

## 5. Next planned (documented order)

ROADMAP: M4 Quick Actions → M5 Writing assistant → M6 pet continued → M7 Meeting-to-action → M8 Focus → M9 Voice → M10 MCP → M11 Privacy report → M12 Developer → M13 Characters. FEATURE_ROADMAP: FM-0 (active) → FM-1 → FM-2 … FM-13. The two lists overlap but are not merged (D-ORDER).

## 6. All planned features, by status

- **Built, Unverified:** notes, tasks, daily log, search, labels, export/import/delete, autostart, reminders, pet + reactions, shortcuts, app/site tracking, privacy panel, 5 characters.
- **Planned, startable:** Quick Actions (M4), Focus/Pomodoro (FM-4), Project Spaces (FM-3), Utilities (FM-7), Emotes (FM-8b), Local-only secure credentials (FM-6, threat model first).
- **Blocked on a decision:** AI (M5, FM-5), cloud fallback (FM-11), community/referrals (FM-10), backend/telemetry (FM-9), computer use (FM-12), Meetings redesign (FM-13), signing/updater (FM-2).
- **Confirm still wanted:** Developer reactions (M12).

## 7. Where we are heading — student first, then developer, then others

**Suggested positioning (needs owner approval):** *Pluto is the calm, offline study companion: tasks and deadlines, focus sessions, quick notes, and a pet that keeps you company. Private by default; no account.*

### Students (first)
Highest-value, mostly local, and fit what already exists:
1. **Deadline-first tasks:** due dates, course/subject label, weekly view (data model largely exists via labels and 7-day calendar).
2. **Focus/Pomodoro tied to a task** (FM-4/M8) with pet states; end-of-session summary.
3. **Study streak and weekly report** from existing time tracking (local).
4. **Quick capture** (M4): one shortcut for a note or task.
5. **Exam countdown** and reminders (M6, builds on reminders).
6. **Project Spaces as "courses"** (FM-3, "student" type is already listed).
7. **Study quiz from notes** (FR-15) — needs local AI, so after D-AI.
8. Distraction awareness from app tracking — only on-device, opt-in.

### Developers (second)
- Project Spaces as repos; git/build awareness (M12, FR-21).
- Local MCP status hook (OpenPets-style), opt-in.
- Error-translator and prompt tools (FR-12, M5) after D-AI.
- CI status (M10b).

### Other users (third)
- Writing/polishing (M5), voice (M9), meetings (FM-13), character studio, shareable character packs.

### Order I would propose (needs your approval; ROADMAP.md stays authoritative until then)
1. Close FM-0: record G1 results, fix V2 issues.
2. Student core: deadlines + course labels → Focus (tied to tasks) → Quick capture → weekly report.
3. Emote wiring (finishes the pet).
4. Project Spaces (courses, then repos).
5. Developer layer.
6. AI, voice, meetings after the provider decision.

**Risk of this order:** it moves Focus and Project Spaces ahead of Quick Actions and Writing, which the owner ranked first on 2026-10-13. Not applied until approved.

## 8. Open questions for the owner

1. Approve student-first positioning and the reorder?
2. Send the V2 issue list and G1 results.
3. Is Developer reactions (M12) still wanted?
4. AI provider (U12), backend (D-BACKEND), Meetings description.
5. Voice before MCP (U12–U15), U17–U22.
