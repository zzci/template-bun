import { closeSync, existsSync, openSync, readFileSync, rmSync, writeSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

let lockPath: string | null = null;

function tryCreateExclusive(filePath: string, content: string): boolean {
  try {
    const fd = openSync(filePath, "wx");
    writeSync(fd, content);
    closeSync(fd);
    return true;
  }
  catch {
    return false;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  }
  catch {
    return false;
  }
}

/**
 * Check if the process at the given port is our app or something else.
 * Returns:
 *   "self"  — confirmed our instance (health responded OK)
 *   "other"   — confirmed NOT ours (port responds but not our health endpoint)
 *   "unknown" — inconclusive (port not listening, curl missing, timeout, etc.)
 */
function probeProcess(port: number): "self" | "other" | "unknown" {
  try {
    const res = Bun.spawnSync(["curl", "-s", "-m", "2", `http://127.0.0.1:${port}/api/health`]);
    if (res.exitCode !== 0) {
      // curl failed (connection refused, timeout, etc.) — inconclusive
      return "unknown";
    }
    const body = res.stdout.toString();
    if (body.includes("\"status\":\"ok\"")) {
      return "self";
    }
    // Port responds but not our health endpoint — different process
    return "other";
  }
  catch {
    return "unknown";
  }
}

function parseLockFile(content: string): { pid: number; port: number } | null {
  const parts = content.trim().split(":");
  if (parts.length !== 2)
    return null;
  const pid = Number.parseInt(parts[0]!, 10);
  const port = Number.parseInt(parts[1]!, 10);
  if (Number.isNaN(pid) || Number.isNaN(port))
    return null;
  return { pid, port };
}

/**
 * Check if a lock file can be used by /proc/PID/cmdline on Linux
 * to determine if the process is our app.
 */
function isProbablyAccessByProc(pid: number): boolean {
  try {
    const cmdlinePath = `/proc/${pid}/cmdline`;
    if (!existsSync(cmdlinePath))
      return false;
    const cmdline = readFileSync(cmdlinePath, "utf-8").toLowerCase();
    return cmdline.includes("bun");
  }
  catch {
    return false;
  }
}

export function acquirePidLock(dbPath: string, port: number): void {
  const dir = dirname(dbPath);
  lockPath = resolve(dir, "app.pid");
  const content = `${process.pid}:${port}`;

  if (tryCreateExclusive(lockPath, content))
    return;

  // Lock file exists — read it
  let existing: { pid: number; port: number } | null = null;
  try {
    const raw = readFileSync(lockPath, "utf-8");
    existing = parseLockFile(raw);
  }
  catch {
    rmSync(lockPath, { force: true });
    if (tryCreateExclusive(lockPath, content))
      return;
    console.error("Failed to acquire PID lock after cleanup");
    process.exit(1);
  }

  if (!existing) {
    rmSync(lockPath, { force: true });
    if (tryCreateExclusive(lockPath, content))
      return;
    console.error("Failed to acquire PID lock");
    process.exit(1);
  }

  if (!isProcessAlive(existing.pid)) {
    // Process dead — stale lock, safe to take over
    rmSync(lockPath, { force: true });
    if (tryCreateExclusive(lockPath, content))
      return;
    console.error("Failed to acquire PID lock");
    process.exit(1);
  }

  // Process is alive — determine identity
  const probe = probeProcess(existing.port);

  if (probe === "self") {
    // Confirmed our instance running
    console.error(`Another instance is already running (PID ${existing.pid}, port ${existing.port})`);
    process.exit(1);
  }

  if (probe === "other") {
    // Port responds but it's not ours — PID was recycled
    rmSync(lockPath, { force: true });
    if (tryCreateExclusive(lockPath, content))
      return;
    console.error("Failed to acquire PID lock");
    process.exit(1);
  }

  // probe === "unknown" — inconclusive (could be starting up, curl missing, etc.)
  // Use /proc/PID/cmdline as secondary signal on Linux
  if (isProbablyAccessByProc(existing.pid)) {
    // Likely our process still starting — refuse to take over
    console.error(`Another instance appears to be starting (PID ${existing.pid}). If this is stale, remove ${lockPath}`);
    process.exit(1);
  }

  // Neither HTTP nor procfs confirms it's ours — treat as recycled PID
  rmSync(lockPath, { force: true });
  if (tryCreateExclusive(lockPath, content))
    return;

  console.error("Failed to acquire PID lock");
  process.exit(1);
}

export function releasePidLock(): void {
  if (!lockPath)
    return;
  try {
    const raw = readFileSync(lockPath, "utf-8");
    const existing = parseLockFile(raw);
    if (existing && existing.pid === process.pid) {
      rmSync(lockPath, { force: true });
    }
  }
  catch {
    // Lock file already removed
  }
}
