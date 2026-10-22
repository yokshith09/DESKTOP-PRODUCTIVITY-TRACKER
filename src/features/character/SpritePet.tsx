import { useEffect, useState } from "react";
import type { BearPose } from "@/features/shell/Bear";
import { cn } from "@/lib/utils";

/**
 * Plays a Codex / OpenPets pet pack (FR-63). The sheet is 8 columns of 192x208 cells; each row
 * is one animation. Frame counts and durations match OpenPets (`reaction-animation-mapping.ts`),
 * so a pack looks the same here as in their app.
 */
export const SPRITE_ROWS = {
  idle: { row: 0, frames: 6, ms: 5500 },
  "running-right": { row: 1, frames: 8, ms: 1060 },
  "running-left": { row: 2, frames: 8, ms: 1060 },
  waving: { row: 3, frames: 4, ms: 700 },
  jumping: { row: 4, frames: 5, ms: 840 },
  failed: { row: 5, frames: 8, ms: 1220 },
  waiting: { row: 6, frames: 6, ms: 1200 },
  running: { row: 7, frames: 6, ms: 820 },
  review: { row: 8, frames: 6, ms: 1030 },
} as const;
export type SpriteRow = keyof typeof SPRITE_ROWS;

/** What a pack plays for each of the bear's poses, so reactions work with any pet. */
export const ROW_FOR_POSE: Record<BearPose, SpriteRow> = {
  idle: "idle", sleep: "idle", turn: "running-right", back: "idle", back_look: "idle",
  wave: "waving", cheer: "jumping", party: "jumping", jump: "jumping",
  work: "running", type: "running", stow: "waiting", wait: "waiting", ring: "waving",
  catch: "review", review: "review", toss: "waving", worried: "failed", sad: "failed",
};

/** Which frame shows `elapsed` ms into a row that loops. */
export function frameAt(row: SpriteRow, elapsed: number): number {
  const { frames, ms } = SPRITE_ROWS[row];
  return Math.floor(((elapsed % ms) / ms) * frames);
}

export function SpritePet({ sheet, row = "idle", animated = true, size = 128, className, label }: {
  sheet: string; row?: SpriteRow; animated?: boolean; size?: number; className?: string; label: string;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    setFrame(0);
    if (!animated) return;
    const { frames, ms } = SPRITE_ROWS[row];
    // One timer per frame step, only while shown; no work between frames.
    let i = 0;
    const id = window.setInterval(() => { i = (i + 1) % frames; setFrame(i); }, ms / frames);
    return () => window.clearInterval(id);
  }, [row, animated]);
  const { row: r } = SPRITE_ROWS[row];
  const scale = size / 208;
  return (
    <div
      role="img"
      aria-label={label}
      data-row={row}
      data-frame={frame}
      className={cn("shrink-0", className)}
      style={{
        width: 192 * scale,
        height: size,
        backgroundImage: `url("${sheet}")`,
        backgroundSize: `${1536 * scale}px auto`,
        backgroundPosition: `${-frame * 192 * scale}px ${-r * 208 * scale}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "auto",
      }}
    />
  );
}
