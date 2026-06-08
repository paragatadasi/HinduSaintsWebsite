import { rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const workspace = resolve(process.cwd());
const nextDir = resolve(workspace, ".next");

if (!nextDir.startsWith(workspace)) {
  throw new Error(`Refusing to clean path outside workspace: ${nextDir}`);
}

const staleBuildMarkers = [
  join(nextDir, "BUILD_ID"),
  join(nextDir, "standalone"),
  join(nextDir, "required-server-files.json")
];

if (!staleBuildMarkers.some((path) => existsSync(path))) {
  process.exit(0);
}

for (const path of [
  join(nextDir, "server"),
  join(nextDir, "standalone"),
  join(nextDir, "static"),
  join(nextDir, "BUILD_ID"),
  join(nextDir, "app-build-manifest.json"),
  join(nextDir, "build-manifest.json"),
  join(nextDir, "prerender-manifest.json"),
  join(nextDir, "react-loadable-manifest.json"),
  join(nextDir, "required-server-files.json"),
  join(nextDir, "routes-manifest.json")
]) {
  rmSync(path, { force: true, recursive: true });
}

console.log("Cleaned stale Next production output before starting dev.");
