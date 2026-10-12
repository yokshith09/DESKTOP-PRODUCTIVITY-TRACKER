import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  // jsdom lacks these; Radix and the theme hook use them.
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(cleanup);

// A fresh in-memory shell (and so fresh preferences) for every test.
let App: typeof import("./App").App;
beforeEach(async () => {
  vi.resetModules();
  ({ App } = await import("./App"));
});

/** Click a sidebar item (the Overview also has tiles with the same names). */
async function goTo(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  const side = await screen.findByRole("complementary");
  await user.click(within(side).getByRole("button", { name }));
}
const openNotes = (user: ReturnType<typeof userEvent.setup>) => goTo(user, /^Notes/);

describe("Notes screen (against the in-memory shell)", () => {
  it("opens on Today overview: agenda, time, links and activity, without search or New note", async () => {
    render(<App />);
    expect(await screen.findByRole("region", { name: "Today’s agenda" })).toBeTruthy();
    for (const name of ["Total time today", "Apps", "Websites", "Links", "Done this week", "Activity"]) {
      expect(await screen.findByRole("region", { name })).toBeTruthy();
    }
    expect(screen.queryByRole("textbox", { name: "Search notes" })).toBeNull();
    expect(screen.queryByRole("button", { name: /New note/ })).toBeNull();
  });

  it("Total time lists every app and website, and opens the active spans", async () => {
    const user = userEvent.setup();
    render(<App />);
    const apps = await screen.findByRole("region", { name: "Apps" });
    const sites = await screen.findByRole("region", { name: "Websites" });
    expect(await within(sites).findByRole("button", { name: /^github\.com/ })).toBeTruthy();
    await user.click(await within(apps).findByRole("button", { name: /^VS Code,/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText(/Active from/)).toBeTruthy();
  });

  it("a task can be edited from Today: priority and deadline", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Edit Refactor the tray menu" }));
    const form = await screen.findByRole("form", { name: "Edit Refactor the tray menu" });
    await user.click(within(form).getByRole("radio", { name: "High" }));
    await user.type(within(form).getByLabelText("Deadline"), "2030-05-04");
    await user.click(within(form).getByRole("button", { name: "Save" }));
    const row = (await screen.findByRole("button", { name: "Edit Refactor the tray menu" })).closest("li") as HTMLElement;
    expect(await within(row).findByText(/High/)).toBeTruthy();
    expect(within(row).getByTitle("Deadline")).toBeTruthy();
  });

  it("browsers list their sites with time under the browser", async () => {
    render(<App />);
    const list = await screen.findByRole("list", { name: "Sites in Google Chrome" });
    expect(await within(list).findByRole("button", { name: /^github\.com/ })).toBeTruthy();
  });

  it("the demo time data does not depend on the time of day (00:20 local)", async () => {
    const early = new Date();
    early.setHours(0, 20, 0, 0);
    vi.useFakeTimers({ toFake: ["Date"], now: early });
    try {
      vi.resetModules();
      ({ App } = await import("./App"));
      render(<App />);
      const sites = await screen.findByRole("region", { name: "Websites" });
      expect(await within(sites).findByRole("button", { name: /^github\.com/ })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("every overview tile has a move handle", async () => {
    render(<App />);
    for (const t of ["Today", "Total time today", "Links", "Activity", "Done this week"]) {
      expect(await screen.findByRole("button", { name: `Move ${t}` })).toBeTruthy();
    }
  });

  it("Tasks page: views, filters and search", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Tasks/);
    const list = await screen.findByRole("region", { name: "Task list" });
    expect(await within(list).findByRole("button", { name: "Open Design the notes screen" })).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "All" }));
    expect(await within(list).findByRole("button", { name: "Open Write release notes" })).toBeTruthy();
    await user.type(screen.getByRole("textbox", { name: "Search tasks" }), "release");
    expect(within(list).queryByRole("button", { name: "Open Design the notes screen" })).toBeNull();
    expect(within(list).getByRole("button", { name: "Open Write release notes" })).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "Completed" }));
    await user.clear(screen.getByRole("textbox", { name: "Search tasks" }));
    expect(await within(list).findByRole("button", { name: "Open Reply to Sam" })).toBeTruthy();
  });

  it("a task can be started, logged, deferred and finished from its detail", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Tasks/);
    await user.click(await screen.findByRole("button", { name: "Open Refactor the tray menu" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(await within(dialog).findByRole("button", { name: "Start" }));
    expect(await within(dialog).findByRole("button", { name: "Pause" })).toBeTruthy();
    await user.type(within(dialog).getByRole("textbox", { name: "New work update" }), "wired the menu{Enter}");
    expect(await within(dialog).findByText("wired the menu")).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Tomorrow" }));
    await user.click(await within(dialog).findByRole("button", { name: "Complete" }));
    expect(await within(dialog).findByRole("button", { name: "Reopen" })).toBeTruthy();
    // A finished task can be deleted, after a confirmation.
    await user.click(within(dialog).getByRole("button", { name: "Delete task" }));
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("button", { name: "Open Refactor the tray menu" })).toBeNull();
  });

  it("a note previews as Markdown, never as raw HTML", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    await user.click(await screen.findByRole("button", { name: "Groceries" }));
    const dialog = await screen.findByRole("dialog");
    const body = within(dialog).getByRole("textbox", { name: "Note" });
    await user.clear(body);
    await user.click(body);
    await user.paste("# Big heading\n\n- [x] done item\n\n<b>raw</b> text");
    await user.click(within(dialog).getByRole("button", { name: "Preview" }));
    const preview = within(dialog).getByLabelText("Preview");
    expect(within(preview).getByRole("heading", { level: 1, name: "Big heading" })).toBeTruthy();
    const box = within(preview).getByRole("checkbox") as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(box.disabled).toBe(true);
    expect(preview.textContent).toContain("<b>raw</b> text");
    expect(preview.querySelector("b")).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Edit" }));
    expect(within(dialog).getByRole("textbox", { name: "Note" })).toBeTruthy();
  });

  it("note editor shortcuts: Ctrl+D pins, Ctrl+E toggles preview", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    await user.click(await screen.findByRole("button", { name: "Groceries" }));
    const dialog = await screen.findByRole("dialog");
    await user.keyboard("{Control>}d{/Control}");
    expect(await within(dialog).findByRole("button", { name: "Unpin" })).toBeTruthy();
    await user.keyboard("{Control>}e{/Control}");
    expect(within(dialog).getByLabelText("Preview")).toBeTruthy();
  });

  it("labels can be renamed and deleted from the label manager", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    await user.click(await screen.findByRole("button", { name: "Manage labels" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Rename pet" }));
    const input = within(dialog).getByRole("textbox", { name: "New name for pet" });
    await user.clear(input);
    await user.type(input, "pets{Enter}");
    expect(await within(dialog).findByText("pets")).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Delete home" }));
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(within(dialog).queryByText("home")).toBeNull());
    // A name that is taken is refused and the label keeps its name.
    await user.click(within(dialog).getByRole("button", { name: "Rename work" }));
    const second = within(dialog).getByRole("textbox", { name: "New name for work" });
    await user.clear(second);
    await user.type(second, "IDEAS{Enter}");
    expect(within(dialog).getByRole("textbox", { name: "New name for work" })).toBeTruthy();
  });

  it("the Time page lists past days with done of planned, and a day opens to its tasks", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Time/);
    const log = await screen.findByRole("region", { name: "Daily log" });
    const yesterday = (await within(log).findAllByRole("button", { name: /^.+: \d+ of \d+ done$/, expanded: false }))[0] as HTMLElement;
    await user.click(yesterday);
    expect(yesterday.getAttribute("aria-expanded")).toBe("true");
    expect(within(log).getAllByRole("button", { name: /Copy .+ as Markdown/ }).length).toBeGreaterThan(0);
  });

  it("Settings › Your data: export, refused import into a non-empty Loaf, delete all with the word DELETE", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Settings/);
    await user.click(await screen.findByRole("button", { name: "Export…" }));
    expect(await screen.findByText("Export saved")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Import…" }));
    await user.click(await screen.findByRole("button", { name: "Choose file…" }));
    expect(await screen.findByText(/Import only works into an empty Loaf/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Delete all…" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Delete everything" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    await user.type(within(dialog).getByRole("textbox", { name: "Type DELETE to confirm" }), "delete");
    expect(confirm.disabled).toBe(true);
    await user.clear(within(dialog).getByRole("textbox", { name: "Type DELETE to confirm" }));
    await user.type(within(dialog).getByRole("textbox", { name: "Type DELETE to confirm" }), "DELETE");
    await user.click(confirm);
    expect(await screen.findByText("Everything was deleted")).toBeTruthy();
    // An empty Loaf starts over at the welcome screen; past it, Notes is empty.
    await user.click(await screen.findByRole("button", { name: "Start" }, { timeout: 3000 }));
    await openNotes(user);
    expect(await screen.findByText("No notes yet")).toBeTruthy();
  });

  it("keyboard: Ctrl+3 opens Notes, Ctrl+T focuses a new task, Ctrl+, opens Settings", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("region", { name: "Today’s agenda" });
    await user.keyboard("{Control>}3{/Control}");
    expect(await screen.findByRole("textbox", { name: "Search notes" })).toBeTruthy();
    await user.keyboard("{Control>}t{/Control}");
    const field = await screen.findByRole("textbox", { name: "New task" });
    await waitFor(() => expect(document.activeElement).toBe(field));
    await user.keyboard("{Control>},{/Control}");
    expect(await screen.findByRole("heading", { name: "Settings" })).toBeTruthy();
  });

  it("pasted links become shortcuts", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Add link" }));
    await user.type(await screen.findByLabelText("Paste links"), "linear.app/team");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("button", { name: "Open linear.app" })).toBeTruthy();
  });

  it("Notes has search and New note, shows Today first, then the next 7 days, Pinned, and the rest", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    expect(await screen.findByRole("textbox", { name: "Search notes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /New note/ })).toBeTruthy();
    const regions = (await screen.findAllByRole("region")).map((r) => r.getAttribute("aria-label"));
    const order = ["Today", "Next 7 days", "Pinned", "All notes"].map((n) => regions.indexOf(n));
    expect(order.every((n) => n >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(within(screen.getByRole("region", { name: "All notes" })).getByRole("button", { name: "Groceries" })).toBeTruthy();
  });

  it("the Time page filters by period and category", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Time/);
    const filters = await screen.findByRole("group", { name: "Filters" });
    expect(within(filters).getByRole("radio", { name: "30 days" })).toBeTruthy();
    expect(screen.queryByRole("tablist", { name: "Days" })).toBeNull();
    await user.click(within(filters).getByRole("radio", { name: "7 days" }));
    expect(await screen.findByRole("region", { name: "Apps" })).toBeTruthy();
    await user.click(within(filters).getByRole("radio", { name: "Sites" }));
    expect(await screen.findByRole("region", { name: "Sites" })).toBeTruthy();
  });

  it("unpinning moves a note out of Pinned", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    const card = await screen.findByRole("button", { name: "Shortcuts I want" });
    await user.click(within(card).getByRole("button", { name: "Unpin" }));
    await waitFor(() => {
      const pinned = screen.getByRole("region", { name: "Pinned" });
      expect(within(pinned).queryByRole("button", { name: "Shortcuts I want" })).toBeNull();
    });
  });

  it("deleting a note offers Undo, and Undo brings it back", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    const card = await screen.findByRole("button", { name: "Groceries" });
    await user.click(within(card).getByRole("button", { name: "Delete" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(await screen.findByRole("button", { name: "Groceries" })).toBeTruthy();
  });

  it("searches notes by text", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotes(user);
    await screen.findByRole("button", { name: "Groceries" });
    await user.type(screen.getByRole("textbox", { name: "Search notes" }), "peanut");
    expect(await screen.findByRole("heading", { name: /Results for/ })).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Friday prep" })).toBeNull());
    expect(screen.getByRole("button", { name: "Groceries" })).toBeTruthy();
  });

  it("restores a note from the Bin page", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Bin/);
    expect(await screen.findByText(/Old grocery list/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Restore “Old grocery list”/ }));
    await openNotes(user);
    expect(await screen.findByRole("button", { name: "Old grocery list" })).toBeTruthy();
  });

  it("adds a reminder", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Review the sync PR");
    await user.click(screen.getByRole("button", { name: "Add reminder" }));
    await user.type(await screen.findByLabelText("Remind me to"), "Water the plants");
    await user.click(screen.getByRole("button", { name: "Set reminder" }));
    expect(await screen.findByText("Water the plants")).toBeTruthy();
  });

  it("edits a missed reminder: snoozing it makes it upcoming again", async () => {
    const user = userEvent.setup();
    render(<App />);
    const edit = await screen.findByRole("button", { name: "Edit reminder “Review the sync PR”" });
    const row = edit.closest("li") as HTMLElement;
    expect(within(row).getByText(/Missed/)).toBeTruthy();
    await user.click(edit);
    await user.click(await screen.findByRole("button", { name: "In 10 min" }));
    await waitFor(() => expect(within(screen.getByRole("button", { name: "Edit reminder “Review the sync PR”" }).closest("li") as HTMLElement).queryByText(/Missed/)).toBeNull());
  });

  it("renames a reminder", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Edit reminder “Stand-up”" }));
    const title = await screen.findByLabelText("Remind me to");
    await user.clear(title);
    await user.type(title, "Daily stand-up");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("button", { name: "Edit reminder “Daily stand-up”" })).toBeTruthy();
  });
});

