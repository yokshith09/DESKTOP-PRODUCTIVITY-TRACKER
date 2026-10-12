import { useEffect, useRef, useState } from "react";
import { onTyping } from "@/ipc";

/**
 * Typing along (`pet.typing`). The shell says when you start and stop typing; this turns that
 * into what the pet shows:
 *
 *   off ──start──▶ type ──stop──▶ wait ──WAIT_MS──▶ stow ──STOW_MS──▶ off
 *                   ▲               │
 *                   └────start──────┘
 *
 * `type`: the laptop comes out of the pocket and the paws tap. `wait`: it stops and looks up at
 * you, laptop still open, in case you carry on. `stow`: it puts the laptop back.
 */
export type TypingPhase = "off" | "type" | "wait" | "stow";

/** How long it keeps the laptop out, looking at you, after you stop typing. */
export const WAIT_MS = 20_000;
/** How long putting the laptop away takes (matches `.pet-laptop-away`). */
export const STOW_MS = 500;

export function useTypingAlong(enabled: boolean, subscribe: typeof onTyping = onTyping): TypingPhase {
  const [phase, setPhaseState] = useState<TypingPhase>("off");
  const current = useRef<TypingPhase>("off");
  const timer = useRef<number | undefined>(undefined);
  const setPhase = (p: TypingPhase) => {
    current.current = p;
    setPhaseState(p);
  };

  useEffect(() => {
    if (!enabled) {
      setPhase("off");
      return;
    }
    const after = (ms: number, next: TypingPhase, then?: () => void) => {
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setPhase(next);
        then?.();
      }, ms);
    };
    const off = subscribe((typing) => {
      if (typing) {
        clearTimeout(timer.current);
        setPhase("type");
        return;
      }
      if (current.current !== "type") return;
      setPhase("wait");
      after(WAIT_MS, "stow", () => after(STOW_MS, "off"));
    });
    return () => {
      off();
      clearTimeout(timer.current);
    };
  }, [enabled, subscribe]);

  return enabled ? phase : "off";
}
