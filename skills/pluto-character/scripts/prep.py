"""Prepare a character run: the colour to draw on, the layout guides, and one finished prompt per image job.

`pack.py prepare` calls this. Modelled on the Codex `hatch-pet` skill (see
desktop-pet-docs/docs/character/RESEARCH_PET_PIPELINES.md): one base picture that every row copies,
then one strip per row, each drawn with the base, the user's picture and a layout guide attached.
Every prompt is complete: nothing is left for a person to fill in.
"""
from __future__ import annotations

import json
import random
from pathlib import Path

from PIL import Image, ImageDraw

BIG_W, BIG_H = 400, 420  # one frame slot of a row strip; align.py scales it down to 192 x 208
KEYS = {"green": (0, 255, 0), "magenta": (255, 0, 255), "cyan": (0, 255, 255), "yellow": (255, 255, 0)}

# row -> (frames, what to draw). The words are the standard's (docs/character/CHARACTER_STANDARD.md).
ROW_BRIEFS: dict[str, tuple[int, str]] = {
    "idle": (6, "calm breathing in place, one slow blink, a very slight head tilt; the body hardly moves"),
    "running-right": (8, "a cheerful walk cycle facing right, legs clearly alternating, arms swinging opposite; it walks in place"),
    "running-left": (8, "the same cheerful walk cycle facing left, legs clearly alternating; it walks in place"),
    "waving": (4, "a friendly wave with one arm and happy eyes: arm down, elbow up, hand high, hand tilted; show the wave with the arm only"),
    "jumping": (5, "joyful: crouch, push off, peak with both arms up, fall, land with a small squash; the first and last frame stand on the ground"),
    "failed": (8, "gently sad, never harsh: brows up, small frown, shoulders drop, a small sway; at most one tear that touches the face"),
    "waiting": (6, "patient: looks at the viewer, a small bob, a foot tap, a blink"),
    "running": (6, "working: typing on a small laptop in front of it, eyes on the screen, hands alternate"),
    "review": (6, "reading a page or clipboard, eyes move down it, one paw to the chin in the last frames"),
}

RULES = """Rules for every picture:
- Original character only; keep exactly the identity of the reference (head shape, face, markings, palette, outline weight, proportions, any prop and which side it is on).
- Flat, even background of exactly {key_name} ({key_hex}) everywhere there is no character. No gradient, no floor, no scenery.
- No shadows (no floor shadow, no drop shadow), no glow, no halo, no motion lines, no speed lines, no dust, no afterimages, no blur.
- No text, labels, numbers, grids, frame boxes, speech bubbles, UI, or checkerboard.
- No loose effects: anything extra (a tear, a puff, a star) must touch the character and use colours other than the background colour.
- Nothing in the character, its prop or its effects may be {key_name} or close to it.
- Clean, simple, readable at 96 px: thick-enough outline, flat or softly shaded colour, simple face."""


