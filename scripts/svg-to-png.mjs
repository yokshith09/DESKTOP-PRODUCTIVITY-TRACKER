// Rasterise packs/<id>/atlas.svg to spritesheet.png with the installed Chromium (Playwright).
// Usage: NODE_PATH=<dir with playwright-core> node scripts/svg-to-png.mjs [packsDir]. playwright-core is NOT a project dependency (kept out on purpose); CHROMIUM_PATH points at a Chromium.
import { readdirSync, existsSync } from "node:fs";
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
  console.log("wrote", id);
}
await browser.close();
