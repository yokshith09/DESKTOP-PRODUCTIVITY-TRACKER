import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ipc, type TaskRow } from "@/ipc";
import { PetApp } from "./PetApp";
import { topTasks } from "./PetCard";

beforeAll(() => {
  // jsdom has no PointerEvent; a MouseEvent carries the same button and position fields.
  window.PointerEvent ??= class extends MouseEvent {} as never;
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const renderPet = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PetApp />
    </QueryClientProvider>,
  );

const bear = () => screen.getByRole("button", { name: /^Loaf\./ });
const tap = (el: HTMLElement) => {
  fireEvent.pointerDown(el, { button: 0, buttons: 1, screenX: 10, screenY: 10 });
  fireEvent.pointerUp(el, { button: 0, screenX: 10, screenY: 10 });
};

describe("desktop pet", () => {
  it("shows a message from the dashboard above the pet, e.g. the routine reminder (FR-43, FR-85)", async () => {
    renderPet();
    await screen.findByRole("button", { name: /^Loaf\./ });
    act(() => {
      window.dispatchEvent(new CustomEvent("loaf-pet-say", { detail: { text: "You have 3 daily routine tasks pending", pose: "wait" } }));
    });
    expect((await screen.findAllByText("You have 3 daily routine tasks pending")).length).toBeGreaterThan(0);
  });

  it("a bubble with an action (like Undo) runs it when the pet is clicked, instead of opening the dashboard", async () => {
    const open = vi.spyOn(ipc, "petClick").mockResolvedValue(null);
    const sent: string[] = [];
    const onAction = (e: Event) => sent.push((e as CustomEvent<string>).detail);
    window.addEventListener("loaf-pet-action", onAction);
    renderPet();
    await screen.findByRole("button", { name: /^Loaf\./ });
    act(() => {
      window.dispatchEvent(new CustomEvent("loaf-pet-say", { detail: { text: "Moved to Bin", actionId: "n1", actionLabel: "Undo" } }));
    });
    expect((await screen.findAllByText("Moved to Bin · click: Undo")).length).toBeGreaterThan(0);
    tap(bear());
    expect(sent).toEqual(["n1"]);
    // The action is used up: the bubble loses its hint and a second click is an ordinary click.
    await waitFor(() => expect(screen.queryByText(/click: Undo/)).toBeNull());
    tap(bear());
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(sent).toEqual(["n1"]);
    window.removeEventListener("loaf-pet-action", onAction);
  });

  it("a reminder's Done is marked right from the pet", async () => {
    const done = vi.spyOn(ipc, "reminderSetDone").mockResolvedValue(undefined as never);
    renderPet();
    await screen.findByRole("button", { name: /^Loaf\./ });
    act(() => {
      window.dispatchEvent(new CustomEvent("loaf-pet-say", { detail: { text: "Stand up", actionId: "reminder-done:r1", actionLabel: "Done" } }));
    });
    expect((await screen.findAllByText("Stand up · click: Done")).length).toBeGreaterThan(0);
    tap(bear());
    expect(done).toHaveBeenCalledWith("r1", true);
  });

  it("shows the focus timer by the pet while a session runs, with pause (FR-110)", async () => {
    renderPet();
    await screen.findByRole("button", { name: /^Loaf\./ });
    await act(async () => { await ipc.focusStart({ kind: "FOCUS", minutes: 25, task_id: null }); });
    try {
      const timer = await screen.findByRole("timer", {}, { timeout: 2000 });
      expect(timer.getAttribute("aria-label")).toMatch(/^Focus: 2[45]:\d\d left$/);
      fireEvent.click(screen.getByRole("button", { name: "Pause focus" }));
      expect(await screen.findByRole("timer", { name: /paused$/ }, { timeout: 2000 })).toBeTruthy();
    } finally {
      await act(async () => { await ipc.focusStop(); });
    }
    await waitFor(() => expect(screen.queryByRole("timer")).toBeNull());
  });

  it("cheers when focus is done, and a click starts the break (FR-110)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderPet();
    await screen.findByRole("button", { name: /^Loaf\./ });
    await act(async () => { await ipc.focusStart({ kind: "FOCUS", minutes: 1, task_id: null }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(62_000); });
    expect((await screen.findAllByText("Nice: 1 min. Break 5 min? · click: Break", {}, { timeout: 3000 })).length).toBeGreaterThan(0);
    tap(bear());
    await waitFor(async () => expect((await ipc.focusCurrent())?.kind).toBe("BREAK"));
    await act(async () => { await ipc.focusStop(); });
  });

  it("with the hover card off, hovering shows today as a bubble instead (FR-110)", async () => {
    const all = await ipc.settingsGetAll();
    const loaded = vi.spyOn(ipc, "settingsGetAll").mockResolvedValue({ ...all, "pet.hover_card": false });
    renderPet();
    await screen.findByRole("button", { name: /^Loaf\./ });
    await waitFor(() => expect(loaded).toHaveBeenCalled());
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    fireEvent.mouseEnter(bear().closest("div.flex") as HTMLElement);
    expect((await screen.findAllByText(/today · next:|Nothing planned/, {}, { timeout: 2000 })).length).toBeGreaterThan(0);
    expect(screen.queryByRole("status", { name: "Today at a glance" })).toBeNull();
  });

  it("the hover card has shortcuts: focus, add note, sleep and wake; tasks stand out (FR-111)", async () => {
    const cmd = vi.spyOn(ipc, "petCommand").mockResolvedValue(null);
    renderPet();
    fireEvent.mouseEnter(bear().closest("div.flex") as HTMLElement);
    const card = await screen.findByRole("status", { name: "Today at a glance" }, { timeout: 2000 });
    const shortcuts = within(card).getByRole("group", { name: "Shortcuts" });
    fireEvent.click(within(shortcuts).getByRole("button", { name: "Add note" }));
    expect(cmd).toHaveBeenCalledWith("new-note");
    fireEvent.click(within(shortcuts).getByRole("button", { name: "Sleep" }));
    expect(await screen.findByRole("img", { name: "Loaf the bear (sleep)" })).toBeTruthy();
    fireEvent.click(within(shortcuts).getByRole("button", { name: "Wake" }));
    await waitFor(() => expect(screen.queryByRole("img", { name: "Loaf the bear (sleep)" })).toBeNull());
    fireEvent.click(within(shortcuts).getByRole("button", { name: "Focus 25" }));
    expect(await within(shortcuts).findByRole("button", { name: "Stop focus" }, { timeout: 2000 })).toBeTruthy();
    fireEvent.click(within(shortcuts).getByRole("button", { name: "Stop focus" }));
    await waitFor(async () => expect(await ipc.focusCurrent()).toBeNull());
  });

  it("shows the chosen pet pack instead of the bear (FR-63)", async () => {
    const all = await ipc.settingsGetAll();
    vi.spyOn(ipc, "settingsGetAll").mockResolvedValue({ ...all, "pet.pack": "boba" });
    const sheet = vi.spyOn(ipc, "petsSheet").mockResolvedValue("data:image/webp;base64,AA==");
    renderPet();
    const pet = await screen.findByRole("img", { name: /^boba \(/ });
    expect(sheet).toHaveBeenCalledWith("boba");
    // The bear's current pose plays as one of the pack's rows (idle, or running while you work).
    expect(["idle", "running"]).toContain(pet.getAttribute("data-row"));
    expect(screen.queryByRole("img", { name: /Loaf the bear/ })).toBeNull();
  });

  it("falls back to the bear when the chosen pack is missing (FR-63)", async () => {
    const all = await ipc.settingsGetAll();
    vi.spyOn(ipc, "settingsGetAll").mockResolvedValue({ ...all, "pet.pack": "gone" });
    vi.spyOn(ipc, "petsSheet").mockRejectedValue({ code: "NOT_FOUND", message: "That pet is not installed." });
    renderPet();
    expect(await screen.findByRole("img", { name: /Loaf the bear/ })).toBeTruthy();
  });

  it("hovering shows today's card beside the pet", async () => {
    const hover = vi.spyOn(ipc, "petHover");
    renderPet();
    fireEvent.mouseEnter(bear().closest("div.flex") as HTMLElement);
    expect(await screen.findByRole("status", { name: "Today at a glance" }, { timeout: 2000 })).toBeTruthy();
    expect(hover).toHaveBeenCalledWith(true, expect.any(Number), expect.any(Number));
  });

  it("one click opens the dashboard, a double click hides it, a right click opens the menu", async () => {
    vi.useFakeTimers();
    const click = vi.spyOn(ipc, "petClick").mockResolvedValue(null);
    const dbl = vi.spyOn(ipc, "petDoubleClick").mockResolvedValue(null);
    const menu = vi.spyOn(ipc, "petMenu").mockResolvedValue(null);
    renderPet();

    tap(bear());
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(click).toHaveBeenCalledTimes(1);
    expect(dbl).not.toHaveBeenCalled();

    tap(bear());
    tap(bear());
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(dbl).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);

    fireEvent.contextMenu(bear());
    expect(menu).toHaveBeenCalledTimes(1);
  });

  it("reacts to a new task with a pose and a speech bubble", async () => {
    renderPet();
    await act(async () => { await ipc.taskQuickAdd("Buy honey"); });
    expect(await screen.findByRole("img", { name: "Loaf the bear (catch)" }, { timeout: 2000 })).toBeTruthy();
    expect(screen.getAllByText("Got it: “Buy honey”").length).toBeGreaterThan(0);
  });

  it("falls asleep only after 15 quiet minutes, and wakes on hover", async () => {
    vi.useFakeTimers();
    vi.spyOn(ipc, "petHover").mockResolvedValue(null);
    renderPet();
    await act(async () => { await vi.advanceTimersByTimeAsync(14 * 60_000); });
    expect(screen.queryByRole("img", { name: "Loaf the bear (sleep)" })).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(2 * 60_000); });
    expect(screen.getByRole("img", { name: "Loaf the bear (sleep)" })).toBeTruthy();
    fireEvent.mouseEnter(bear().closest("div.flex") as HTMLElement);
    expect(screen.queryByRole("img", { name: "Loaf the bear (sleep)" })).toBeNull();
  });

  it("drags with the card open without shrinking the window first, then lays the card out again", async () => {
    const hover = vi.spyOn(ipc, "petHover");
    renderPet();
    fireEvent.mouseEnter(bear().closest("div.flex") as HTMLElement);
    const card = await screen.findByRole("status", { name: "Today at a glance" }, { timeout: 2000 });
    hover.mockClear();
    fireEvent.pointerDown(bear(), { button: 0, buttons: 1, screenX: 10, screenY: 10 });
    fireEvent.pointerMove(bear(), { buttons: 1, screenX: 40, screenY: 40 });
    expect(card.parentElement?.className).toContain("invisible");
    expect(hover).not.toHaveBeenCalledWith(false, 0, 0);
    // The drag is over: the next move has no button pressed.
    fireEvent.pointerMove(bear(), { buttons: 0, screenX: 40, screenY: 40 });
    await waitFor(() => expect(hover).toHaveBeenCalledWith(true, expect.any(Number), expect.any(Number)));
    expect(hover).not.toHaveBeenCalledWith(false, 0, 0);
  });

  it("a press that starts on the card, not the bear, still drags the window (0.1.3 report)", async () => {
    const hover = vi.spyOn(ipc, "petHover");
    renderPet();
    fireEvent.mouseEnter(bear().closest("div.flex") as HTMLElement);
    const card = await screen.findByRole("status", { name: "Today at a glance" }, { timeout: 2000 });
    hover.mockClear();
    fireEvent.pointerDown(card, { button: 0, buttons: 1, screenX: 10, screenY: 10 });
    fireEvent.pointerMove(card, { buttons: 1, screenX: 40, screenY: 40 });
    expect(card.parentElement?.className).toContain("invisible");
    fireEvent.pointerMove(card, { buttons: 0, screenX: 40, screenY: 40 });
    await waitFor(() => expect(hover).toHaveBeenCalledWith(true, expect.any(Number), expect.any(Number)));
  });

  it("a plain click on the card (no drag) does not open or hide the dashboard", async () => {
    const click = vi.spyOn(ipc, "petClick").mockResolvedValue(null);
    renderPet();
    fireEvent.mouseEnter(bear().closest("div.flex") as HTMLElement);
    const card = await screen.findByRole("status", { name: "Today at a glance" }, { timeout: 2000 });
    fireEvent.pointerDown(card, { button: 0, buttons: 1, screenX: 10, screenY: 10 });
    fireEvent.pointerUp(card, { button: 0, screenX: 10, screenY: 10 });
    expect(click).not.toHaveBeenCalled();
  });

  it("puts overdue, then in-progress, then high-priority tasks first", () => {
    const row = (id: string, over: Partial<TaskRow["task"]>, overdue = false): TaskRow => ({
      overdue, done_today: false,
      task: { id, title: id, description: "", status: "PLANNED", priority: null, project: null, planned_date: null, due_date: null, note_id: null, source_action_item_id: null, created_at: 0, updated_at: 0, started_at: null, completed_at: null, cancelled_at: null, starred: false, repeat: null, repeat_until: null, days: [], links: [], ...over },
    });
    const rows = [row("low", { priority: "LOW" }), row("high", { priority: "HIGH" }), row("doing", { status: "IN_PROGRESS" }), row("late", {}, true)];
    expect(topTasks(rows).map((r) => r.task.id)).toEqual(["late", "doing"]);
    expect(topTasks(rows, 4).map((r) => r.task.id)).toEqual(["late", "doing", "high", "low"]);
  });
});

describe("typing along", () => {
  const typing = (on: boolean) => act(() => { window.dispatchEvent(new CustomEvent("loaf-typing", { detail: on })); });

  it("with the switch on, the bear takes out its laptop while you type and looks up when you stop", async () => {
    const all = await ipc.settingsGetAll();
    vi.spyOn(ipc, "settingsGetAll").mockResolvedValue({ ...all, "pet.typing": true });
    renderPet();
    await waitFor(() => expect(ipc.settingsGetAll).toHaveBeenCalled());
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    typing(true);
    expect(await screen.findByRole("img", { name: "Loaf the bear (type)" })).toBeTruthy();
    typing(false);
    expect(await screen.findByRole("img", { name: "Loaf the bear (wait)" })).toBeTruthy();
  });

  it("with the switch off (the default), typing changes nothing", async () => {
    renderPet();
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    typing(true);
    expect(screen.queryByRole("img", { name: "Loaf the bear (type)" })).toBeNull();
  });
});
