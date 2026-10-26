# The one prompt

Fill in the **[brackets]** with the user's words. Keep everything else as it is.

## Step 1 — reference sheet

```
Create an original cute desktop-pet mascot named "[NAME]": [ONE-SENTENCE DESCRIPTION FROM THE USER].
Colours: [MAIN COLOUR], [BELLY/ACCENT COLOUR], [EYE/NOSE COLOUR]. Big head about 45% of its height,
short limbs, big friendly eyes, simple shapes. Personality: [PERSONALITY, e.g. calm and curious].
Style: [soft 3D chibi | clean flat chibi | pixel art 64 px], thick-enough outline to read at 64 px,
one light from the top-left, soft shadow under the feet, no text, no logo, transparent background.
Show a reference sheet: front view, three-quarter view facing right, side view, back view, and
close-ups of 5 expressions: happy, focused, sad (gentle), surprised, sleepy.
Keep proportions identical in every view. Original character, not based on any existing one.
```

## Step 2 — nine row strips

Send one request per row, with the approved reference attached each time. Every strip is a single
image, **transparent**, frames left to right, each frame **192 x 208 px**, the character centred,
feet on one line ~8 px above the bottom, same size in every frame, ~10 px free margin, light from
the top-left, and the last frame flows into the first.

```
Using the approved "[NAME]" reference, draw the row "[ROW]" as [FRAMES] frames in a strip of
[192*FRAMES] x 208 px: [WHAT TO DRAW]. Same colours and size as the reference in every frame.
```

| Row (file) | Frames | Strip size | What to draw |
|---|---|---|---|
| idle (`idle.png`) | 6 | 1152 x 208 | calm breathing, one blink, slight head tilt |
| running-right (`running-right.png`) | 8 | 1536 x 208 | cheerful walk cycle facing right, legs clearly moving, arms swing opposite |
| running-left (`running-left.png`) | 8 | 1536 x 208 | the same walk cycle facing left |
| waving (`waving.png`) | 4 | 768 x 208 | friendly wave with one arm, happy eyes: arm down, elbow up, hand high, hand tilted |
| jumping (`jumping.png`) | 5 | 960 x 208 | crouch, push off, peak with arms up, fall, land with a small squash; joyful |
| failed (`failed.png`) | 8 | 1536 x 208 | gently sad: brows up, small frown, one tear, shoulders drop, small sway |
| waiting (`waiting.png`) | 6 | 1152 x 208 | looks at the viewer patiently, small bob, foot tap, blink |
| running (`running.png`) | 6 | 1152 x 208 | working: typing on a small laptop, eyes on the screen, hands alternate |
| review (`review.png`) | 6 | 1152 x 208 | reading a page or clipboard, eyes move down it, paw to chin in the last frames |

## Step 3 — name it

`id`: short, lowercase, letters digits `-` `_` (also the folder name). `name`: what the user
calls it. `description`: one line, and who drew any reference art if there was some.
