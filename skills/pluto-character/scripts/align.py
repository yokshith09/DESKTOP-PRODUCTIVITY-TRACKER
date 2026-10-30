"""Turn the loose row strips an image tool draws into frames that sit still.

Image tools draw each frame a little bigger, smaller or off to one side. Played in a row that looks
like jitter. This module fixes it by rule, with Pillow only (no numpy):

  1. If a strip has a flat background (chroma key), remove it; if it is already transparent, keep it.
  2. Cut the strip into its frames (by the gaps between drawings, else equal slices).
  3. One scale for the whole pet (set by the idle row), so a frame never changes size.
  4. Every frame is put on one baseline (feet at y = BASELINE) and its feet/body centre on x = 96.
     The jumping row keeps its rise, clamped to what fits the cell.

Nothing here draws or warps art: it only scales one pet uniformly and moves whole frames.
"""
from __future__ import annotations

from PIL import Image

CELL_W, CELL_H = 192, 208
BASELINE = 200          # lowest opaque pixel of a standing frame
MARGIN = 6              # free space kept around every frame
CENTRE_X = CELL_W // 2
TARGET_H = 168          # idle height the pet is scaled to (room left for arms up and a jump)
MAX_RISE = 56           # the most a jump may lift the pet
ALPHA_MIN = 8


def bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").point(lambda v: 255 if v > ALPHA_MIN else 0).getbbox()


