import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ipc, onWake, petSay } from "@/ipc";
import { ymd } from "@/lib/dates";
import { canNudge, inQuietHours, markNudged, parseNudges, type NudgeState } from "@/lib/nudges";
import { parseCompanion, todaysGreeting, type Companion } from "./companion";

export const COMPANION_KEY = ["prefs", "ui.companion"] as const;
export const NUDGES_KEY = ["prefs", "ui.nudges"] as const;

/** Name, birthdays and the pet's age (FR-93). The first read fixes the pet's birthday to today. */
export function useCompanion() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: COMPANION_KEY,
    queryFn: async () => {
      const raw = await ipc.prefsGet("ui.companion");
      const c = parseCompanion(raw, ymd(new Date()));
      if (!raw) await ipc.prefsSet("ui.companion", c); // remember the day you met
      return c;
    },
  });
  const save = async (next: Companion) => {
    qc.setQueryData(COMPANION_KEY, next);
    await ipc.prefsSet("ui.companion", next);
  };
  return { companion: data, save };
}

/** The notification budget (FR-96), shared by every unasked nudge. */
export async function tryNudge(kind: string, now: Date, show: () => void | Promise<void>): Promise<boolean> {
  const s: NudgeState = parseNudges(await ipc.prefsGet("ui.nudges"));
  if (!canNudge(s, kind, now)) return false;
  await ipc.prefsSet("ui.nudges", markNudged(s, kind, now));
  await show();
  return true;
}

/**
 * Says hello once a day (FR-94) the first time Loaf is open on a new day, or the user's or the
 * pet's birthday (FR-93). Checked when the dashboard starts and when it comes back into view
 * (the PC woke up), plus one timer to the end of quiet hours; no polling.
 */
export function useDailyGreeting() {
  const { companion, save } = useCompanion();
  useEffect(() => {
    if (!companion) return;
    let busy = false;
    const check = async () => {
      if (busy) return;
      busy = true;
      try {
        const now = new Date();
        const g = todaysGreeting(companion, now);
        if (!g) return;
        const shown = await tryNudge(g.kind, now, () => petSay({ text: g.text, pose: g.pose, ms: 8000 }));
        if (shown) await save({ ...companion, greetedOn: ymd(now) });
      } finally {
        busy = false;
      }
    };
    void check();
    const onShow = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("focus", onShow);
    // The dashboard may be hidden in the tray when the PC wakes; the shell says so (S1).
    const offWake = onWake(() => void check());
    // If it's quiet hours now, try again once they end.
    let t: number | undefined;
    void ipc.prefsGet("ui.nudges").then((raw) => {
      const s = parseNudges(raw);
      if (!inQuietHours(s, new Date())) return;
      const [h, m] = s.quiet.to.split(":").map(Number);
      const end = new Date();
      end.setHours(h ?? 8, m ?? 0, 0, 0);
      if (end.getTime() <= Date.now()) end.setDate(end.getDate() + 1);
      t = window.setTimeout(() => void check(), end.getTime() - Date.now() + 1000);
    });
    return () => {
      document.removeEventListener("visibilitychange", onShow);
      window.removeEventListener("focus", onShow);
      offWake();
      window.clearTimeout(t);
    };
  }, [companion, save]);
}