def hex_of(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def choose_key(reference: Path | None) -> str:
    """The background colour farthest from anything in the reference picture."""
    if reference is None:
        return "green"
    img = Image.open(reference).convert("RGB")
    img.thumbnail((96, 96))
    px = list(img.getdata())
    rnd = random.Random(7)
    sample = rnd.sample(px, min(len(px), 1500))

    def nearest(c: tuple[int, int, int]) -> float:
        return min(((c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2) ** 0.5 for p in sample)

    return max(KEYS, key=lambda k: nearest(KEYS[k]))


def guide(frames: int, key: tuple[int, int, int], out: Path) -> None:
    """Layout guide: the slots a row strip is drawn in. A faint centre tick and a faint ground line per slot.
    It is construction only; the picture must not copy it."""
    img = Image.new("RGB", (BIG_W * frames, BIG_H), key)
    d = ImageDraw.Draw(img)
    tint = tuple(max(0, min(255, c + (28 if c < 128 else -28))) for c in key)
    for i in range(frames):
        cx = i * BIG_W + BIG_W // 2
        d.line((cx, 40, cx, BIG_H - 40), fill=tint, width=2)
        d.line((i * BIG_W + 60, BIG_H - 60, (i + 1) * BIG_W - 60, BIG_H - 60), fill=tint, width=2)
    img.save(out)


def base_prompt(name: str, key_name: str, key_hex: str, has_reference: bool) -> str:
    source = ("Use the attached reference picture as the character. Redraw it as a small desktop-pet mascot: keep its identity, simplify the detail."
              if has_reference else f'Invent a friendly original desktop-pet mascot called "{name}".')
    return f"""Draw ONE picture: the character "{name}" as a small desktop-pet mascot, standing, facing the viewer, whole body visible, centred.
{source}
Style: compact chibi proportions (big head, short limbs), chunky silhouette, clear outline, limited palette, flat or softly shaded colour, simple expressive face.
This picture becomes the canonical reference every animation row is copied from, so make it clear and complete.

{RULES.format(key_name=key_name, key_hex=key_hex)}"""


def row_prompt(name: str, row: str, key_name: str, key_hex: str) -> str:
    frames, what = ROW_BRIEFS[row]
    return f"""Draw ONE wide picture: an animation strip of "{name}" for the row "{row}", exactly {frames} frames side by side in one horizontal row, left to right.
Attached: (1) the canonical base picture, (2) the user's reference if present, (3) a layout guide for {frames} equal slots.
Copy the character from the base picture exactly: do not redesign it.

What the {frames} frames show: {what}.
Layout: one frame per slot, the whole character inside its slot, centred, never touching a neighbouring slot, the same size in every frame, standing on the same ground line in every frame (except a jump, which rises and comes back). Frame {frames} should lead smoothly back into frame 1. Use clearly different poses between frames, not the same picture nudged.
The layout guide shows the slots only; do NOT draw its lines, ticks or colours.

{RULES.format(key_name=key_name, key_hex=key_hex)}"""


def prepare(run: Path, name: str, pet_id: str, reference: Path | None) -> dict:
    """Write the whole run folder and return its job list."""
    key_name = choose_key(reference)
    key_hex = hex_of(KEYS[key_name])
    for sub in ("references", "guides", "prompts", "strips"):
        (run / sub).mkdir(parents=True, exist_ok=True)
    refs: list[dict] = []
    if reference is not None:
        ref_copy = run / "references" / f"user-reference{reference.suffix.lower() or '.png'}"
        ref_copy.write_bytes(reference.read_bytes())
        refs.append({"path": str(ref_copy), "role": "the user's reference picture (identity source)"})
    jobs = [{
        "id": "base", "prompt": str(run / "prompts" / "base.txt"), "inputs": refs,
        "save_as": str(run / "references" / "base.png"),
        "note": "Pick the best picture. Save it exactly here. Every row needs it.",
    }]
    (run / "prompts" / "base.txt").write_text(base_prompt(name, key_name, key_hex, bool(refs)), encoding="utf-8")
    base_ref = {"path": str(run / "references" / "base.png"), "role": "the canonical base picture (identity source of truth)"}
    for row, (frames, _) in ROW_BRIEFS.items():
        gpath = run / "guides" / f"{row}.png"
        guide(frames, KEYS[key_name], gpath)
        (run / "prompts" / f"{row}.txt").write_text(row_prompt(name, row, key_name, key_hex), encoding="utf-8")
        jobs.append({
            "id": row, "prompt": str(run / "prompts" / f"{row}.txt"),
            "inputs": [base_ref, *refs, {"path": str(gpath), "role": f"layout guide for {frames} slots (construction only, do not copy)"}],
            "save_as": str(run / "strips" / f"{row}.png"),
            "note": ("Only after running-right is accepted: if the character is symmetric (no handed prop, no one-sided marking, no text) "
                     "skip this job and build with --mirror-left; otherwise draw it." if row == "running-left" else ""),
        })
    manifest = {"name": name, "id": pet_id, "key": key_name, "key_hex": key_hex, "jobs": jobs}
    (run / "jobs.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def status(run: Path) -> list[str]:
    """Which jobs still need a picture."""
    manifest = json.loads((run / "jobs.json").read_text(encoding="utf-8"))
    return [j["id"] for j in manifest["jobs"] if not Path(j["save_as"]).exists()]
