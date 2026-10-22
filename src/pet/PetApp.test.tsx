import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      overdue,
      task: { id, title: id, description: "", status: "PLANNED", priority: null, project: null, planned_date: null, due_date: null, note_id: null, source_action_item_id: null, created_at: 0, updated_at: 0, started_at: null, completed_at: null, cancelled_at: null, ...over },
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
