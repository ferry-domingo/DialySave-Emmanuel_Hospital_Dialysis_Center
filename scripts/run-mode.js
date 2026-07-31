import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const mode = process.argv[2];
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe" : "npm";

if (!["development", "production"].includes(mode)) {
  console.error("Usage: node scripts/run-mode.js <development|production>");
  process.exit(1);
}

const environment = {
  ...process.env,
  NODE_ENV: mode,
  APP_MODE: mode,
};

const commandArgs = (args) =>
  isWindows ? ["/d", "/s", "/c", `npm ${args.join(" ")}`] : args;

const run = (args, options = {}) =>
  spawn(npmCommand, commandArgs(args), {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
    ...options,
  });

if (mode === "production") {
  console.log("\nDialySAVE production mode");
  console.log("Building the frontend, then serving the complete app on http://localhost:5000\n");

  const build = spawnSync(npmCommand, commandArgs(["run", "build"]), {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
  });

  if (build.status !== 0) process.exit(build.status ?? 1);

  const server = run(["start", "--prefix", "backend"]);
  server.on("exit", (code) => process.exit(code ?? 0));
} else {
  console.log("\nDialySAVE development mode");
  console.log("Frontend: http://localhost:5173");
  console.log("Backend:  http://localhost:5000\n");

  const backend = run(["run", "dev", "--prefix", "backend"]);
  const frontend = run(["run", "dev", "--prefix", "frontend"]);
  const children = [backend, frontend];
  let stopping = false;

  const stopAll = (signal = "SIGTERM") => {
    if (stopping) return;
    stopping = true;
    for (const child of children) {
      if (!child.killed) child.kill(signal);
    }
  };

  process.on("SIGINT", () => stopAll("SIGINT"));
  process.on("SIGTERM", () => stopAll("SIGTERM"));

  for (const child of children) {
    child.on("exit", (code) => {
      if (!stopping) {
        stopAll();
        process.exitCode = code ?? 1;
      }
    });
  }
}
