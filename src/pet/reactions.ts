import type { BearPose } from "@/features/shell/Bear";
import type { LoafEvent, TaskRow } from "@/ipc";
import type { Event } from "@/ipc/generated/Event";

/**
 * What the pet does when something happens. One row per moment: add a row to react to
 * something new. `priority` decides who wins when two arrive together (higher plays first).
 */
export interface Reaction { pose: BearPose; bubble: string; ms: number; priority: number }

/** A moment the pet itself notices (not sent by the core). */
export type PetSignal = { type: "TaskOverdue"; title: string; count: number };

/** What a reaction may look at: today's open tasks as they were just before the event. */
export interface ReactionContext { openToday: TaskRow[] }

const short = (s: string, n = 26) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const quote = (s: string) => `“${short(s)}”`;

type Rule<T> = (e: T, ctx: ReactionContext) => Reaction | null;
type Signal = Event | PetSignal;
type Rules = { [K in Signal["type"]]?: Rule<Extract<Signal, { type: K }>> };

export const RULES: Rules = {
  TaskCreated: (e) => ({ pose: "catch", bubble: `Got it: ${quote(e.task.title)}`, ms: 3000, priority: 2 }),
  TaskStatusChanged: (e, ctx) => {
    if (e.to === "COMPLETED") {
      const left = ctx.openToday.filter((r) => r.task.id !== e.id).length;
      return left === 0
        ? { pose: "party", bubble: "All done for today! 🎉", ms: 3600, priority: 4 }
        : { pose: "cheer", bubble: `Done! ${left} left today`, ms: 3000, priority: 3 };
    }
    if (e.to === "IN_PROGRESS") {
      const row = ctx.openToday.find((r) => r.task.id === e.id);
      return { pose: "work", bubble: row ? `On it: ${quote(row.task.title)}` : "On it!", ms: 3000, priority: 1 };
    }
    return null;
  },
  TaskDeleted: () => ({ pose: "toss", bubble: "Tossed it", ms: 2400, priority: 1 }),
  ReminderDue: (e) => ({ pose: "ring", bubble: `Reminder: ${quote(e.reminder.title)}`, ms: 5000, priority: 5 }),
  TaskOverdue: (e) => ({ pose: "worried", bubble: e.count > 1 ? `${e.count} tasks are overdue` : `${quote(e.title)} is overdue`, ms: 3600, priority: 4 }),
};

/** The reaction for an event, or null when the pet stays calm. */
export function reactionFor(e: LoafEvent | PetSignal, ctx: ReactionContext): Reaction | null {
  // Events come from the core as generated `Event`s; the transport types them loosely.
  const rule = (RULES as Record<string, Rule<Signal> | undefined>)[e.type];
  return rule ? rule(e as Signal, ctx) : null;
}

/** Overdue tasks not seen before. `seen` is updated in place, so each task is mentioned once. */
export function newlyOverdue(rows: TaskRow[], seen: Set<string>): TaskRow[] {
  const fresh = rows.filter((r) => r.overdue && !seen.has(r.task.id));
  fresh.forEach((r) => seen.add(r.task.id));
  return fresh;
}

/** Up to three waiting reactions, highest priority first; on a tie the older one plays first. */
export function enqueue(queue: Reaction[], r: Reaction, max = 3): Reaction[] {
  const next = [...queue, r].sort((a, b) => b.priority - a.priority);
  return next.slice(0, max);
}
