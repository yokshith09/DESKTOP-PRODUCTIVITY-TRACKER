import { describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT, WIDTH_CLASS, parseLayout } from "./tileLayout";

describe("Time tile layout (FR-44)", () => {
  it("defaults to the wide list and survives broken prefs", () => {
    expect(parseLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout({ width: "huge", height: "tall" })).toEqual({ width: "wide", height: "tall" });
  });
  it("always fills the 12-column row with no gap", () => {
    for (const [a, b] of Object.values(WIDTH_CLASS)) {
      const n = (c: string) => Number(c.split("-").pop());
      expect(n(a) + n(b) === 12 || (n(a) === 12 && n(b) === 12)).toBe(true);
    }
  });
});
