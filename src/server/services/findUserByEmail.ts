import type { Role } from "@prisma/client";
import { db } from "@/server/db";

export type UserByEmail = {
  id: number;
  email: string;
  nickname: string;
  role: Role;
  passwordHash: string;
};

/**
 * Finds the one account whose address equals `email`, ignoring case and nothing else (SQ-02.1,
 * ISS-12). `email` is unique through the `lower("email")` index, so at most one row matches.
 *
 * Raw SQL on purpose (CLAUDE.md §2): Prisma's `mode: "insensitive"` compiles to `ILIKE` with the
 * value unescaped, so `_` and `%` typed in an address become wildcards and can resolve a different
 * account; `ILIKE` also cannot use the `lower()` index. `lower("email") = lower($1)` is literal
 * equality and matches the index. The value is a bound parameter, never interpolated.
 */
export async function findUserByEmail(email: string): Promise<UserByEmail | null> {
  const rows = await db.$queryRaw<UserByEmail[]>`
    SELECT "id", "email", "nickname", "role", "passwordHash"
    FROM "User"
    WHERE lower("email") = lower(${email})
    LIMIT 1`;
  return rows[0] ?? null;
}
