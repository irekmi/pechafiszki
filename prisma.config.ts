// Prisma 7 reads the connection URL and the seed command from here, not from schema.prisma.
// DATABASE_URL comes from the environment and is never written to a committed file (CLAUDE.md §8).
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
