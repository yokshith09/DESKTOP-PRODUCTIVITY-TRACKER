import { describe, expect, it } from "vitest";
import type { LoafEvent, TaskRow } from "@/ipc";
import { SLEEP_AFTER_MS, enqueue, isAsleep, reactionFor, type Reaction } from "./reactions";

const row = (id: string, title = id, overdue = false): TaskRow => ({
  overdue,
  task: { id, title, description: "", status: "PLANNED", priority: null, project: null, planned_date: null, due_date: null, note_id: null, source_action_item_id: null, created_at: 0, updated_at: 0, started_at: null, completed_at: null, cancelled_at: null },
});
const ev = (type: string, fields: Record<string, unknown> = {}) => ({ type, at: 0, ...fields }) as LoafEvent;

describe("pet reactions", () => {
  it("cheers when a task is done, and throws a party for the last one", () => {
    const two = { openToday: [row("a"), row("b")] };
    expect(reactionFor(ev("TaskStatusChanged", { id: "a", from: "PLANNED", to: "COMPLETED" }), two)).toMatchObject({ pose: "cheer", bubble: "Done! 1 left today" });
    const one = { openToday: [row("a")] };
    expect(reactionFor(ev("TaskStatusChanged", { id: "a", from: "PLANNED", to: "COMPLETED" }), one)).toMatchObject({ pose: "party" });
  });

  it("catches new tasks, works on started ones, tosses deleted ones and rings for reminders", () => {
    const ctx = { openToday: [row("a", "Write the report")] };
    expect(reactionFor(ev("TaskCreated", { task: row("n", "Call the bank").task }), ctx)).toMatchObject({ pose: "catch", bubble: "Got it: “Call the bank”" });
    expect(reactionFor(ev("TaskStatusChanged", { id: "a", from: "PLANNED", to: "IN_PROGRESS" }), ctx)).toMatchObject({ pose: "work", bubble: "On it: “Write the report”" });
    expect(reactionFor(ev("TaskDeleted", { id: "a" }), ctx)).toMatchObject({ pose: "toss" });
    expect(reactionFor(ev("ReminderDue", { reminder: { title: "Stand up" } }), ctx)).toMatchObject({ pose: "ring", priority: 5 });
  });

  it("stays calm for everything else, and shortens long titles", () => {
    expect(reactionFor(ev("NoteUpdated"), { openToday: [] })).toBeNull();
    expect(reactionFor(ev("TaskStatusChanged", { id: "a", from: "IN_PROGRESS", to: "PENDING" }), { openToday: [] })).toBeNull();
    const long = reactionFor(ev("TaskCreated", { task: row("n", "A very long task title that goes on and on").task }), { openToday: [] });
    expect(long?.bubble).toBe("Got it: “A very long task title th…”");
  });

  it("sleeps only after a quiet spell, whatever the time of day", () => {
    expect(isAsleep(0, SLEEP_AFTER_MS - 1)).toBe(false);
    expect(isAsleep(0, SLEEP_AFTER_MS)).toBe(true);
  });

  it("keeps at most three waiting reactions, most important first", () => {
    const r = (priority: number): Reaction => ({ pose: "idle", bubble: String(priority), ms: 1, priority });
    let q: Reaction[] = [];
    for (const p of [1, 5, 2, 4]) q = enqueue(q, r(p));
    expect(q.map((x) => x.priority)).toEqual([5, 4, 2]);
  });
});
