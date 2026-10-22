import { describe, expect, it } from "vitest";
import { ATLAS_H, ATLAS_W, COLS, ROWS, buildManifest, frameTransform } from "./spritePack";

describe("sprite pack layout", () => {
  it("is 8 columns x 9 rows of 192x208 cells", () => {
    expect(ROWS).toHaveLength(9);
    expect(ATLAS_W).toBe(1536);
    expect(ATLAS_H).toBe(1872);
  });
  it("never has more frames than columns", () => {
    for (const r of ROWS) expect(r.frames).toBeLessThanOrEqual(COLS);
  });
  it("uses the expected frame counts", () => {
    expect(ROWS.map((r) => r.frames)).toEqual([6, 8, 8, 4, 5, 8, 6, 6, 6]);
  });
  it("marks rows that are transforms of other art as derived", () => {
    const m = buildManifest("x", "X", "d");
    expect(m.rows.find((r) => r.name === "running-left")?.source).toBe("derived");
    expect(m.rows.find((r) => r.name === "idle")?.source).toBe("drawn");
    expect(m.status).toBe("Unverified");
  });
  it("places frames inside their cell", () => {
    expect(frameTransform(0, 0)).toContain("translate(0,8)");
    expect(frameTransform(2, 1)).toContain("scale(-1,1)");
  });
});
