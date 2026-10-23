import { onPetAction, petSay } from "@/ipc";

/**
 * Every notification Loaf shows goes **above the pet as a bubble** (owner 2026-10-23: nothing
 * pops up inside the dashboard). Errors stay a little longer. An action such as Undo is offered
 * in the bubble: clicking the pet while it shows runs it.
 */
export const TOAST_MS = 5000;
export const ERROR_MS = 8000;
const MAX_TEXT = 80;

type Action = { label: string; onClick: () => void };
type Options = { description?: string; action?: Action };
type Kind = "success" | "info" | "warning" | "error";

const POSE: Record<Kind, string> = { success: "cheer", info: "wave", warning: "wait", error: "worried" };

/** Pending bubble actions by id; the pet window sends the id back when clicked. */
const actions = new Map<string, () => void>();
let listening = false;
let seq = 0;

function listen() {
  if (listening) return;
  listening = true;
  onPetAction((id) => {
    const run = actions.get(id);
    actions.delete(id);
    run?.();
  });
}

/** The bubble text: the message, plus the detail when both fit. */
export function bubbleText(message: string, description?: string): string {
  const both = description ? `${message} — ${description}` : message;
  return both.length <= MAX_TEXT ? both : message;
}

function show(kind: Kind, message: string, o?: Options) {
  const ms = kind === "error" ? ERROR_MS : TOAST_MS;
  let actionId: string | undefined;
  if (o?.action) {
    listen();
    actionId = `n${++seq}`;
    const id = actionId;
    actions.set(id, o.action.onClick);
    // Forget it once the bubble is gone.
    setTimeout(() => actions.delete(id), ms + 1000);
  }
  void petSay({
    text: bubbleText(message, o?.description),
    pose: POSE[kind],
    ms: o?.action ? ms + 3000 : ms,
    ...(actionId && o?.action ? { actionId, actionLabel: o.action.label } : {}),
  });
}

export const notify = {
  success: (message: string, o?: Options) => show("success", message, o),
  info: (message: string, o?: Options) => show("info", message, o),
  warning: (message: string, o?: Options) => show("warning", message, o),
  error: (message: string, o?: Options) => show("error", message, o),
};
