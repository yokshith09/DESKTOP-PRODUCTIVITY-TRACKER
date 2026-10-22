/**
 * Sprite-pack layout (FR-50). One atlas per character: 8 columns x 9 rows of 192x208 cells,
 * plus a `pet.json`. The row names and frame counts follow the OpenPets / Codex "hatch-pet"
 * layout as we understand it (unconfirmed: the OpenPets site could not be fetched, D-SIZE).
 *
 * Our art does not cover every row. Each row says where its frames come from:
 *  - `drawn`   : a pose we drew (possibly with a small bob/shift),
 *  - `derived` : a transform of drawn art (mirror, hop, shake). Honest placeholder, not new art.
 * The Studio shows `derived` rows as "needs art" so nobody mistakes them for finished animation.
 */
export const CELL_W = 192;
export const CELL_H = 208;
export const COLS = 8;

export type RowSource = "drawn" | "derived";
export interface RowSpec {
  name: string;
  frames: number;
  pose: string;
  source: RowSource;
  /** Per-frame transform in cell units, t runs 0..1 across the row. */
  motion: (t: number) => { dx: number; dy: number; rot: number; flip?: boolean };
}

const bob = (amp: number) => (t: number) => ({ dx: 0, dy: -Math.abs(Math.sin(t * Math.PI)) * amp, rot: 0 });
const still = () => ({ dx: 0, dy: 0, rot: 0 });

export const ROWS: readonly RowSpec[] = [
  { name: "idle", frames: 6, pose: "idle", source: "drawn", motion: bob(2) },
  { name: "running-right", frames: 8, pose: "turn", source: "drawn", motion: (t) => ({ dx: 0, dy: -Math.abs(Math.sin(t * Math.PI * 2)) * 4, rot: 0 }) },
  { name: "running-left", frames: 8, pose: "turn", source: "derived", motion: (t) => ({ dx: 0, dy: -Math.abs(Math.sin(t * Math.PI * 2)) * 4, rot: 0, flip: true }) },
  { name: "waving", frames: 4, pose: "cheer", source: "drawn", motion: still },
  { name: "jumping", frames: 5, pose: "cheer", source: "derived", motion: (t) => ({ dx: 0, dy: -Math.sin(t * Math.PI) * 28, rot: 0 }) },
  { name: "failed", frames: 8, pose: "idle", source: "derived", motion: (t) => ({ dx: Math.sin(t * Math.PI * 8) * 3, dy: 0, rot: Math.sin(t * Math.PI * 8) * 2 }) },
  { name: "waiting", frames: 6, pose: "wait", source: "drawn", motion: bob(1) },
  { name: "running", frames: 6, pose: "type", source: "drawn", motion: bob(2) },
  { name: "review", frames: 6, pose: "type", source: "derived", motion: still },
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
  return `translate(${x},${y}) ${flip} rotate(${m.rot},${cx},${100 * s}) scale(${s})`;
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
    license: "Project art, licence undecided (D-LICENCE)",
    status: "Unverified",
  };
}
