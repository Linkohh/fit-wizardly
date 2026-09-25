import { spawn } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const DEV_HOST = '127.0.0.1';
const DEV_PORT = 8080;
const STARTUP_TIMEOUT_MS = 30_000;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

if (process.argv.includes('--help')) {
  console.log(`Usage: npm run ios:live

Starts the Vite dev server if needed, waits for http://localhost:8080,
then launches Capacitor iOS live reload.

Notes:
- Reuses an existing server on port 8080 if one is already running, and warns
  if it is localhost-only (physical devices need \`npm run dev -- --host ::\`)
- Forwards Ctrl+C to both child processes when it started them
- Under the hood this runs: npm run dev + npm run ios:live:cap
- npm run dev:ios is kept as an alias for the same workflow`);
  process.exit(0);
}

let devProcess = null;
let iosProcess = null;
let startedDevServer = false;
let shuttingDown = false;

function describeExit(code, signal) {
  if (signal) {
    return `signal ${signal}`;
  }

  if (code === null || code === undefined) {
    return 'unknown exit';
  }

  return `exit code ${code}`;
}

function spawnNpm(args, label) {
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    env: process.env,
  });

  child.once('error', (error) => {
    console.error(`Failed to start ${label}: ${error.message}`);
    shutdown(1);
  });

  return child;
}

function stopChild(child, signal = 'SIGINT') {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  child.kill(signal);
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  stopChild(iosProcess);

  if (startedDevServer) {
    stopChild(devProcess);
  }

  setTimeout(() => {
    if (startedDevServer) {
      stopChild(devProcess, 'SIGTERM');
    }

    stopChild(iosProcess, 'SIGTERM');
  }, 1_500).unref();

  setTimeout(() => {
    process.exit(code);
  }, 1_700).unref();
}

function isPortOpen(host, port, timeoutMs = 750) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForPort(host, port, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isPortOpen(host, port)) {
      return;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for Vite on http://localhost:${port}`);
}

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

function getLanAddress() {
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return null;
}

async function isDevServerRunning() {
  // vite.config.ts binds "localhost", which may resolve to ::1 rather than 127.0.0.1.
  return (await isPortOpen(DEV_HOST, DEV_PORT)) || (await isPortOpen('::1', DEV_PORT));
}

async function warnIfNotLanAccessible() {
  const lanAddress = getLanAddress();
  if (!lanAddress || (await isPortOpen(lanAddress, DEV_PORT))) {
    return;
  }

  console.warn(`Warning: the running Vite server is localhost-only (not reachable at http://${lanAddress}:${DEV_PORT}).
  The iOS Simulator will work, but a physical device cannot connect.
  For device live reload, stop that server and rerun \`npm run ios:live\`,
  or start it with \`npm run dev -- --host ::\`.`);
}

async function ensureDevServerReady() {
  if (await isDevServerRunning()) {
    console.log(`Reusing existing Vite server on http://localhost:${DEV_PORT}`);
    await warnIfNotLanAccessible();
    return;
  }

  console.log(`Starting Vite dev server on http://localhost:${DEV_PORT}...`);
  startedDevServer = true;
  // --host :: exposes the dev server on the LAN so the iOS device can reach it;
  // vite.config.ts deliberately defaults to localhost-only.
  devProcess = spawnNpm(['run', 'dev', '--', '--host', '::'], 'Vite dev server');

  const devExitBeforeReady = new Promise((_, reject) => {
    devProcess.once('exit', (code, signal) => {
      reject(new Error(`Vite stopped before becoming ready (${describeExit(code, signal)}).`));
    });
  });

  await Promise.race([
    waitForPort(DEV_HOST, DEV_PORT, STARTUP_TIMEOUT_MS),
    devExitBeforeReady,
  ]);

  console.log('Vite dev server is ready.');
}

async function main() {
  await ensureDevServerReady();

  const extraArgs = process.argv.slice(2).filter(arg => arg !== '--help');
  const capArgs = ['run', 'ios:live:cap'];
  if (extraArgs.length > 0) {
    capArgs.push('--', ...extraArgs);
  }

  console.log(`Launching Capacitor iOS live reload with arguments: ${capArgs.join(' ')}`);
  iosProcess = spawnNpm(capArgs, 'Capacitor iOS live reload');

  if (devProcess) {
    devProcess.once('exit', (code, signal) => {
      if (shuttingDown || !iosProcess || iosProcess.exitCode !== null) {
        return;
      }

      console.error(`Vite dev server stopped unexpectedly (${describeExit(code, signal)}).`);
      shutdown(code ?? 1);
    });
  }

  iosProcess.once('exit', (code, signal) => {
    if (startedDevServer) {
      stopChild(devProcess);
    }

    if (signal) {
      shutdown(1);
      return;
    }

    shutdown(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  shutdown(1);
});
