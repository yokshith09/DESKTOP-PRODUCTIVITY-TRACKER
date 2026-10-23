import { toast } from "sonner";

/**
 * One way to tell the user something happened (FR-41): a small card in the bottom-right stack
 * that goes away by itself. Errors stay longer. An optional action (Undo, Open) sits on the card.
 */
export const TOAST_MS = 5000;
export const ERROR_MS = 8000;
export const MAX_VISIBLE = 3;

type Action = { label: string; onClick: () => void };
type Options = { description?: string; action?: Action };

const opts = (o: Options | undefined, duration: number) => ({
  duration,
  ...(o?.description ? { description: o.description } : {}),
  ...(o?.action ? { action: { label: o.action.label, onClick: o.action.onClick } } : {}),
});

export const notify = {
  success: (message: string, o?: Options) => toast.success(message, opts(o, TOAST_MS)),
  info: (message: string, o?: Options) => toast(message, opts(o, TOAST_MS)),
  warning: (message: string, o?: Options) => toast.warning(message, opts(o, TOAST_MS)),
  error: (message: string, o?: Options) => toast.error(message, opts(o, ERROR_MS)),
};
