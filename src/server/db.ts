import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * The one Prisma client of the application (CLAUDE.md §5). Every query, in every service, route
 * handler and test, goes through this instance; `new PrismaClient()` appears nowhere else, or a
 * development server's hot reload opens a new connection pool on every edit.
 */

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // The value itself is never echoed — only the name of the missing variable (CLAUDE.md §8).
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  return url;
}

function createClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString() }),
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function instance(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * Created on first use, not at import time. A page that merely imports something which imports
 * `db` — as every page reading data now does, starting with SCR-04's `validateResetToken` — must
 * not need `DATABASE_URL` just to be loaded, or `next build`'s page-data collection fails on every
 * such route even though it never runs a query at build time (found while building ST-05).
 * Properties are bound to the real client so Prisma's own internal `this` is never the proxy.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const value = Reflect.get(instance(), prop);
    return typeof value === "function" ? value.bind(instance()) : value;
  },
});
