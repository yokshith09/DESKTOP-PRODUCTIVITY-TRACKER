/**
 * The formatting buttons in the note editor (owner 2026-10-25: numbering, bold, font). Notes are
 * Markdown, so each button writes the Markdown for it; Preview shows the result. Pure functions:
 * text and selection in, text and new selection out.
 */
export interface Edit { text: string; start: number; end: number }

/** Bold (`**`) or italic (`_`) around the selection; again on a wrapped selection removes it. */
export function wrap(e: Edit, mark: string): Edit {
  const { text, start, end } = e;
  const before = text.slice(start - mark.length, start);
  const after = text.slice(end, end + mark.length);
  if (before === mark && after === mark) {
    return { text: text.slice(0, start - mark.length) + text.slice(start, end) + text.slice(end + mark.length), start: start - mark.length, end: end - mark.length };
  }
  return { text: text.slice(0, start) + mark + text.slice(start, end) + mark + text.slice(end), start: start + mark.length, end: end + mark.length };
}

export type LineKind = "number" | "bullet" | "check" | "heading";

const PREFIX = /^(\d+\.\s|[-*]\s\[[ xX]\]\s|[-*]\s|#{1,6}\s)/;

/** Turn every line the selection touches into a numbered, bulleted, checklist or heading line. Again removes it. */
export function lines(e: Edit, kind: LineKind): Edit {
  const { text, start, end } = e;
  const from = text.lastIndexOf("\n", start - 1) + 1;
  const nl = text.indexOf("\n", end);
  const to = nl === -1 ? text.length : nl;
  const block = text.slice(from, to).split("\n");
  const want = (i: number) => (kind === "number" ? `${i + 1}. ` : kind === "bullet" ? "- " : kind === "check" ? "- [ ] " : "## ");
  const has = (l: string) =>
    kind === "number" ? /^\d+\.\s/.test(l) : kind === "check" ? /^[-*]\s\[[ xX]\]\s/.test(l) : kind === "bullet" ? /^[-*]\s(?!\[[ xX]\]\s)/.test(l) : /^#{1,6}\s/.test(l);
  const allHave = block.every((l) => l === "" || has(l));
  const out = block.map((l, i) => (allHave ? l.replace(PREFIX, "") : want(i) + l.replace(PREFIX, ""))).join("\n");
  const next = text.slice(0, from) + out + text.slice(to);
  return { text: next, start: from, end: from + out.length };
}

export type NoteFont = "sans" | "serif" | "mono";
export const NOTE_FONTS: { value: NoteFont; label: string }[] = [
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
];
export const fontClass = (f: NoteFont | null | undefined) =>
  f === "serif" ? "font-serif" : f === "mono" ? "font-mono" : "";
