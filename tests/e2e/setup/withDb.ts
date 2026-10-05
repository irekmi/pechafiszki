import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

/**
 * Boots a throwaway PostgreSQL, migrates and seeds it, then runs the given command with
 * `DATABASE_URL` pointed at it — used as Playwright's `webServer.command` for the flows that need
 * real writes (NFR-03's flow 1 here; flows 2 and 3 in later stages reuse this file unchanged).
 *
 * Not Playwright's own `globalSetup`: in this Playwright version the `webServer` plugin starts
 * before `config.globalSetup` runs (`node_modules/playwright/lib/runner/index.js`,
 * `createGlobalSetupTasks`), so a separate globalSetup file would still race an unready database.
 * Wrapping the server command itself is the only order that is actually guaranteed.
 */

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => (port ? resolve(port) : reject(new Error("no free port"))));
    });
  });
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (!command) throw new Error("usage: tsx withDb.ts <command> [...args]");

  const dataDir = mkdtempSync(join(tmpdir(), "fiszki-e2e-"));
  const port = await freePort();
  const postgres = new EmbeddedPostgres({
    databaseDir: join(dataDir, "data"),
    user: "postgres",
    password: "postgres",
    port,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });
  await postgres.initialise();
  await postgres.start();
  await postgres.createDatabase("fiszki_e2e");

  // A local socket's credentials and a throwaway administrator for an ephemeral database that is
  // gone when this process exits — neither is a secret (CLAUDE.md §8), matching the vitest harness.
  const env = {
    ...process.env,
    DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${port}/fiszki_e2e`,
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL ?? "admin@example.test",
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? "correct horse battery staple e2e",
  };

  execFileSync(join("node_modules", ".bin", "prisma"), ["migrate", "deploy"], { env, stdio: "inherit" });
  execFileSync(join("node_modules", ".bin", "tsx"), ["prisma/seed.ts"], { env, stdio: "inherit" });

  const child = spawn(command, args, { env, stdio: "inherit" });
  let shuttingDown = false;
  const shutdown = async (code: number): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    await postgres.stop();
    rmSync(dataDir, { recursive: true, force: true });
    process.exit(code);
  };

  child.on("exit", (code) => void shutdown(code ?? 0));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  process.on("SIGINT", () => child.kill("SIGINT"));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