describe("first run (F1-26)", () => {
  it("never shows the welcome to someone who already has notes or tasks", async () => {
    render(<App />);
    expect(await screen.findByRole("region", { name: "Today’s agenda" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Welcome to Loaf" })).toBeNull();
  });

  it("welcomes a fresh Loaf (after Delete all), then gets out of the way for good", async () => {
    const { ipc } = await import("@/ipc");
    const user = userEvent.setup();
    render(<App />);
    // Wait for data: by then the page is listening for events (effects ran), so it hears Delete all.
    await screen.findByText("Review the sync PR");
    await ipc.dataDeleteAll("DELETE");
    expect(await screen.findByRole("heading", { name: "Welcome to Loaf" }, { timeout: 3000 })).toBeTruthy();
    // The three choices, with the pet on and the rest off.
    expect(screen.getByRole("switch", { name: "Show Loaf the bear on your desktop" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("switch", { name: "Track app time" }).getAttribute("aria-checked")).toBe("false");
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(await screen.findByRole("region", { name: "Today’s agenda" })).toBeTruthy();
    expect(await ipc.prefsGet("ui.onboarded")).toBe(true);
  });

  it("can start straight from writing a note", async () => {
    const { ipc } = await import("@/ipc");
    const user = userEvent.setup();
    render(<App />);
    // Wait for data: by then the page is listening for events (effects ran), so it hears Delete all.
    await screen.findByText("Review the sync PR");
    await ipc.dataDeleteAll("DELETE");
    await user.click(await screen.findByRole("button", { name: /Write a note/ }, { timeout: 3000 }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Welcome to Loaf" })).toBeNull());
    expect((await ipc.notesList(false, null, "last_edited")).length).toBe(1);
  });
});

describe("meetings (F1-17…19)", () => {
  const openMeetings = (user: ReturnType<typeof userEvent.setup>) => goTo(user, /^Meetings/);

  it("lists meetings newest first and filters by participant", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openMeetings(user);
    const list = await screen.findByRole("list", { name: "Meetings" });
    const rows = within(list).getAllByRole("button").map((b) => b.getAttribute("aria-label"));
    expect(rows).toEqual(["Open meeting “Sprint planning”", "Open meeting “Design review”"]);
    await user.type(screen.getByLabelText("Participant"), "ava");
    await waitFor(() => expect(within(screen.getByRole("list", { name: "Meetings" })).getAllByRole("button")).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Open meeting “Design review”" })).toBeTruthy();
  });

  it("turns an action item into a task that shows its status", async () => {
    const { ipc } = await import("@/ipc");
    const user = userEvent.setup();
    render(<App />);
    await openMeetings(user);
    await user.click(await screen.findByRole("button", { name: "Open meeting “Sprint planning”" }));
    const item = await screen.findByRole("textbox", { name: "Action item 1" });
    const row = item.closest("li") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: "Convert to task" }));
    expect(await within(row).findByText("Task · Planned")).toBeTruthy();
    const task = (await ipc.tasksQuery("all")).find((r) => r.task.title === "Write the meetings spec")?.task;
    expect(task?.project).toBe("Sprint planning");
    expect(task?.description).toContain("Assignee: Mara");
  });

  it("logs a new meeting with Ctrl+M: it saves itself once it has a title", async () => {
    const { ipc } = await import("@/ipc");
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("region", { name: "Today’s agenda" });
    await user.keyboard("{Control>}m{/Control}");
    const title = await screen.findByRole("textbox", { name: "Meeting title" });
    await user.type(title, "1:1 with Asha");
    await user.type(screen.getByRole("combobox", { name: "Add participant" }), "Asha{Enter}");
    await user.click(screen.getByRole("button", { name: "Add decision" }));
    await user.type(screen.getByRole("textbox", { name: "Decision 1" }), "Weekly check-ins");
    await user.click(screen.getByRole("button", { name: "Add action item" }));
    await user.type(screen.getByRole("textbox", { name: "Action item 1" }), "Share the roadmap");
    await waitFor(async () => {
      const m = (await ipc.meetingsList()).find((x) => x.title === "1:1 with Asha");
      expect(m?.participants).toEqual(["Asha"]);
      expect(m?.decisions).toBe(1);
      expect(m?.action_items).toBe(1);
    }, { timeout: 3000 });
    await user.click(screen.getByRole("button", { name: "Back to meetings" }));
    expect(await screen.findByRole("button", { name: "Open meeting “1:1 with Asha”" })).toBeTruthy();
  });

  it("deletes a meeting after a second click", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openMeetings(user);
    await user.click(await screen.findByRole("button", { name: "Open meeting “Design review”" }));
    await user.click(await screen.findByRole("button", { name: "Delete meeting" }));
    await user.click(await screen.findByRole("button", { name: "Delete meeting" }));
    await screen.findByRole("list", { name: "Meetings" });
    expect(screen.queryByRole("button", { name: "Open meeting “Design review”" })).toBeNull();
  });
});

describe("yesterday on Today overview (R1-70)", () => {
  it("says how yesterday went and opens what is still unfinished", async () => {
    const user = userEvent.setup();
    render(<App />);
    const line = await screen.findByRole("button", { name: /Yesterday: \d+ of \d+ done · 2 still open/ });
    await user.click(line);
    expect(await screen.findByText("Unfinished from yesterday")).toBeTruthy();
    const list = screen.getByRole("region", { name: "Task list" });
    expect(within(list).getByText("Finish the sync spec")).toBeTruthy();
    expect(within(list).getByText("Refactor the tray menu")).toBeTruthy();
    expect(within(list).queryByText("Design the notes screen")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Show all views" }));
    expect(screen.queryByText("Unfinished from yesterday")).toBeNull();
  });
});

describe("settings (F1-25)", () => {
  it("changes a global shortcut by pressing the new keys, and refuses one already in use", async () => {
    const { ipc } = await import("@/ipc");
    const user = userEvent.setup();
    render(<App />);
    await goTo(user, /^Settings/);
    await user.click(await screen.findByRole("button", { name: "Change shortcut: Open or hide Loaf, from any app" }));
    expect(screen.getByText(/Press the new keys/)).toBeTruthy();
    await user.keyboard("{Alt>}{F9}{/Alt}");
    await waitFor(async () => expect((await ipc.settingsGetAll())["shortcuts.global_open"]).toBe("Alt+F9"));
    // The pet's combination is taken: nothing changes.
    await user.click(screen.getByRole("button", { name: "Change shortcut: New note, from any app" }));
    await user.keyboard("{Control>}{Shift>}p{/Shift}{/Control}");
    expect(await screen.findByText(/already used by another Loaf shortcut/)).toBeTruthy();
    expect((await ipc.settingsGetAll())["shortcuts.global_new_note"]).toBeNull();
    // Back to the default.
    await user.click(screen.getByRole("button", { name: "Reset shortcut: Open or hide Loaf, from any app" }));
    await waitFor(async () => expect((await ipc.settingsGetAll())["shortcuts.global_open"]).toBeNull());
  });

  it("shows where data and logs live, and resets settings after a confirmation", async () => {
    const { ipc } = await import("@/ipc");
    const user = userEvent.setup();
    render(<App />);
    await ipc.settingSet("pet.size", "L");
    await goTo(user, /^Settings/);
    expect(await screen.findByText(/loaf\.db$/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open logs folder" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Reset settings…" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(async () => expect((await ipc.settingsGetAll())["pet.size"]).toBe("M"));
  });
});
