/**
 * Sprite-pack layout (FR-50). One atlas per character: 8 columns x 9 rows of 192x208 cells,
 * plus a `pet.json`. The row names and frame counts follow the OpenPets / Codex "hatch-pet"
 * layout as we understand it (unconfirmed: the OpenPets site could not be fetched, D-SIZE).
 *
 * Our art does not cover every row. Each row says where its frames come from:
 *  - `drawn`   : a pose we drew (possibly with a small bob/shift),
 *  - `mirrored`: the drawn right-facing art flipped, with the gradients re-lit so the key light
 *                stays top left (standard sprite practice for a left-facing run),
 *  - `derived` : a transform of drawn art (hop, shake) with no new drawing. No row uses it now;
 *                the Studio shows such a row as "needs art".
 */
export const CELL_W = 192;
export const CELL_H = 208;
export const COLS = 8;

export type RowSource = "drawn" | "mirrored" | "derived";
export interface RowSpec {
  name: string;
  frames: number;
  pose: string;
  source: RowSource;
  /** Per-frame transform in cell units, t runs 0..1 across the row. */
  motion: (t: number) => { dx: number; dy: number; rot: number; flip?: boolean; sy?: number };
}

const bob = (amp: number) => (t: number) => ({ dx: 0, dy: -Math.abs(Math.sin(t * Math.PI)) * amp, rot: 0 });
const still = () => ({ dx: 0, dy: 0, rot: 0 });

export const ROWS: readonly RowSpec[] = [
  { name: "idle", frames: 6, pose: "idle", source: "drawn", motion: bob(2) },
  { name: "running-right", frames: 8, pose: "turn", source: "drawn", motion: (t) => ({ dx: 0, dy: -Math.abs(Math.sin(t * Math.PI * 2)) * 4, rot: 0 }) },
  { name: "running-left", frames: 8, pose: "turn", source: "mirrored", motion: (t) => ({ dx: 0, dy: -Math.abs(Math.sin(t * Math.PI * 2)) * 4, rot: 0, flip: true }) },
  { name: "waving", frames: 4, pose: "cheer", source: "drawn", motion: still },
  // Crouch on the first and last frame (squash), stretch while rising.
  { name: "jumping", frames: 5, pose: "jump", source: "drawn", motion: (t) => ({ dx: 0, dy: -Math.sin(t * Math.PI) * 28, rot: 0, sy: t === 0 || t === 1 ? 0.9 : t === 0.25 ? 1.06 : 1 }) },
  // Slumps a little and sways side to side.
  { name: "failed", frames: 8, pose: "sad", source: "drawn", motion: (t) => ({ dx: Math.sin(t * Math.PI * 2) * 2, dy: Math.min(t * 8, 3), rot: Math.sin(t * Math.PI * 2) * 3 }) },
  { name: "waiting", frames: 6, pose: "wait", source: "drawn", motion: bob(1) },
  { name: "running", frames: 6, pose: "type", source: "drawn", motion: bob(2) },
  { name: "review", frames: 6, pose: "review", source: "drawn", motion: (t) => ({ dx: 0, dy: 0, rot: Math.sin(t * Math.PI * 2) * 2 }) },
] as const;

export const ROW_COUNT = ROWS.length;
export const ATLAS_W = COLS * CELL_W;
export const ATLAS_H = ROW_COUNT * CELL_H;

export function frameTransform(row: number, frame: number): string {
  const spec = ROWS[row];
  if (!spec) throw new RangeError(`no such sprite row: ${row}`);
  const m = spec.motion(spec.frames > 1 ? frame / (spec.frames - 1) : 0);
  const s = CELL_W / 200; // art is 200x200
  const cx = CELL_W / 2;
  const x = col(frame) * CELL_W + m.dx;
  const y = row * CELL_H + 8 + m.dy;
  const flip = m.flip ? ` translate(${cx},0) scale(-1,1) translate(${-cx},0)` : "";
  const feet = 188 * s;
  const squash = m.sy && m.sy !== 1 ? ` translate(0,${feet}) scale(${2 - m.sy},${m.sy}) translate(0,${-feet})` : "";
  return `translate(${x},${y}) ${flip}${squash} rotate(${m.rot},${cx},${100 * s}) scale(${s})`;
}

/**
 * Re-light art that will be drawn mirrored: flip every gradient's horizontal position so that,
 * after the mirror, the key light is back at the top left.
 */
export function relightForMirror(svg: string): string {
  const flipPct = (v: string) => `${100 - Number(v)}%`;
  return svg
    .replace(/<radialGradient[^>]*>/g, (tag) => tag.replace(/\b(cx|fx)="(\d+(?:\.\d+)?)%"/g, (_m, k: string, v: string) => `${k}="${flipPct(v)}"`))
    .replace(/<linearGradient[^>]*>/g, (tag) => tag.replace(/\bx1="([^"]+)"([^>]*)\bx2="([^"]+)"/, (_m, a: string, mid: string, b: string) => `x1="${b}"${mid}x2="${a}"`));
}

const col = (frame: number) => frame;

export interface PackManifest {
  id: string;
  displayName: string;
  description: string;
  spritesheetPath: string;
  cell: { width: number; height: number };
  columns: number;
  rows: { name: string; frames: number; pose: string; source: RowSource }[];
  license: string;
  status: "Unverified";
}

export function buildManifest(id: string, displayName: string, description: string): PackManifest {
  return {
    id, displayName, description,
    spritesheetPath: "spritesheet.png",
    cell: { width: CELL_W, height: CELL_H },
    columns: COLS,
    rows: ROWS.map((r) => ({ name: r.name, frames: r.frames, pose: r.pose, source: r.source })),
    license: "CC BY 4.0, credit QUORBIT TECHNOLOGIES (auto-chosen 2026-10-22, owner may change)",
    status: "Unverified",
  };
}
