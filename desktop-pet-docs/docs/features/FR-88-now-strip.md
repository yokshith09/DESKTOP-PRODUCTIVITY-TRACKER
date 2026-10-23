# FR-88 — Now strip beside the pet (spec draft, preview published 2026-10-23)

Preview (clickable, board 4): https://claude.ai/artifact/BdkF54zvoFzUTnyd9P2Y9p — private to the owner. **Nothing is built.**

**1 Metadata** — Group: Pet · Status: Planned (preview reviewed by owner: pending) · Milestone: FM-ST (P2) · Effort: M · Origin: market research 2026-10-23 (strongest-evidence gap: "visible without opening an app").
**2 Story** — As a student working in another app, I want to see what I'm on, how long is left and what's next, without switching windows.
**3 Behaviour** — A small card beside the pet, on the side with more room (it flips at a screen edge and follows the pet when dragged). States:
- **Focusing** — subject, time left with a ring, current task, next step; buttons Pause, +5 min.
- **Break** — time left, a short break hint, what comes after; Back to work.
- **Class soon** — from the Timetable (FR-58): "in 12 min", room, until when; the next free slot.
- **Nothing planned** — "Free time · Rest counts. Loaf will wait." Next deadline; Focus 25 min, Pick a task.
- **Pill** — collapsed form ("● 13:12 Physics") after 10 s without the mouse nearby; hover opens it.
**4 Plain language** — A little card next to your pet that tells you what you're doing now and what's next.
**5 Technical** — Rendered in the existing pet window (no new window); the window grows to the strip side like the hover card (`expand`). Data from focus sessions, tasks planned today, reminders and the Timetable. Never takes focus; no sound.
**6 Choices** — see "Open questions" below; everything else follows the companion principles.
**7 Tasks** — 1 state model (`nowState(now, focus, tasks, timetable)`) pure and unit-tested · 2 strip component · 3 side choice from the pet's position and work area · 4 pill collapse timer · 5 settings row · 6 hide in quiet modes (FR-89).
**8 Tests** — state chosen for each situation (focus, break, class within 15 min, nothing); side flips at the left edge; collapses after 10 s and opens on hover; hidden in full-screen; copy passes `noGuilt.test.ts`.
**9 Edge cases** — two monitors (strip stays on the pet's monitor); very small screens; pet hidden (strip hidden too); class and focus overlap (focus wins, class shown as Next); clock change at midnight.
**10 Acceptance** — the four states and the pill show correctly on Windows with the pet at both edges; never steals focus; tests pass. Until the owner runs it: **Unverified**.
**11 Checklist** — [ ] state model · [ ] strip · [ ] edges · [ ] pill · [ ] quiet modes · [ ] tests · [ ] docs
**12 Principles it follows** — not a notification (doesn't count toward the nudge budget, FR-96); no-guilt copy (FR-92); shows only what you planned, never what you type; local only.
**13 Deps** — FR-58 Timetable for "Class soon"; FR-89 quiet modes for hiding. Excludes: music controls, calendar sync.

## Open questions for the owner (answer before building)
1. On by default for the Student role, off for others? (Suggested: yes.)
2. Full card or pill when not focusing? (Suggested: the pill.)
3. Show the next class from the Timetable, or only tasks and deadlines?
4. Show it when nothing is planned, or hide it then?

## Student pack preview, revised the same day (boards 1-3)
- **Study**: subject chips pick what to focus on; hours per subject with a plan tick and "on plan ✓ / 1 h 06 m to go" (never "behind"); today's focus sessions on a timeline; exams with days left and topics ready; **Loaf noticed** suggestions worked out on this PC from the timetable and hours (no AI, at most one a day above the pet, never in quiet hours).
- **Timetable**: time grid with a now line, free slots that fit a session ("fits Chemistry 45 min"), clash detection (exam during a lab), side panel for the selected block, .ics import button. Classes don't remind by default; study blocks and exams remind once, 10 min before, within the nudge budget.
- **Study group**: leaderboard visibility defaults to **Nobody** (matches DECISIONS 2026-10-23 afternoon); group goal ring; "Studying right now" only for people who opt in; group day-by-day chart; shared vs never-shared list; cheers make the other pet wave once (no chat).
