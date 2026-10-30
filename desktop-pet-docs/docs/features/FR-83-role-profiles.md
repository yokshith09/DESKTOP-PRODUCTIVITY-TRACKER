# FR-83 — Role profiles: features on or off by default per role

**1 Metadata** — Group: Shell / Onboarding · Status: Built 2026-10-28 (role question, role-ordered tour and quiz, Settings → Your profile, one role difference: the student pack) · Milestone: FM-GUIDE (built with the Guide, FR-51) · Effort: M · Origin: owner 2026-10-22.

**2 Story** — As a new user I pick who I am (Student, Developer, or General) and Pluto turns on the features that matter to me, so I'm not buried in options. I can change any of it later.

**3 Behaviour** (simplified by the owner 2026-10-28: "only course label, exam countdown, weekly report on for student and off for the rest; all other features on for everyone")
- First run, after the welcome: "What describes you best?" — **Student · Developer · Student who codes · Something else**. One tap; skippable (skip = Something else).
- The role changes **one** default: the **student pack** (course label on tasks and notes, exam countdown on Today, weekly report). On for Student and Student who codes; off for Developer and Something else.
- Every other feature is on for everyone. Nothing is hidden.
- Settings → Your profile has a **Student pack** switch. A saved choice (`ui.studentPack` true/false) beats the role default, so changing role never undoes a choice made by hand.
- The role also orders the tour and the quiz.
- **Privacy tracking (app and website time) stays opt-in for every role.** It is the Welcome-screen choice, not a role default; turning it on by role would record without consent.

**4 Plain language** — Tell Pluto you are a student and the student tools switch on. Everything else is the same for everyone.

**5 Technical** — `ui.role` and `ui.studentPack` in `user_preferences`; `studentPackOn(role, override)` in `src/features/guide/roles.ts`.
