"""Run: python3 -m unittest skills/loaf-character/scripts/test_pack.py  (from the repo root)"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import pack  # noqa: E402


def strip(frames: int, feet: int = 196, size=(40, 120)) -> Image.Image:
    img = Image.new("RGBA", (pack.CELL_W * frames, pack.CELL_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for f in range(frames):
        x = f * pack.CELL_W + (pack.CELL_W - size[0]) // 2
        d.rectangle((x, feet - size[1], x + size[0], feet), fill=(200, 140, 70, 255))
    return img


def write_strips(dirpath: Path, skip: str | None = None, feet: int = 196) -> None:
    for name, frames in pack.ROWS:
        if name != skip:
            strip(frames, feet).save(dirpath / f"{name}.png")


class PackTests(unittest.TestCase):
    def test_good_strips_make_a_passing_pack(self):
        with tempfile.TemporaryDirectory() as t:
            strips, out = Path(t, "s"), Path(t, "o")
            strips.mkdir()
            write_strips(strips)
            self.assertEqual(pack.assemble(strips, out, "mochi", "Mochi", "Mochi, the cat"), [])
            meta = json.loads((out / "pet.json").read_text())
            self.assertEqual(meta["spritesheetPath"], "spritesheet.webp")
            self.assertEqual(Image.open(out / "spritesheet.webp").size, (1536, 1872))
            self.assertEqual(pack.check(out), [])

    def test_a_missing_or_wrong_sized_strip_is_named(self):
        with tempfile.TemporaryDirectory() as t:
            strips = Path(t, "s")
            strips.mkdir()
            write_strips(strips, skip="waving")
            strip(5).save(strips / "idle.png")  # idle needs 6 frames
            problems = pack.assemble(strips, Path(t, "o"), "mochi", "Mochi", "")
            self.assertTrue(any("missing strip waving.png" in p for p in problems))
            self.assertTrue(any("idle.png" in p and "6 frames" in p for p in problems))

    def test_a_bad_id_is_refused(self):
        with tempfile.TemporaryDirectory() as t:
            strips = Path(t, "s")
            strips.mkdir()
            write_strips(strips)
            self.assertTrue(any("id must be" in p for p in pack.assemble(strips, Path(t, "o"), "../evil", "X", "")))

    def test_art_problems_are_found(self):
        with tempfile.TemporaryDirectory() as t:
            strips, out = Path(t, "s"), Path(t, "o")
            strips.mkdir()
            write_strips(strips)
            strip(8, feet=207).save(strips / "running-right.png")  # feet at the edge of the cell
            problems = pack.assemble(strips, out, "mochi", "Mochi", "")
            self.assertTrue(any("running-right" in p and "cut off" in p for p in problems))

    def test_check_reports_a_missing_pet_json(self):
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(pack.check(Path(t)), ["pet.json is missing"])


if __name__ == "__main__":
    unittest.main()
