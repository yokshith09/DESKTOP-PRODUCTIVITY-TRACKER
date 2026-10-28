#!/usr/bin/env python3
"""Loaf character pack tools: assemble row strips into a sheet, and check a finished pack.

  python3 pack.py build <strips-dir> <out-dir> --id mochi --name Mochi [--description ".."] [--extras loaf.json] [--mirror-left]
      Loose strips from an image tool (any size, flat background or transparent) -> aligned pack,
      checked, with <out-dir>/<id>.zip ready to import into Loaf, and a QA contact sheet.
  python3 pack.py prepare <run-dir> --name Mochi [--id mochi] [--reference picture.png]
      Writes the background colour, layout guides and ten finished image prompts (jobs.json).
  python3 pack.py status <run-dir>        which pictures are still missing
  python3 pack.py finish <run-dir> [--extras loaf.json] [--mirror-left]
      = build from <run-dir>/strips into <run-dir>/out: <id>.zip, the folder, qa/contact-sheet.png
  python3 pack.py assemble <strips-dir> <out-dir> --id mochi --name Mochi   (strips already exactly 192*frames x 208)
  python3 pack.py check <pack-dir>

Needs Pillow (pip install pillow). Nothing is uploaded anywhere.
The format is docs/character/CHARACTER_STANDARD.md (Codex / OpenPets V1: 8 columns x 9 rows of 192x208).
"""
import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

from PIL import Image, ImageOps

import align
import prep

CELL_W, CELL_H, COLUMNS = 192, 208, 8
ROWS = [  # name, frames
    ("idle", 6), ("running-right", 8), ("running-left", 8), ("waving", 4), ("jumping", 5),
    ("failed", 8), ("waiting", 6), ("running", 6), ("review", 6),
]
SHEET = (CELL_W * COLUMNS, CELL_H * len(ROWS))  # 1536 x 1872
ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


FEET_JITTER, CENTRE_JITTER, SIZE_POP = 3, 8, 0.18
POSES = ("idle wave sleep work type wait stow cheer party catch worried ring toss jump sad review turn back back_look").split()
MOMENTS = ("task-added", "task-started", "task-done", "all-done", "task-deleted", "reminder", "focus-done")
LOOPS_MS = {"idle": 5500, "running-right": 1060, "running-left": 1060, "waving": 700, "jumping": 840,
            "failed": 1220, "waiting": 1200, "running": 820, "review": 1030}


def _alignment(i: int, row: str, boxes: list[tuple[int, int, int, int]], alpha: Image.Image) -> list[str]:
    """The rules that stop a row from jittering: one baseline, one centre, one size."""
    out: list[str] = []
    tag = f"row {i + 1} ({row})"
    feet = [b[3] for b in boxes]
    heights = [b[3] - b[1] for b in boxes]
    if row != "jumping":
        if max(feet) - min(feet) > FEET_JITTER:
            out.append(f"{tag}: the feet move up and down ({min(feet)}-{max(feet)} px); every frame must stand on one baseline")
    else:
        if max(feet) - feet[0] > 6 or max(feet) - feet[-1] > 6:
            out.append(f"{tag}: the first and last frame should stand on the ground (the lowest point of the jump row)")
    if max(heights) > 0 and (max(heights) - min(heights)) / max(heights) > SIZE_POP and row not in ("jumping", "failed"):
        out.append(f"{tag}: the character changes size from frame to frame ({min(heights)}-{max(heights)} px tall)")
    centres = []
    for col, b in enumerate(boxes):
        cell = alpha.crop((col * CELL_W, i * CELL_H, (col + 1) * CELL_W, (i + 1) * CELL_H))
        centres.append(align.base_centre(Image.merge("RGBA", (cell, cell, cell, cell))))
    mid = sorted(centres)[len(centres) // 2]
    if max(abs(c - mid) for c in centres) > CENTRE_JITTER:
        out.append(f"{tag}: the character slides sideways between frames (its feet are not on one spot)")
    return out


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


def read_extras(path: Path | None) -> tuple[dict, list[str]]:
    """`loaf.json` content (reactions + special), checked against what Loaf accepts. Returns (clean, problems)."""
    if path is None:
        return {}, []
    problems: list[str] = []
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}, [f"{path.name} is not valid JSON"]
    clean: dict = {}
    reactions = {k: v for k, v in (raw.get("reactions") or {}).items() if k in MOMENTS and v in POSES}
    dropped = set(raw.get("reactions") or {}) - set(reactions)
    if dropped:
        problems.append(f"loaf.json: reactions {sorted(dropped)} are not a known moment/pose and were left out")
    if reactions:
        clean["reactions"] = reactions
    sp = raw.get("special")
    if sp:
        ok = (isinstance(sp, dict) and str(sp.get("name", "")).strip() and sp.get("pose") in POSES
              and sp.get("trigger") in ("click", "tasks", "daily") and str(sp.get("line", "")).strip())
        if ok:
            clean["special"] = {"name": str(sp["name"]).strip()[:30], "pose": sp["pose"], "line": str(sp["line"]).strip()[:80],
                                "trigger": sp["trigger"], "every": max(2, min(int(sp.get("every", 5) or 5), 50))}
        else:
            problems.append("loaf.json: the special needs a name, a line, a known pose and a trigger (click, tasks or daily)")
    return clean, problems


