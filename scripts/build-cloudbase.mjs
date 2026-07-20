import { existsSync } from "node:fs";
import { rename, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";

const apiDirectory = new URL("../app/api", import.meta.url);
const parkedApiDirectory = new URL("../.api-cloudbase-build", import.meta.url);
const nextExecutable = new URL(
  process.platform === "win32" ? "../node_modules/.bin/next.cmd" : "../node_modules/.bin/next",
  import.meta.url,
);
const projectDirectory = fileURLToPath(new URL("..", import.meta.url));
const nextCacheDirectory = new URL("../.next", import.meta.url);

async function runNextBuild() {
  await new Promise((resolve, reject) => {
    const child = spawn(fileURLToPath(nextExecutable), ["build"], {
      cwd: projectDirectory,
      env: { ...process.env, CLOUDBASE_STATIC_EXPORT: "1" },
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => code === 0
      ? resolve()
      : reject(new Error(`CloudBase static build failed with exit code ${code}`)));
  });
}

// Route handlers are deployed only on Vercel. Temporarily park them because
// Next.js static export intentionally rejects dynamic API routes.
let parked = false;
try {
  if (existsSync(apiDirectory)) {
    await rename(apiDirectory, parkedApiDirectory);
    parked = true;
  }
  await rm(nextCacheDirectory, { recursive: true, force: true });
  await runNextBuild();
} finally {
  if (parked) await rename(parkedApiDirectory, apiDirectory);
}
