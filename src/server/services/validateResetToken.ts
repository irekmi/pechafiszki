import { createHash } from "node:crypto";
import type { PasswordResetToken, Prisma, PrismaClient } from "@prisma/client";
import { db as defaultDb } from "@/server/db";

/**
 * API-04, and the re-validation `setNewPassword` runs before it writes (API-05) — one definition of
 * "valid" for both call sites, per the stage file's task 6 note. A missing, unknown, spent or
 * expired token all take the same `{ valid: false }` path; nothing here tells them apart to a
 * caller (REQ-05).
 *
 * `client` defaults to the module singleton but accepts a transaction client too, so
 * `setNewPassword` can re-validate and spend the token atomically without a second definition of
 * "valid".
 */

/** SHA-256 of the raw token; only this ever reaches the database (`CLAUDE.md` §8, ENT-09). */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export type TokenValidation =
  | { valid: true; token: PasswordResetToken }
  | { valid: false };

type Client = PrismaClient | Prisma.TransactionClient;

export async function validateResetToken(
  raw: string | undefined | null,
  client: Client = defaultDb,
): Promise<TokenValidation> {
  if (!raw) return { valid: false };

  const token = await client.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!token || token.usedAt || token.expiresAt.getTime() <= Date.now()) return { valid: false };

  return { valid: true, token };
}
