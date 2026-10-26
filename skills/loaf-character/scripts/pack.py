#!/usr/bin/env python3
"""Loaf character pack tools: assemble row strips into a sheet, and check a finished pack.

  python3 pack.py assemble <strips-dir> <out-dir> --id mochi --name Mochi --description "Mochi, the cat"
  python3 pack.py check <pack-dir>

Needs Pillow (pip install pillow). Nothing is uploaded anywhere.
The format is docs/character/CHARACTER_STANDARD.md (Codex / OpenPets V1: 8 columns x 9 rows of 192x208).
"""
import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image

CELL_W, CELL_H, COLUMNS = 192, 208, 8
ROWS = [  # name, frames
    ("idle", 6), ("running-right", 8), ("running-left", 8), ("waving", 4), ("jumping", 5),
    ("failed", 8), ("waiting", 6), ("running", 6), ("review", 6),
]
SHEET = (CELL_W * COLUMNS, CELL_H * len(ROWS))  # 1536 x 1872
ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


def assemble(strips: Path, out: Path, pack_id: str, name: str, description: str) -> list[str]:
    """Paste `<row-name>.png` strips (one per row, frames left to right) into one sheet."""
    problems: list[str] = []
    if not ID_RE.match(pack_id) or pack_id in (".", ".."):
        problems.append("id must be 1-64 characters: letters, digits, - _ .")
    sheet = Image.new("RGBA", SHEET, (0, 0, 0, 0))
    for i, (row, frames) in enumerate(ROWS):
        path = strips / f"{row}.png"
        if not path.exists():
            problems.append(f"missing strip {path.name}")
            continue
        strip = Image.open(path).convert("RGBA")
        want = (CELL_W * frames, CELL_H)
        if strip.size != want:
            problems.append(f"{path.name} is {strip.size[0]}x{strip.size[1]}, expected {want[0]}x{want[1]} ({frames} frames)")
            continue
        sheet.paste(strip, (0, i * CELL_H))
    if problems:
        return problems
    out.mkdir(parents=True, exist_ok=True)
    sheet.save(out / "spritesheet.webp", "WEBP", lossless=True)
    (out / "pet.json").write_text(json.dumps({
        "id": pack_id, "displayName": name, "description": description, "spritesheetPath": "spritesheet.webp",
    }, indent=2) + "\n", encoding="utf-8")
    return check(out)


def check(pack: Path) -> list[str]:
    """Everything Loaf's importer checks, plus the art rules it cannot see. Empty list = good."""
    problems: list[str] = []
    meta_path = pack / "pet.json"
    if not meta_path.exists():
        return ["pet.json is missing"]
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except ValueError:
        return ["pet.json is not valid JSON"]
    pid = str(meta.get("id", ""))
    if not ID_RE.match(pid) or pid in (".", ".."):
        problems.append("pet.json: id must be 1-64 characters: letters, digits, - _ .")
    if not str(meta.get("displayName", "")).strip():
        problems.append("pet.json: displayName is empty")
    if meta.get("spritesheetPath") not in ("spritesheet.webp", "spritesheet.svg"):
        problems.append("pet.json: spritesheetPath must be spritesheet.webp or spritesheet.svg")
    sheet = pack / "spritesheet.webp"
    if not sheet.exists():
        problems.append("spritesheet.webp is missing (an SVG sheet cannot be checked here)")
        return problems
    img = Image.open(sheet).convert("RGBA")
    if img.size != SHEET:
        problems.append(f"sheet is {img.size[0]}x{img.size[1]}, expected {SHEET[0]}x{SHEET[1]}")
        return problems
    alpha = img.getchannel("A")
    if alpha.getextrema()[0] == 255:
        problems.append("the background is not transparent")
    for i, (row, frames) in enumerate(ROWS):
        boxes = []
        for col in range(COLUMNS):
            cell = alpha.crop((col * CELL_W, i * CELL_H, (col + 1) * CELL_W, (i + 1) * CELL_H))
            box = cell.point(lambda v: 255 if v > 8 else 0).getbbox()
            if col < frames:
                if box is None:
                    problems.append(f"row {i + 1} ({row}): frame {col + 1} is empty")
                else:
                    boxes.append(box)
                    if box[0] <= 0 or box[2] >= CELL_W or box[1] <= 0 or box[3] >= CELL_H:
                        problems.append(f"row {i + 1} ({row}): frame {col + 1} touches the cell edge and may be cut off")
            elif box is not None:
                problems.append(f"row {i + 1} ({row}): column {col + 1} should be empty (the row has {frames} frames)")
        if boxes:
            feet = [b[3] for b in boxes]
            if row != "jumping" and max(feet) - min(feet) > 12:
                problems.append(f"row {i + 1} ({row}): the feet move up and down ({min(feet)}-{max(feet)} px); keep one baseline")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("assemble")
    a.add_argument("strips", type=Path)
    a.add_argument("out", type=Path)
    a.add_argument("--id", required=True)
    a.add_argument("--name", required=True)
    a.add_argument("--description", default="")
    c = sub.add_parser("check")
    c.add_argument("pack", type=Path)
    args = ap.parse_args()
    problems = assemble(args.strips, args.out, args.id, args.name, args.description) if args.cmd == "assemble" else check(args.pack)
    if problems:
        print("Not ready:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("OK: the pack passes. Drop the folder into Loaf > Character > Import pet folder, or copy it to ~/.codex/pets/<id>/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
