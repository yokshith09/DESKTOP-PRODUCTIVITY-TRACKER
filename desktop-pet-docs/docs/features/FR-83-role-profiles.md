# FR-83 — Role profiles: features on or off by default per role

**1 Metadata** — Group: Shell / Onboarding · Status: Planned · Milestone: FM-GUIDE (built with the Guide, FR-51) · Effort: M · Origin: owner 2026-10-22.

**2 Story** — As a new user I pick who I am (Student, Developer, or General) and Loaf turns on the features that matter to me, so I'm not buried in options. I can change any of it later.

**3 Behaviour**
- First run, after the welcome: "What describes you best?" — **Student · Developer · Student who codes · General use**. One tap; skippable (skip = General).
- The choice sets the **default** on/off state of every optional feature (matrix below). Nothing is hidden: every feature stays in Settings and can be switched on or off by the user.
- Settings → "Your profile": change role at any time. Changing role asks: "Apply the new defaults? Your own changes are kept" — features the user switched by hand keep the user's choice.
- The Guide (FR-51) and trivia show tips for the chosen role first.
- Privacy-sensitive features are **off for every role** (row "All roles off") and need the user to turn them on.

**4 Plain language** — Tell Loaf who you are; it sets itself up for you. You can still turn anything on or off.

**5 Technical**
- Setting `profile.role: "student" | "developer" | "student_dev" | "general"`.
- A static table `ROLE_DEFAULTS[feature][role]` in core (Rust, exported to TS with `pnpm gen:types`).
- Each feature setting stores `{ value, source: "default" | "user" }`. Effective value = user value if `source = "user"`, else `ROLE_DEFAULTS`.
- Changing role only rewrites entries with `source = "default"`.
- "Student who codes" = union of Student and Developer defaults.

**6 Choices** — Four roles (owner asked for student / developer / general; "student who codes" added because many students are CS students). Defaults stored as a table, not scattered `if` statements, so the matrix below is the single source of truth.

**Default matrix** (✅ on by default, ⬜ off by default; every row can be changed by the user)

| Feature | Student | Developer | General | Note |
|---|---|---|---|---|
| Notes, tasks, Today, meetings | ✅ | ✅ | ✅ | Core |
| Pet, typing-along | ✅ / ⬜ | ✅ / ⬜ | ✅ / ⬜ | Typing-along off for all (locked) |
| Toasts, pop-ups above the pet (FR-41, FR-43) | ✅ | ✅ | ✅ | |
| Student pack: courses, exam countdown, weekly report (FR-58) | ✅ | ⬜ | ⬜ | |
| Flashcards from notes (FR-82a) | ✅ | ⬜ | ⬜ | |
| Focus timer / Pomodoro (FR-05, FR-70) | ✅ | ✅ | ⬜ | |
| Calm corner (FR-69a) | ✅ | ⬜ | ✅ | |
| Water reminder, mood check-in, routines (FR-69b-d) | ⬜ | ⬜ | ⬜ | Opt-in nudges |
| Usage buddy nudges (FR-82b) | ⬜ | ⬜ | ⬜ | Opt-in |
| Project Spaces (FR-53) | ⬜ | ✅ | ⬜ | Owner: off by default (developers get it on) |
| Launch Buddy (FR-72) | ✅ | ✅ | ⬜ | |
| Quick Actions (M4) | ✅ | ✅ | ✅ | |
| Developer reactions: git, builds, CI (M12) | ⬜ | ✅ | ⬜ | |
| System resources badge (FR-73) | ⬜ | ✅ | ⬜ | |
| Coding-agent integration (FR-76) | ⬜ | ✅ | ⬜ | When the hold lifts |
| Care mode, fortune cookie, 8-ball (FR-71) | ✅ | ⬜ | ✅ | |
| Wander (FR-60), cursor gaze (FR-59) | ⬜ / ✅ | ⬜ / ✅ | ⬜ / ✅ | |
| Outfit schedule (FR-64) | ✅ | ✅ | ✅ | |
| Calendar reminders (FR-74) | ⬜ | ⬜ | ⬜ | Needs connecting |
| **All roles off (privacy)**: app/website time tracking, browser tabs (FR-62), pet shortcuts (FR-48), auto-delete (FR-46), LAN mode (FR-78), talk-to-pet (FR-75) | ⬜ | ⬜ | ⬜ | User must opt in |

> Time tracking default: currently the first-run asks. Proposal: keep asking, for every role. Owner may override.

**7 Tasks** — 1 role setting + `ROLE_DEFAULTS` table in core · 2 `{value, source}` settings migration · 3 first-run role screen · 4 Settings → Your profile with "apply defaults" · 5 every feature reads its effective value · 6 Guide tips per role.

**8 Tests** — T-83-01 unit: each role gives the matrix values · T-83-02 unit: switching role keeps user-set values · T-83-03 unit: student_dev = union · T-83-04 component: first-run choice → Settings shows matching toggles · T-83-05 component: skip = General · T-83-06 unit: privacy row off for all roles.

**9 Edge cases** — Existing users after the update (role = General, current settings marked `user` so nothing changes); a feature added later (needs a matrix row — test fails if a feature has no row); role changed twice quickly.

**10 Acceptance** — A new Student sees student features on and developer features off; any toggle works; changing role never overrides a hand-made choice.

**11 Checklist** — [ ] table · [ ] migration · [ ] first run · [ ] settings · [ ] tests · [ ] docs

**12 Docs** — this spec, MASTER_PLAN, FEATURE_ROADMAP, DECISIONS, CHANGELOG, PROJECT_STATUS.

**13 Deps** — FR-51 Guide (shares the first-run flow). Every later feature must add its row to `ROLE_DEFAULTS`.
