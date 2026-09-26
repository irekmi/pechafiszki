import { verify } from "argon2";
import type { Role } from "@prisma/client";
import { z } from "zod";
import { findUserByEmail } from "./findUserByEmail";

/**
 * API-02 — verifies a pair of credentials. Returns the person, or `null`; the two failure causes
 * (no such address, wrong password) are never told apart, here or above.
 *
 * `passwordHash` is read for the comparison and never leaves this function.
 */

export type AuthenticatedUser = {
  id: number;
  email: string;
  nickname: string;
  role: Role;
};

/**
 * An argon2id digest of 32 random bytes that were thrown away, with the same cost parameters the
 * seed and registration use. No password matches it — its only purpose is that an unknown address
 * pays exactly the same verification as a known one, so timing does not reveal which addresses
 * exist (SCR-01 behaviour row 2).
 */
const ABSENT_USER_HASH =
  "$argon2id$v=19$m=65536,p=4,t=3$hE9Dt9hJblQSa1exGtGPlQ$HCEbzaZWYV7LCI2i+eF/mTrwjVQwXIz10tG2V7eP17E";

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const address = email.trim();
  if (address === "" || password === "") return null;

  // The address is unique case-insensitively through `lower("email")` (SQ-02.1), so the lookup
  // compares case-insensitively too — literally, with no wildcard semantics (ISS-12).
  const row = await findUserByEmail(address);

  const matches = await verifyQuietly(row?.passwordHash ?? ABSENT_USER_HASH, password);
  if (!row || !matches) return null;

  return { id: row.id, email: row.email, nickname: row.nickname, role: row.role };
}

const credentialsSchema = z.object({
  email: z.string().min(1).max(320),
  password: z.string().min(1).max(1024),
});

/**
 * What the credentials provider calls. Exactly two fields are read; anything else submitted
 * alongside them — a `role`, an `id` — is dropped by the schema, and the role in the returned
 * identity is the row's, never the caller's (CLAUDE.md §8, AC-03.5).
 */
export async function authorizeCredentials(raw: unknown): Promise<AuthenticatedUser | null> {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  return verifyCredentials(parsed.data.email, parsed.data.password);
}

/** A malformed digest must fail like a wrong password, not crash the request. */
async function verifyQuietly(digest: string, password: string): Promise<boolean> {
  try {
    return await verify(digest, password);
  } catch {
    return false;
  }
}
