# The one prompt

Paste this into Codex, attach **one picture** of the pet you want, and put its name where it says `NAME`. That is all you fill in.

```
Use the pluto-character skill to make my Pluto pet, from start to finish, without asking me anything.
The pet's name is NAME. The attached picture is its reference.
Use the built-in image tool for every picture, follow the skill's steps exactly, and check the result by looking at the contact sheet.
When it is done, give me the path of the single ZIP file and nothing else to do: I will open Pluto, go to Character, choose Import and pick that ZIP.
```

What you get: one ZIP (`<name>.zip`) with `pet.json`, `spritesheet.webp` and `pluto.json`. About ten pictures are generated (one base picture and nine animation strips); scripts do the cutting, sizing and aligning, so the animation does not jitter.
