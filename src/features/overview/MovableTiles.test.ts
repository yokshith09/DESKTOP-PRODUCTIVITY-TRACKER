import { describe, expect, it } from "vitest";
import { cleanOrder, DEFAULT_ORDER } from "./MovableTiles";

describe("cleanOrder", () => {
  it("keeps a valid saved order", () => {
    expect(cleanOrder(["links", "agenda", "time", "focus", "routine"])).toEqual(["links", "agenda", "time", "focus", "routine"]);
  });
  it("drops unknown and repeated ids and appends missing ones", () => {
    // "activity" and "done" were removed on 2026-10-25; a saved order that has them still works.
    expect(cleanOrder(["time", "nope", "time", "done", "activity"])).toEqual(["time", "agenda", "focus", "routine", "links"]);
  });
  it("falls back to the default for junk", () => {
    expect(cleanOrder(null)).toEqual(DEFAULT_ORDER);
    expect(cleanOrder("x")).toEqual(DEFAULT_ORDER);
  });
});
