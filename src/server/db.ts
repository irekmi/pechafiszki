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

export const db: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
