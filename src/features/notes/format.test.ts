import { describe, expect, it } from "vitest";
import { lines, wrap } from "./format";

describe("note formatting", () => {
  it("bolds the selection and un-bolds it again", () => {
    const b = wrap({ text: "make this bold", start: 5, end: 9 }, "**");
    expect(b.text).toBe("make **this** bold");
    expect(b.text.slice(b.start, b.end)).toBe("this");
    expect(wrap(b, "**").text).toBe("make this bold");
  });

  it("with nothing selected, puts the marks at the cursor", () => {
    const b = wrap({ text: "ab", start: 1, end: 1 }, "_");
    expect(b).toEqual({ text: "a__b", start: 2, end: 2 });
  });

  it("numbers every selected line, and a second press removes the numbers", () => {
    const text = "intro\nfirst\nsecond\noutro";
    const n = lines({ text, start: 7, end: 15 }, "number");
    expect(n.text).toBe("intro\n1. first\n2. second\noutro");
    expect(lines(n, "number").text).toBe(text);
  });

  it("switches a bullet list to a checklist", () => {
    const b = lines({ text: "a\nb", start: 0, end: 3 }, "bullet");
    expect(b.text).toBe("- a\n- b");
    expect(lines(b, "check").text).toBe("- [ ] a\n- [ ] b");
  });

  it("makes a heading of the current line", () => {
    expect(lines({ text: "Plan\nbody", start: 2, end: 2 }, "heading").text).toBe("## Plan\nbody");
  });
});
