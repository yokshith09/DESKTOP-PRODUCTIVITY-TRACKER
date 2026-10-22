// Rasterise packs/<id>/atlas.svg to spritesheet.webp (the Codex/OpenPets standard) and spritesheet.png with the installed Chromium (Playwright).
// Usage: NODE_PATH=<dir with playwright-core> node scripts/svg-to-png.mjs [packsDir]. playwright-core is NOT a project dependency (kept out on purpose); CHROMIUM_PATH points at a Chromium.
import { readdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright-core");

const root = resolve(process.argv[2] ?? "packs");
const exe = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1536, height: 1872 } });
for (const id of readdirSync(root)) {
  const svg = resolve(root, id, "atlas.svg");
  if (!existsSync(svg)) continue;
  await page.goto("file://" + svg);
  await page.screenshot({ path: resolve(root, id, "spritesheet.png"), omitBackground: true, clip: { x: 0, y: 0, width: 1536, height: 1872 } });
  // WebP via the browser's own encoder: draw the PNG on a canvas and export it at top quality (Chrome may still encode lossy).
  const png = readFileSync(resolve(root, id, "spritesheet.png")).toString("base64");
  const webp = await page.evaluate(async (b64) => {
    const img = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas"); // the page is an SVG document
    c.width = img.width; c.height = img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return c.toDataURL("image/webp", 1).split(",")[1];
  }, png);
  writeFileSync(resolve(root, id, "spritesheet.webp"), Buffer.from(webp, "base64"));
  console.log("wrote", id);
}
await browser.close();
