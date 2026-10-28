"""Run: python3 -m unittest skills/loaf-character/scripts/test_pack.py  (from the repo root)"""
import json
import random
import sys
import zipfile
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


GREEN = (0, 255, 0, 255)


def loose_strip(frames: int, jitter: bool = True, key: bool = True, rise=None, seed: int = 1) -> Image.Image:
    """What an image tool really hands back: big frames, a flat background, every drawing a little
    off in size and place. The 'character' is a body, a head and two feet."""
    rnd = random.Random(seed)
    fw, fh = 300, 420
    img = Image.new("RGBA", (fw * frames, fh), GREEN if key else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for f in range(frames):
        k = rnd.uniform(0.9, 1.1) if jitter else 1.0
        dx = rnd.randint(-25, 25) if jitter else 0
        dy = rnd.randint(-18, 18) if jitter else 0
        up = (rise[f] if rise else 0)
        cx, bottom = f * fw + fw // 2 + dx, 380 + dy - up
        w, h = 90 * k, 200 * k
        d.ellipse((cx - w, bottom - h - 40, cx + w, bottom - 30), fill=(210, 120, 60, 255))     # body
        d.ellipse((cx - 55 * k, bottom - h - 110, cx + 55 * k, bottom - h - 30), fill=(230, 150, 80, 255))  # head
        d.rectangle((cx - 60 * k, bottom - 40, cx - 20 * k, bottom), fill=(90, 50, 30, 255))      # feet
        d.rectangle((cx + 20 * k, bottom - 40, cx + 60 * k, bottom), fill=(90, 50, 30, 255))
    return img


def write_loose(dirpath: Path, **kw) -> None:
    for n, (name, frames) in enumerate(pack.ROWS):
        rise = [0, 40, 90, 40, 0] if name == "jumping" else None
        loose_strip(frames, rise=rise, seed=n + 1, **kw).save(dirpath / f"{name}.png")


def frame_boxes(sheet: Image.Image, row: int, frames: int):
    a = sheet.getchannel("A")
    return [a.crop((c * pack.CELL_W, row * pack.CELL_H, (c + 1) * pack.CELL_W, (row + 1) * pack.CELL_H)).point(lambda v: 255 if v > 8 else 0).getbbox() for c in range(frames)]


class BuildTests(unittest.TestCase):
    def build(self, t: str, **kw):
        strips, out = Path(t, "s"), Path(t, "o")
        strips.mkdir(exist_ok=True)
        extra = kw.pop("extras", None)
        write_loose(strips, **kw)
        return out, pack.build(strips, out, "fox", "Fox", "A fox", extras=extra)

    def test_jittery_chroma_key_strips_come_out_still_and_aligned(self):
        with tempfile.TemporaryDirectory() as t:
            out, problems = self.build(t)
            self.assertEqual(problems, [])
            sheet = Image.open(out / "fox" / "spritesheet.webp").convert("RGBA")
            self.assertEqual(sheet.size, (1536, 1872))
            for i, (row, frames) in enumerate(pack.ROWS):
                boxes = frame_boxes(sheet, i, frames)
                if row != "jumping":
                    self.assertEqual({b[3] for b in boxes}, {200}, row)       # one baseline
                    heights = [b[3] - b[1] for b in boxes]
                    self.assertLess(max(heights) - min(heights), max(heights) * 0.2, row)  # no size pops
                centres = [(b[0] + b[2]) / 2 for b in boxes]
                self.assertLess(max(centres) - min(centres), 6, row)          # no sliding
            self.assertTrue((out / "qa" / "contact-sheet.png").exists())
            self.assertTrue((out / "qa" / "idle.gif").exists())

    def test_transparent_strips_work_the_same(self):
        with tempfile.TemporaryDirectory() as t:
            out, problems = self.build(t, key=False)
            self.assertEqual(problems, [])

    def test_the_jump_rises_and_lands_on_the_baseline(self):
        with tempfile.TemporaryDirectory() as t:
            out, _ = self.build(t)
            sheet = Image.open(out / "fox" / "spritesheet.webp").convert("RGBA")
            boxes = frame_boxes(sheet, 4, 5)
            self.assertEqual((boxes[0][3], boxes[-1][3]), (200, 200))
            self.assertLess(boxes[2][3], 190)                                  # lifted at the peak
            self.assertGreaterEqual(boxes[2][1], 4)                            # and not out of the cell

    def test_the_zip_holds_only_the_pack_files_and_checks_clean(self):
        with tempfile.TemporaryDirectory() as t:
            extras = Path(t, "loaf.json")
            extras.write_text(json.dumps({"reactions": {"task-done": "jump", "bogus": "jump"},
                                          "special": {"name": "Pounce", "pose": "toss", "line": "Pounce!", "trigger": "click", "every": 5}}))
            out, problems = self.build(t, extras=extras)
            self.assertTrue(any("bogus" in p for p in problems))              # told, not silent
            with zipfile.ZipFile(out / "fox.zip") as z:
                self.assertEqual(sorted(z.namelist()), ["loaf.json", "pet.json", "spritesheet.webp"])
                kept = json.loads(z.read("loaf.json"))
            self.assertEqual(kept["reactions"], {"task-done": "jump"})
            self.assertEqual(kept["special"]["trigger"], "click")

    def test_mirror_left_makes_running_left_from_running_right(self):
        with tempfile.TemporaryDirectory() as t:
            strips, out = Path(t, "s"), Path(t, "o")
            strips.mkdir()
            write_loose(strips)
            (strips / "running-left.png").unlink()
            self.assertEqual(pack.build(strips, out, "fox", "Fox", "", mirror_left=True), [])

    def test_an_empty_or_missing_strip_is_named_not_a_crash(self):
        with tempfile.TemporaryDirectory() as t:
            strips = Path(t, "s")
            strips.mkdir()
            write_loose(strips)
            Image.new("RGBA", (1152, 208), GREEN).save(strips / "idle.png")   # nothing drawn
            (strips / "waving.png").unlink()
            problems = pack.build(strips, Path(t, "o"), "fox", "Fox", "")
            self.assertTrue(any("missing strip waving.png" in p for p in problems))
            self.assertTrue(any("idle.png" in p and "empty" in p for p in problems))

    def test_check_rejects_a_pack_that_jitters(self):
        with tempfile.TemporaryDirectory() as t:
            strips, out = Path(t, "s"), Path(t, "o")
            strips.mkdir()
            write_strips(strips)
            bobbing = Image.new("RGBA", (pack.CELL_W * 6, pack.CELL_H), (0, 0, 0, 0))
            d = ImageDraw.Draw(bobbing)
            for f in range(6):
                feet = 196 - (f % 2) * 10                                        # feet jump 10 px every frame
                x = f * pack.CELL_W + 76 + (f % 2) * 20                          # and slide 20 px
                d.rectangle((x, feet - 120, x + 40, feet), fill=(200, 140, 70, 255))
            bobbing.save(strips / "idle.png")
            problems = pack.assemble(strips, out, "fox", "Fox", "")
            self.assertTrue(any("idle" in p and "baseline" in p for p in problems), problems)
            self.assertTrue(any("idle" in p and "sideways" in p for p in problems), problems)


class PrepareTests(unittest.TestCase):
    def reference(self, d: Path, colour=(40, 190, 60)) -> Path:
        p = d / "ref.png"
        Image.new("RGB", (200, 200), colour).save(p)
        return p

    def test_prepare_writes_ten_finished_jobs_and_a_key_that_is_not_the_pets_colour(self):
        with tempfile.TemporaryDirectory() as t:
            run = Path(t, "run")
            m = pack.prep.prepare(run, "Mochi", "mochi", self.reference(Path(t)))
            self.assertEqual([j["id"] for j in m["jobs"]], ["base", *[r for r, _ in pack.ROWS]])
            self.assertNotEqual(m["key"], "green")                      # the pet is green, so not a green background
            for j in m["jobs"]:
                text = Path(j["prompt"]).read_text()
                self.assertIn(m["key_hex"], text)
                self.assertNotRegex(text, r"\[[A-Z ]+\]")               # nothing left in brackets to fill in
            row = next(j for j in m["jobs"] if j["id"] == "waving")
            self.assertIn("exactly 4 frames", Path(row["prompt"]).read_text())
            self.assertEqual(len(row["inputs"]), 3)                      # base + the user's picture + the guide
            self.assertEqual(Image.open(row["inputs"][-1]["path"]).size, (400 * 4, 420))

    def test_prepare_without_a_picture_invents_the_character(self):
        with tempfile.TemporaryDirectory() as t:
            m = pack.prep.prepare(Path(t, "run"), "Mochi", "mochi", None)
            self.assertIn("Invent", Path(m["jobs"][0]["prompt"]).read_text())
            self.assertEqual(len(m["jobs"][1]["inputs"]), 2)

    def test_status_lists_what_is_missing_and_finish_makes_the_zip(self):
        with tempfile.TemporaryDirectory() as t:
            run = Path(t, "run")
            m = pack.prep.prepare(run, "Fox", "fox", None)
            self.assertEqual(len(pack.prep.status(run)), 10)
            Image.new("RGBA", (64, 64), GREEN).save(run / "references" / "base.png")
            write_loose(run / "strips")
            self.assertEqual(pack.prep.status(run), [])
            code = pack.sys.argv
            try:
                pack.sys.argv = ["pack.py", "finish", str(run)]
                self.assertEqual(pack.main(), 0)
            finally:
                pack.sys.argv = code
            self.assertTrue((run / "out" / "fox.zip").exists())


if __name__ == "__main__":
    unittest.main()
