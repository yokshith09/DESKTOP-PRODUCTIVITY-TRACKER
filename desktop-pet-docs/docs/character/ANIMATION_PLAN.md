# How characters really wave, jump and cry (FR-105) — 2026-10-23

## Why Kayadu doesn't wave yet
A sprite sheet is a flip-book: every frame is a separate drawing. The Kayadu pack has 57 frames, but they are **the same picture** nudged a few pixels (its own README says so). Loaf can only play the drawings it is given, so moving, shifting or rotating one picture can make it bob or sway — never lift an arm, bend the knees or shed a tear. **Real motion needs new drawings per frame.**

## Ways to get real frames

| Way | What you do | Quality | Cost | Time per character |
|---|---|---|---|---|
| **1. AI image tool, row by row** (Codex `hatch-pet`, PixelLab, ChatGPT/other image models) | Give the character sheet + our row prompt (`PET_ART_SPEC.md` §6) one row at a time ("frame 1 of 4: arm down … frame 4: arm fully raised") | Good for simple/chibi styles; realistic figures drift between frames (face/outfit changes) | Free–US$50/month | Hours, with fixing |
| **2. Pose-to-image with a fixed character** (ControlNet/OpenPose-style: draw a stick-figure pose per frame, the model paints the character in that pose) | Make 6-8 stick poses per row; generate; clean up | Much more consistent than plain prompts | Free locally (needs a GPU) or a cloud service | A day |
| **3. Cut-out (puppet) animation** | Split the character into parts (head, torso, arms, forearms, legs, saree drape); rotate parts per frame in Krita/Spine/Rive-free tools or our SVG pipeline | Very consistent; smooth; this is how our 5 built-in characters work | Free | 1-2 days first time, faster after |
| **4. Commission an artist** | Brief: our spec + reference | Best | ~US$300-1,000 per full character [Guessing] | 1-3 weeks |
| **5. Simplify the style** | A chibi/rounded version of Kayadu (big head, short limbs) | Reads much better at 96-160 px | — | Redraw once |

**Recommendation for Kayadu:** make a **chibi version** (option 5: big head ~45% of height, simple saree shapes, thick outline) and animate it as a **cut-out puppet** (option 3). That fixes both problems at once: it will be readable at pet size and every row gets real poses. Our existing SVG export pipeline can render a puppet character into the 1536×1872 sheet automatically — the same way Loaf, Mochi, Pip, Bolt and Ghosty were made.

## What each row needs (the poses to draw)

| Row | Key poses (in order) |
|---|---|
| idle (6) | stand · breathe in (chest up 2 px) · blink · breathe out · slight head tilt · back to stand |
| running-right (8) | contact · down · passing · up · contact (other leg) · down · passing · up; arms swing opposite to legs; saree drape trails |
| waving (4) | arm down · elbow up · hand open high · hand tilted (then frames 3-4 repeat) |
| jumping (5) | crouch (knees bent, arms back) · push off · peak (arms up, feet tucked) · fall · land (squash) |
| failed (8) | stand · shoulders drop · head down · brows up · tear forms · tear falls · small sniff · settle |
| waiting (6) | look at viewer · foot tap · blink · glance side · back · tap |
| running / working (6) | typing on a small laptop: hands alternate down/up, eyes on screen |
| review (6) | holding a page/phone, eyes move down the page, hand to chin on frames 4-6 |

## What Loaf can add on its side (planned FR-105)
1. **Pack quality badge:** Loaf detects rows whose frames are near-identical and shows "This pet has still poses for: waving, jumping…" in the library, so users know why.
2. **Gentle motion fallback** for such rows: a hop for jumping, a sway for waving, a slump for failed — clearly marked as a fallback, not real animation.
3. **Puppet template**: a ready parts template (SVG) + our exporter, so a character sheet split into parts becomes a full pack.
4. **Row-by-row prompt helper** in the Studio: copies the exact prompt for each row and checks the uploaded frames line up (feet baseline, size).