def key_colour(img: Image.Image) -> tuple[int, int, int]:
    """The flat background colour: the median of the four corners."""
    w, h = img.size
    px = img.convert("RGB")
    samples = [px.getpixel(p) for p in ((1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2), (w // 2, 1), (w // 2, h - 2))]
    return tuple(sorted(s[i] for s in samples)[len(samples) // 2] for i in range(3))  # type: ignore[return-value]


def has_transparency(img: Image.Image) -> bool:
    lo, _ = img.getchannel("A").getextrema()
    if lo >= 250:
        return False
    hist = img.getchannel("A").histogram()
    return sum(hist[:32]) > img.width * img.height * 0.02


def remove_key(img: Image.Image, key: tuple[int, int, int], tol: int = 70, soft: int = 50) -> Image.Image:
    """Make pixels near `key` transparent, fading over `soft`; edge pixels also lose the key's tint."""
    img = img.convert("RGBA")
    kr, kg, kb = key
    out = []
    for r, g, b, a in img.getdata():
        d = ((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2) ** 0.5
        if d <= tol:
            out.append((r, g, b, 0))
        elif d < tol + soft:
            out.append((r, g, b, min(a, int(255 * (d - tol) / soft))))
        else:
            out.append((r, g, b, a))
    res = Image.new("RGBA", img.size)
    res.putdata(out)
    return res


def _runs(img: Image.Image, gap: int) -> list[tuple[int, int]]:
    """Columns that hold a drawing, joined across gaps narrower than `gap`."""
    alpha = img.getchannel("A").point(lambda v: 255 if v > ALPHA_MIN else 0)
    cols = list(alpha.resize((img.width, 1), Image.BOX).getdata())
    runs: list[list[int]] = []
    for x, v in enumerate(cols):
        if v > 0:
            if runs and x - runs[-1][1] <= gap:
                runs[-1][1] = x + 1
            else:
                runs.append([x, x + 1])
    return [(a, b) for a, b in runs]


def split_frames(strip: Image.Image, n: int) -> list[Image.Image]:
    """Cut a strip into `n` frames. Uses the gaps between drawings when there are exactly `n`
    (or a few more that can be joined across the smallest gaps); else equal slices."""
    w = strip.width
    runs = _runs(strip, gap=4)
    while len(runs) > n:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = gaps.index(min(gaps))
        runs[i:i + 2] = [(runs[i][0], runs[i + 1][1])]
    if len(runs) == n:
        # A drawing can reach into its neighbour's slice (an arm); cut at the middle of each gap.
        cuts = [0] + [(runs[i][1] + runs[i + 1][0]) // 2 for i in range(n - 1)] + [w]
    else:
        cuts = [round(i * w / n) for i in range(n + 1)]
    return [strip.crop((cuts[i], 0, cuts[i + 1], strip.height)) for i in range(n)]


def base_centre(frame: Image.Image) -> float:
    """Where the feet/body stand: the weighted middle of the lowest 40% of the drawing."""
    box = bbox(frame)
    if box is None:
        return frame.width / 2
    x0, y0, x1, y1 = box
    top = y1 - max(1, round((y1 - y0) * 0.4))
    band = frame.getchannel("A").crop((x0, top, x1, y1)).point(lambda v: v if v > ALPHA_MIN else 0)
    cols = list(band.resize((x1 - x0, 1), Image.BOX).getdata())
    total = sum(cols)
    if total == 0:
        return (x0 + x1) / 2
    return x0 + sum(i * v for i, v in enumerate(cols)) / total + 0.5


class Frame:
    """One cropped drawing, and where its bottom was in the strip (for the jumping row)."""

    def __init__(self, img: Image.Image, strip_bottom: int):
        box = bbox(img)
        if box is None:
            raise ValueError("a frame is empty")
        self.img = img.crop(box)
        self.centre = base_centre(self.img)  # where the feet stand, from the drawing's left edge
        self.strip_bottom = strip_bottom - (img.height - box[3])  # bottom edge of the drawing in the strip

    @property
    def size(self) -> tuple[int, int]:
        return self.img.size


def frames_of(strip: Image.Image, n: int) -> list[Frame]:
    out = []
    for part in split_frames(strip, n):
        if bbox(part) is None:
            raise ValueError("a frame in a strip is empty; it should show the character")
        out.append(Frame(part, part.height))
    return out


def pet_scale(rows: dict[str, list[Frame]]) -> float:
    """One scale for every row: idle sets the height, the widest/tallest frame caps it."""
    idle = sorted(f.size[1] for f in rows["idle"])
    s = TARGET_H / idle[len(idle) // 2]
    widest = max(f.size[0] for fs in rows.values() for f in fs)
    tallest = max(f.size[1] for name, fs in rows.items() if name != "jumping" for f in fs)
    # A wing or tail on one side must still fit when the feet are centred: measure each side of the feet.
    reach = max(max(f.centre, f.size[0] - f.centre) for fs in rows.values() for f in fs)
    return min(s, (CELL_W - 2 * MARGIN) / widest, (BASELINE - MARGIN) / tallest, (CENTRE_X - MARGIN) / reach)


def place(frames: list[Frame], scale: float, jumping: bool) -> list[Image.Image]:
    """Put each frame on the baseline and centre its feet on x = 96, one 192x208 cell each."""
    # The ground is the lowest the pet stands anywhere in the strip; the first and last frames are
    # the crouch and the landing, so they are on it by definition (this also absorbs a strip whose
    # drawings sit a little higher or lower from frame to frame).
    ground = max(f.strip_bottom for f in frames)
    cells = []
    for i, f in enumerate(frames):
        w, h = max(1, round(f.size[0] * scale)), max(1, round(f.size[1] * scale))
        img = f.img.resize((w, h), Image.LANCZOS)
        rise = 0
        if jumping:
            rise = 0 if i in (0, len(frames) - 1) else round((ground - f.strip_bottom) * scale)
            rise = max(0, min(rise, MAX_RISE, BASELINE - MARGIN - h))
            rise = 0 if rise < 3 else rise
        x = round(CENTRE_X - base_centre(img))
        x = max(MARGIN, min(x, CELL_W - MARGIN - w))
        cell = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
        cell.paste(img, (x, BASELINE - h - rise), img)
        cells.append(cell)
    return cells


def align_rows(rows: dict[str, list[Frame]]) -> dict[str, list[Image.Image]]:
    scale = pet_scale(rows)
    return {name: place(fs, scale, jumping=(name == "jumping")) for name, fs in rows.items()}
