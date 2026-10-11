import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isTauri } from "@tauri-apps/api/core";
import { Bear, type BearPose } from "@/features/shell/Bear";
import { useSettings, useTodayTasks } from "@/hooks/useLoaf";
import { useTheme } from "@/hooks/useTheme";
import { ipc, onEvent, type TaskRow } from "@/ipc";
import { cn } from "@/lib/utils";
import { PetCard } from "./PetCard";
import { enqueue, newlyOverdue, reactionFor, type Reaction } from "./reactions";

/** Card and bubble sizes in logical pixels; the shell grows the window by this much. */
export const CARD_W = 300;
export const CARD_H = 296; // measured: 291 px with 3 apps and 2 tasks
export const BUBBLE_W = 220;
export const BUBBLE_H = 52;
const SIZES = { S: 96, M: 128, L: 160 } as const;
const DOUBLE_CLICK_MS = 260;
const DRAG_PX = 4;
/** How often the pet looks for tasks that have just gone overdue. */
const OVERDUE_CHECK_MS = 60_000;

type Anchor = { pet: "left" | "right"; card: "above" | "below" };
type Panel = "card" | "bubble" | null;

const sleepy = (d = new Date()) => d.getHours() >= 23 || d.getHours() < 6;

/**
 * The desktop pet. Click opens the dashboard, double-click hides it, right-click opens the
 * menu, drag moves it, hover shows today at a glance. It reacts to tasks and reminders with a
 * short animation and a speech bubble (see reactions.ts).
 */
export function PetApp() {
  useTheme();
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const { data: openToday = [] } = useTodayTasks();
  const size = SIZES[settings?.["pet.size"] ?? "M"];
  const opacity = (settings?.["pet.opacity"] ?? 100) / 100;
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [hovering, setHovering] = useState(false);
  const [hop, setHop] = useState(false);
  const [playing, setPlaying] = useState<Reaction | null>(null);
  const timers = useRef<{ enter?: number | undefined; leave?: number | undefined; click?: number | undefined; play?: number | undefined }>({});
  const press = useRef<{ x: number; y: number } | null>(null);
  const queue = useRef<Reaction[]>([]);
  const tasks = useRef<TaskRow[]>(openToday);
  const overdueSeen = useRef(new Set<string>());
  const hoverRef = useRef(false);
  const panelRef = useRef<Panel>(null);
  tasks.current = openToday;
  hoverRef.current = hovering;
  panelRef.current = panel;

  const expand = async (next: Exclude<Panel, null>) => {
    const [w, h] = next === "card" ? [CARD_W, CARD_H] : [BUBBLE_W, BUBBLE_H];
    const a = await ipc.petHover(true, w, h);
    if (a) {
      setAnchor(a);
      setPanel(next);
    }
  };
  const collapse = async () => {
    setAnchor(null);
    setPanel(null);
    await ipc.petHover(false, 0, 0);
  };

  // Play the next waiting reaction: pose for its duration, bubble unless the card is open.
  const playingRef = useRef<Reaction | null>(null);
  const playNext = () => {
    const [next, ...rest] = queue.current;
    queue.current = rest;
    playingRef.current = next ?? null;
    setPlaying(next ?? null);
    if (!next) {
      if (panelRef.current === "bubble") void collapse();
      return;
    }
    if (!hoverRef.current) void expand("bubble");
    timers.current.play = window.setTimeout(playNext, next.ms);
  };
  const reactRef = useRef((r: Reaction | null) => {
    if (!r) return;
    queue.current = enqueue(queue.current, r);
    if (!playingRef.current) playNext();
  });

  // Keep the card fresh, and react to what happens in Loaf.
  useEffect(() => onEvent((e) => {
    reactRef.current(reactionFor(e, { openToday: tasks.current }));
    void qc.invalidateQueries();
  }), [qc]);

  // Overdue is about the clock, not an event: look once a minute.
  useEffect(() => {
    const id = window.setInterval(() => void qc.invalidateQueries({ queryKey: ["tasks"] }), OVERDUE_CHECK_MS);
    return () => clearInterval(id);
  }, [qc]);
  useEffect(() => {
    const fresh = newlyOverdue(openToday, overdueSeen.current);
    if (fresh[0]) reactRef.current(reactionFor({ type: "TaskOverdue", title: fresh[0].task.title, count: fresh.length }, { openToday }));
  }, [openToday]);

  useEffect(() => () => Object.values(timers.current).forEach((t) => clearTimeout(t)), []);

  const openCard = async () => {
    clearTimeout(timers.current.leave);
    if (panelRef.current === "card") return;
    await expand("card");
  };
  const closeCard = async () => {
    clearTimeout(timers.current.enter);
    if (panelRef.current !== "card") return;
    // A reaction still playing gets its bubble back.
    if (playingRef.current) await expand("bubble");
    else await collapse();
  };

  const onEnter = () => {
    setHovering(true);
    clearTimeout(timers.current.leave);
    timers.current.enter = window.setTimeout(() => void openCard(), 350);
  };
  const onLeave = () => {
    setHovering(false);
    clearTimeout(timers.current.enter);
    timers.current.leave = window.setTimeout(() => void closeCard(), 250);
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
      await collapse();
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

  const working = openToday.some((r) => r.task.status === "IN_PROGRESS");
  const pose: BearPose = playing?.pose ?? (hovering ? "wave" : sleepy() ? "sleep" : working ? "work" : "idle");
  const bear = (
    <button
      type="button" aria-label="Loaf. Click to open, double-click to hide, right-click for options"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onContextMenu={(e) => { e.preventDefault(); void ipc.petMenu(); }}
      onAnimationEnd={(e) => e.target === e.currentTarget && setHop(false)}
      className={cn("shrink-0 cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", hop && "pet-hop")}
      style={{ width: size, height: size, opacity }}
    >
      {/* key: a new reaction restarts its animation even when the pose repeats. */}
      <Bear key={playing ? `${playing.pose}-${playing.bubble}` : pose} pose={pose} animated className="pointer-events-none size-full" />
    </button>
  );

  const extra = panel === "card"
    ? <PetCard className="shrink-0" style={{ width: CARD_W, height: CARD_H }} />
    : panel === "bubble" && playing
      ? <Bubble text={playing.bubble} anchor={anchor} />
      : null;

  return (
    <div className="flex h-screen w-screen select-none flex-col overflow-hidden" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <p className="sr-only" role="status">{playing?.bubble ?? ""}</p>
      {anchor && extra ? (
        <div className={cn("flex h-full flex-col gap-2", anchor.card === "below" && "flex-col-reverse", anchor.pet === "right" ? "items-end" : "items-start")}>
          {extra}
          {bear}
        </div>
      ) : (
        <div className="grid h-full place-items-center">{bear}</div>
      )}
    </div>
  );
}

/** A short line from the pet, pointing at it. */
function Bubble({ text, anchor }: { text: string; anchor: Anchor | null }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pet-bubble-in relative flex shrink-0 items-center rounded-2xl border bg-popover px-3.5 text-[12.5px] font-medium leading-tight text-popover-foreground shadow-lg",
        anchor?.pet === "right" ? "rounded-br-md" : "rounded-bl-md",
      )}
      style={{ width: BUBBLE_W, height: BUBBLE_H }}
    >
      <span className="line-clamp-2">{text}</span>
    </div>
  );
}
