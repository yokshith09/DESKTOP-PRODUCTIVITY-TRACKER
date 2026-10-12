// Launch smoke test (F1-27) for systems without a WebDriver for the app's webview (macOS):
// start the real binary on a fresh data folder, check that it stays up, opens its database
// and writes "Loaf started" to its log, then stop it.
//
//   node e2e/smoke.mjs [path-to-binary]
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
const dataDir = mkdtempSync(join(tmpdir(), "loaf-smoke-"));
const app = spawn(binary, [], { stdio: "inherit", env: { ...process.env, LOAF_DATA_DIR: dataDir } });
let exited = null;
app.on("exit", (code) => { exited = code ?? -1; });

const logText = () => {
  const dir = join(dataDir, "logs");
  if (!existsSync(dir)) return "";
  return readdirSync(dir).filter((f) => f.startsWith("loaf")).map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
};

let ok = false;
for (let i = 0; i < 120 && exited === null; i++) {
  if (existsSync(join(dataDir, "loaf.db")) && logText().includes("Loaf started")) { ok = true; break; }
  await sleep(250);
}
// It must still be running a moment later (no crash right after start).
if (ok) await sleep(3000);
const alive = exited === null;
app.kill();
const crashes = existsSync(join(dataDir, "logs")) ? readdirSync(join(dataDir, "logs")).filter((f) => f.startsWith("crash-")) : [];
try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* best effort */ }

const problems = [
  !ok && "the app never opened its database and logged 'Loaf started' within 30 s",
  ok && !alive && `the app exited by itself (code ${exited})`,
  crashes.length > 0 && `crash reports were written: ${crashes.join(", ")}`,
].filter(Boolean);
if (problems.length) {
  console.error(`Smoke test failed: ${problems.join("; ")}`);
  process.exit(1);
}
console.log("Smoke test passed: Loaf started, opened its database, logged, and stayed up.");