def contact_sheet(sheet: Image.Image, out: Path) -> None:
    """QA picture: the sheet on a mid-grey ground with the baseline and centre lines, half size."""
    bg = Image.new("RGBA", sheet.size, (128, 132, 140, 255))
    from PIL import ImageDraw
    d = ImageDraw.Draw(bg)
    for r in range(len(ROWS)):
        y = r * CELL_H + align.BASELINE
        d.line((0, y, sheet.width, y), fill=(255, 80, 80, 255))
        for c in range(COLUMNS):
            d.line((c * CELL_W + align.CENTRE_X, r * CELL_H, c * CELL_W + align.CENTRE_X, (r + 1) * CELL_H), fill=(80, 160, 255, 255))
    bg.alpha_composite(sheet)
    bg.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).convert("RGB").save(out)


def row_gifs(sheet: Image.Image, out: Path) -> None:
    for i, (row, frames) in enumerate(ROWS):
        imgs = []
        for c in range(frames):
            cell = sheet.crop((c * CELL_W, i * CELL_H, (c + 1) * CELL_W, (i + 1) * CELL_H))
            bg = Image.new("RGBA", cell.size, (240, 240, 244, 255))
            bg.alpha_composite(cell)
            imgs.append(bg.convert("RGB"))
        imgs[0].save(out / f"{row}.gif", save_all=True, append_images=imgs[1:], duration=LOOPS_MS[row] // frames, loop=0)


def build(strips: Path, out: Path, pack_id: str, name: str, description: str, extras: Path | None = None, mirror_left: bool = False) -> list[str]:
    """Loose strips -> aligned pack folder + ZIP + QA pictures. Returns problems (empty = good)."""
    problems: list[str] = []
    if not ID_RE.match(pack_id) or pack_id in (".", ".."):
        return ["id must be 1-64 characters: letters, digits, - _ ."]
    clean, extras_problems = read_extras(extras)
    problems += extras_problems
    rows: dict[str, list[align.Frame]] = {}
    fatal: list[str] = []
    for row, frames in ROWS:
        if row == "running-left" and mirror_left:
            continue
        path = strips / f"{row}.png"
        if not path.exists():
            fatal.append(f"missing strip {path.name}")
            continue
        img = Image.open(path).convert("RGBA")
        if not align.has_transparency(img):
            img = align.remove_key(img, align.key_colour(img))
        try:
            rows[row] = align.frames_of(img, frames)
        except ValueError as e:
            fatal.append(f"{path.name}: {e}")
    if fatal:
        return problems + fatal
    cells = align.align_rows(rows)
    if mirror_left:
        cells["running-left"] = [ImageOps.mirror(c) for c in cells["running-right"]]
    sheet = Image.new("RGBA", SHEET, (0, 0, 0, 0))
    for i, (row, frames) in enumerate(ROWS):
        for c, cell in enumerate(cells[row]):
            sheet.paste(cell, (c * CELL_W, i * CELL_H))
    folder = out / pack_id
    folder.mkdir(parents=True, exist_ok=True)
    sheet.save(folder / "spritesheet.webp", "WEBP", lossless=True)
    (folder / "pet.json").write_text(json.dumps({"id": pack_id, "displayName": name, "description": description,
                                                  "spritesheetPath": "spritesheet.webp"}, indent=2) + "\n", encoding="utf-8")
    if clean:
        (folder / "loaf.json").write_text(json.dumps(clean, indent=2) + "\n", encoding="utf-8")
    problems += check(folder)
    qa = out / "qa"
    qa.mkdir(exist_ok=True)
    contact_sheet(sheet, qa / "contact-sheet.png")
    row_gifs(sheet, qa)
    zip_path = out / f"{pack_id}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for f in ("pet.json", "loaf.json", "spritesheet.webp"):
            if (folder / f).exists():
                z.write(folder / f, f)
    if zip_path.stat().st_size > 25 * 1024 * 1024:
        problems.append("the ZIP is larger than 25 MB, which Loaf will not open")
    return problems


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
            problems += _alignment(i, row, boxes, alpha)
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
    b = sub.add_parser("build")
    b.add_argument("strips", type=Path)
    b.add_argument("out", type=Path)
    b.add_argument("--id", required=True)
    b.add_argument("--name", required=True)
    b.add_argument("--description", default="")
    b.add_argument("--extras", type=Path, default=None, help="loaf.json with reactions and the special")
    b.add_argument("--mirror-left", action="store_true", help="make running-left by flipping running-right (only for a symmetric pet)")
    pr = sub.add_parser("prepare")
    pr.add_argument("run", type=Path)
    pr.add_argument("--name", required=True)
    pr.add_argument("--id", default=None)
    pr.add_argument("--reference", type=Path, default=None)
    st = sub.add_parser("status")
    st.add_argument("run", type=Path)
    fi = sub.add_parser("finish")
    fi.add_argument("run", type=Path)
    fi.add_argument("--extras", type=Path, default=None)
    fi.add_argument("--mirror-left", action="store_true")
    c = sub.add_parser("check")
    c.add_argument("pack", type=Path)
    args = ap.parse_args()
    if args.cmd == "prepare":
        pet_id = args.id or re.sub(r"[^a-z0-9]+", "-", args.name.lower()).strip("-") or "pet"
        if not ID_RE.match(pet_id):
            print("Not ready:\n  - the id must be 1-64 characters: letters, digits, - _ .")
            return 1
        if args.reference is not None and not args.reference.is_file():
            print(f"Not ready:\n  - the reference picture {args.reference} was not found")
            return 1
        manifest = prep.prepare(args.run, args.name, pet_id, args.reference)
        print(f"Prepared {len(manifest['jobs'])} image jobs in {args.run}/jobs.json (background {manifest['key']} {manifest['key_hex']}).")
        return 0
    if args.cmd == "status":
        missing = prep.status(args.run)
        print("All pictures are there. Run: pack.py finish" if not missing else "Still missing: " + ", ".join(missing))
        return 1 if missing else 0
    if args.cmd == "finish":
        manifest = json.loads((args.run / "jobs.json").read_text(encoding="utf-8"))
        todo = [j for j in prep.status(args.run) if not (args.mirror_left and j == "running-left")]
        if todo:
            print("Not ready:\n  - missing pictures: " + ", ".join(todo))
            return 1
        problems = build(args.run / "strips", args.run / "out", manifest["id"], manifest["name"], f"{manifest['name']}, a Loaf pet",
                         args.extras, args.mirror_left)
        if not problems:
            print(f"Your pet: {args.run / 'out' / (manifest['id'] + '.zip')}")
    elif args.cmd == "build":
        problems = build(args.strips, args.out, args.id, args.name, args.description, args.extras, args.mirror_left)
    elif args.cmd == "assemble":
        problems = assemble(args.strips, args.out, args.id, args.name, args.description)
    else:
        problems = check(args.pack)
    if problems:
        print("Not ready:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("OK: the pack passes. In Loaf: Character > Import (choose the .zip, or the folder). For Codex copy the folder to ~/.codex/pets/<id>/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
