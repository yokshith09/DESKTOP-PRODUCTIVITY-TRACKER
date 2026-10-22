# V2 issues (owner testing of v2.0.0 / source 0.2.0)

> Reported by the owner on 2026-10-22. The owner said **all other features work in V2**; Notes, Tasks and Daily Progress are fine, and the Meetings tab is fine. Nothing here is fixed yet: this is a log, with each item mapped to a spec in [`features/FR-v2-features.md`](features/FR-v2-features.md). Status words follow PROJECT_STATUS §2.

| ID | Owner report (short) | What the code does today | Proposed fix | Spec | Status |
|----|----------------------|--------------------------|--------------|------|--------|
| V2-01 | "Cannot link; links and Linked note don't lead to any action" | `TaskDetail.tsx` shows a "Linked note" dropdown that only stores an id. Nothing opens the note, and the note never shows the task. | Make links actionable: an "Open note" button on the task, a "Linked tasks" list on the note, "Create note from task". | FR-42 | Planned |
| V2-02 | Notifications on the dashboard's left side should pop up properly; after adding or editing a task the user should be navigated back to the dashboard | Not reproduced in code review; needs the exact screen. | One toast pattern (bottom-right stack, auto-dismiss, action button) plus a "return to Today" after add/edit. Owner (Q1): toast stack. | FR-41 | Planned |
| V2-03 | No pop-ups above the pet | The pet window shows reaction bubbles above the pet. | **Reversed by the owner (Q2):** keep notifications and emote bubbles above the pet and make them work properly. | FR-43 | Planned |
| V2-04 | Time tiles have empty space; fill or expand; tiles cannot be resized | FR-22 (resizable tiles) is Planned or Partial; the Time tab tiles do not resize. | Resize handles with a grid snap, tiles grow to fill the row, no dead space. | FR-44 | Planned |
| V2-05 | Date and time selecting tiles are too generic | Native `<input type="date">` everywhere. | A purpose-built picker with presets (Today, Tomorrow, This weekend, Next week, In 3 days), a month grid, a time wheel for reminders. | FR-45 | Planned |
| V2-06 | User sets a timeline for data to auto-delete | A 30-day Bin exists. No retention setting for activity, notes, meetings. | Per-data-type retention (Never, 30 days, 90 days, 6 months, 1 year, custom). Always previews what would go, and sends to the Bin first. Owner (Q3): Time/activity history and completed tasks. | FR-46 | Planned |
| V2-07 | Remove "Logs" from Loaf settings | `SettingsPage.tsx` has a "Log files" row and a log-level control. | Remove both rows from the UI. Logging itself stays on (needed for bug reports). | FR-47 | Planned |
| V2-08 | Links appear only in Today overview; want them in Notes too | The links feature (`src/features/links`) renders on the overview only. | A Links section in the Notes tab. | FR-42 | Planned |
| V2-09 | Characters can be customised; accessories can be added | Only the colour is chosen today. | Accessory slots (hat, glasses, scarf, bow, headphones) drawn per character, saved in settings. | FR-49 | Planned |
| V2-10 | "Tabs opened are not visible" | Unknown. | Owner (Q4): show the browser's open tabs on the dashboard, switch to and close them from there. No extension: Windows UI Automation, spike first. | FR-49 | Planned, needs a spike |
| V2-11 | Pet window shortcuts editable, default off | Pet shortcut is fixed (FR-37). | Editable, off by default. | FR-48 | Planned |
| V2-12 | Guide page: how to use each tab; skippable; "Built by QUORBIT TECHNOLOGIES" | Welcome page exists; no guide. | A guided tour plus a Guide page. | FR-51 | Planned |
| V2-13 | Meetings: what could make it more useful; action items on Today with the meeting named | Action items convert to tasks but the task does not say which meeting. | Source label on the task, plus suggestions in FR-52. | FR-52 | Planned |
| V2-14 | Project Spaces optional, off by default, appears in the left menu when on | FR-06 is Planned. | Setting "Enable Project Spaces" adds the sidebar item. | FR-53 | Planned |
| V2-15 | Sprite characters, not Rive; Character Studio like OpenPets | Rive trial blocked; characters are inline SVG. | Sprite-pack format and Studio. | FR-50 | Planned |

## Open questions for the owner

- **Q1.** Dashboard notifications: a toast stack at bottom-right (suggested), a bell with a list, or both?
- ~~Q2~~ answered: bubbles above the pet stay, emotes included.
- (old) **Q2.** "No pop-ups above pet": remove all reaction bubbles, or only the task/reminder ones and keep emote speech bubbles?
- ~~Q3~~ answered: Time history and completed tasks.
- (old) **Q3.** Auto-delete: which data? Suggested: Time/activity history, meetings, the Bin, completed tasks. Notes only if the owner wants it.
- **Q4.** What are the "tabs opened" that are not visible?
- **Q5.** "Linked note" — does the plan in V2-01 match what you wanted?
