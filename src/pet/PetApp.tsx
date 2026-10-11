import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isTauri } from "@tauri-apps/api/core";
import { Bear, type BearPose } from "@/features/shell/Bear";
import { useSettings } from "@/hooks/useLoaf";
import { useTheme } from "@/hooks/useTheme";
import { ipc, onEvent } from "@/ipc";
import { cn } from "@/lib/utils";
import { PetCard } from "./PetCard";

/** Card size in logical pixels; the shell grows the window by this much. */
export const CARD_W = 300;
export const CARD_H = 262;
const SIZES = { S: 96, M: 128, L: 160 } as const;
const DOUBLE_CLICK_MS = 260;
const DRAG_PX = 4;

type Anchor = { pet: "left" | "right"; card: "above" | "below" };

const sleepy = (d = new Date()) => d.getHours() >= 23 || d.getHours() < 6;

/**
 * The desktop pet. Click opens the dashboard, double-click hides it, right-click opens the
 * menu, drag moves it, hover shows today at a glance.
 */
export function PetApp() {
  useTheme();
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const size = SIZES[settings?.["pet.size"] ?? "M"];
  const opacity = (settings?.["pet.opacity"] ?? 100) / 100;
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [hovering, setHovering] = useState(false);
  const [hop, setHop] = useState(false);
  const timers = useRef<{ enter?: number | undefined; leave?: number | undefined; click?: number | undefined }>({});
  const press = useRef<{ x: number; y: number } | null>(null);

  // Keep the card fresh: any change in Loaf refetches what it shows.
  useEffect(() => onEvent(() => void qc.invalidateQueries()), [qc]);
  useEffect(() => () => Object.values(timers.current).forEach((t) => clearTimeout(t)), []);

  const open = async () => {
    clearTimeout(timers.current.leave);
    if (anchor) return;
    const a = await ipc.petHover(true, CARD_W, CARD_H);
    if (a) setAnchor(a);
  };
  const close = async () => {
    clearTimeout(timers.current.enter);
    if (!anchor) return;
    setAnchor(null);
    await ipc.petHover(false, 0, 0);
  };

  const onEnter = () => {
    setHovering(true);
    clearTimeout(timers.current.leave);
    timers.current.enter = window.setTimeout(() => void open(), 350);
  };
  const onLeave = () => {
    setHovering(false);
    clearTimeout(timers.current.enter);
    timers.current.leave = window.setTimeout(() => void close(), 250);
  };

  const click = () => {
    if (timers.current.click) {
      clearTimeout(timers.current.click);
      timers.current.click = undefined;
      void ipc.petDoubleClick();
      return;
    }
    timers.current.click = window.setTimeout(() => {
      timers.current.click = undefined;
      setHop(true);
      void ipc.petClick();
    }, DOUBLE_CLICK_MS);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Only the primary button starts a click or a drag. (jsdom leaves `button` unset.)
    if (e.button !== undefined && e.button !== 0) return;
    press.current = { x: e.screenX ?? 0, y: e.screenY ?? 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = press.current;
    if (!p || !(e.buttons & 1) || Math.hypot(e.screenX - p.x, e.screenY - p.y) < DRAG_PX) return;
    press.current = null;
    void (async () => {
      await close();
      if (isTauri()) {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().startDragging();
      }
    })();
  };
  const onPointerUp = () => {
    if (press.current) click();
    press.current = null;
  };

  const pose: BearPose = hovering ? "wave" : sleepy() ? "sleep" : "idle";
  const bear = (
    <button
      type="button" aria-label="Loaf. Click to open, double-click to hide, right-click for options"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onContextMenu={(e) => { e.preventDefault(); void ipc.petMenu(); }}
      onAnimationEnd={() => setHop(false)}
      className={cn("shrink-0 cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", hop && "pet-hop")}
      style={{ width: size, height: size, opacity }}
    >
      <Bear pose={pose} animated className="pointer-events-none size-full" />
    </button>
  );

  return (
    <div className="flex h-screen w-screen select-none flex-col" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {anchor ? (
        <div className={cn("flex h-full flex-col gap-2", anchor.card === "below" && "flex-col-reverse")}>
          <PetCard className="shrink-0" />
          <div className={cn("flex", anchor.pet === "right" ? "justify-end" : "justify-start")}>{bear}</div>
        </div>
      ) : (
        <div className="grid h-full place-items-center">{bear}</div>
      )}
    </div>
  );
}
