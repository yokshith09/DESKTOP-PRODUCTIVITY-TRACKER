import { ymd } from "@/lib/dates";

/**
 * Notification budget (FR-96): every nudge Loaf shows without being asked (routine reminder,
 * greeting, birthday…) goes through here so the user is never spammed. Reminders the user set
 * for a time do not. Stored in preferences under `ui.nudges`.
 */
export const DAILY_MAX = 4;
export const GAP_MS = 60 * 60_000;

export interface NudgeState {
  /** day → kinds already shown that day (only today is kept). */
  days: Record<string, string[]>;
  last: number | null;
  quiet: { on: boolean; from: string; to: string };
}

export const emptyNudges = (): NudgeState => ({ days: {}, last: null, quiet: { on: true, from: "22:00", to: "08:00" } });

export function parseNudges(raw: unknown): NudgeState {
  if (!raw || typeof raw !== "object") return emptyNudges();
  const r = raw as Partial<NudgeState>;
  const hhmm = (v: unknown, d: string) => (typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : d);
  return {
    days: r.days && typeof r.days === "object" ? r.days : {},
    last: typeof r.last === "number" ? r.last : null,
    quiet: { on: r.quiet?.on !== false, from: hhmm(r.quiet?.from, "22:00"), to: hhmm(r.quiet?.to, "08:00") },
  };
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export function inQuietHours(s: NudgeState, now: Date): boolean {
  if (!s.quiet.on) return false;
  const t = now.getHours() * 60 + now.getMinutes();
  const from = minutes(s.quiet.from);
  const to = minutes(s.quiet.to);
  return from <= to ? t >= from && t < to : t >= from || t < to;
}

/** May Loaf show a nudge of this kind now? */
export function canNudge(s: NudgeState, kind: string, now: Date): boolean {
  const today = s.days[ymd(now)] ?? [];
  if (today.includes(kind) || today.length >= DAILY_MAX) return false;
  if (s.last !== null && now.getTime() - s.last < GAP_MS) return false;
  return !inQuietHours(s, now);
}

/** Record that a nudge was shown; days other than today are forgotten. */
export function markNudged(s: NudgeState, kind: string, now: Date): NudgeState {
  const day = ymd(now);
  return { ...s, days: { [day]: [...(s.days[day] ?? []), kind] }, last: now.getTime() };
}
