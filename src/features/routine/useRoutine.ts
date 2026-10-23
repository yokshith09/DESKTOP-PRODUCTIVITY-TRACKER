import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ipc } from "@/ipc";
import { ymd } from "@/lib/dates";
import { notify } from "@/lib/notify";
import { msUntil, parseRoutine, pendingMessage, shouldRemind, type RoutineState } from "./routine";

export const ROUTINE_KEY = ["prefs", "ui.routine"] as const;

/** The daily routine, stored in preferences (`ui.routine`) and rolled over to today on read. */
export function useRoutine() {
  const qc = useQueryClient();
  const today = ymd(new Date());
  const { data } = useQuery({ queryKey: ROUTINE_KEY, queryFn: async () => parseRoutine(await ipc.prefsGet("ui.routine"), ymd(new Date())) });
  const state = data ?? parseRoutine(null, today);
  const save = async (next: RoutineState) => {
    qc.setQueryData(ROUTINE_KEY, next);
    await ipc.prefsSet("ui.routine", next);
  };
  return { state, today, save, apply: (fn: (s: RoutineState) => RoutineState) => save(fn(state)) };
}

/**
 * Shows "You have N daily routine tasks pending" once a day at the chosen time (FR-85).
 * One timer to the reminder time, re-armed when the routine changes; no polling.
 */
export function useRoutineReminder() {
  const { state, save } = useRoutine();
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const today = ymd(now);
      if (!shouldRemind(state, now, today)) return;
      const message = pendingMessage(state);
      if (message) notify.info(message, { description: "Open Today to tick them off." });
      void save({ ...state, remindedOn: today });
    };
    check();
    const wait = msUntil(state.remind.at, new Date());
    const t = wait > 0 ? window.setTimeout(check, wait + 500) : undefined;
    return () => window.clearTimeout(t);
    // Re-armed only when something the reminder depends on changes.
  }, [state.remind.on, state.remind.at, state.remindedOn, state.done.length, state.items.length, state.day]);
}
