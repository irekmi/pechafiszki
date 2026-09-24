import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

/**
 * Vitest global setup for the integration project: a throwaway PostgreSQL, migrated by
 * `prisma migrate deploy`, for the whole run. The machine that builds this project has no system
 * PostgreSQL, so the tests bring their own; nothing here touches a real DATABASE_URL, and the
 * credentials below are a local socket's, not a secret (CLAUDE.md §8).
 */

const TEST_DB = "fiszki_test";
let postgres: EmbeddedPostgres | undefined;
let dataDir: string | undefined;

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

export async function setup(): Promise<void> {
  dataDir = mkdtempSync(join(tmpdir(), "fiszki-test-"));
  const port = await freePort();
  postgres = new EmbeddedPostgres({
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
  await postgres.createDatabase(TEST_DB);

  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/${TEST_DB}`;
  process.env.DATABASE_URL = url;
  execFileSync(join("node_modules", ".bin", "prisma"), ["migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}

export async function teardown(): Promise<void> {
  await postgres?.stop();
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
}
