// End-to-end tests (F1-27): drive the real Loaf binary through WebDriver.
//
//   node e2e/run.mjs [path-to-binary]
//
// Starts `tauri-driver` (port 4444), points Loaf at a fresh temporary data folder through
// LOAF_DATA_DIR (never your real data), runs e2e/*.e2e.mjs, then cleans up.
// Windows needs Microsoft Edge Driver: set NATIVE_DRIVER to msedgedriver.exe (CI does).
// Linux needs WebKitWebDriver (package webkit2gtk-driver) and a display (xvfb-run).
// macOS has no WebDriver for WKWebView, so CI runs `e2e/smoke.mjs` there instead.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const exe = process.platform === "win32" ? "loaf.exe" : "loaf";
const binary = resolve(process.argv[2] ?? join("target", "debug", exe));
if (!existsSync(binary)) {
  console.error(`No Loaf binary at ${binary}. Build it first: pnpm tauri build --debug --no-bundle`);
  process.exit(2);
}
const dataDir = mkdtempSync(join(tmpdir(), "loaf-e2e-"));
const driverArgs = process.env.NATIVE_DRIVER ? ["--native-driver", process.env.NATIVE_DRIVER] : [];
// The driver starts Loaf, so Loaf inherits the driver's environment: that is where
// LOAF_DATA_DIR must be set.
const driver = spawn("tauri-driver", driverArgs, {
  stdio: ["ignore", "inherit", "inherit"],
  env: { ...process.env, LOAF_DATA_DIR: dataDir },
});

let code = 1;
try {
  // Wait until the driver answers.
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch("http://127.0.0.1:4444/status");
      if (r.ok || r.status === 404 || r.status === 405) break;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  const tests = spawn(process.execPath, ["--test", "--test-concurrency=1", "e2e/app.e2e.mjs"], {
    stdio: "inherit",
    env: { ...process.env, LOAF_BINARY: binary, LOAF_DATA_DIR: dataDir },
  });
  code = await new Promise((done) => tests.on("exit", (c) => done(c ?? 1)));
} finally {
  driver.kill();
  // On failure, show what the app itself wrote: its log and any crash report.
  if (code !== 0) {
    const logs = join(dataDir, "logs");
    const files = existsSync(logs) ? readdirSync(logs) : [];
    console.error(files.length ? `\n--- Loaf's own logs (${logs}) ---` : `\n--- Loaf wrote no logs in ${logs}: it probably never started with this data folder ---`);
    for (const f of files) console.error(`\n# ${f}\n${readFileSync(join(logs, f), "utf8").slice(-8000)}`);
  }
  try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* best effort */ }
}
process.exit(code);
