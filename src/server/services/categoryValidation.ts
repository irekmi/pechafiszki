import { Prisma } from "@prisma/client";
import { z } from "zod";

/**
 * Shared by every category write (API-27, API-28). DEC-24: trimmed, 1–40 characters; the uniqueness
 * itself is not checked here — it is the database's `lower(name)` index (DL-02).
 */
export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Nazwa jest wymagana")
  .max(40, "Nazwa może mieć maksymalnie 40 znaków");

export type CategoryRecord = { id: number; name: string; position: number };

export const DUPLICATE_NAME = "Kategoria o tej nazwie już istnieje";

/**
 * A unique-index hit on `name` — either the plain `Category_name_key` or the case-insensitive
 * `Category_name_lower_key` that actually enforces DEC-24 (DL-02). Caught here rather than a
 * pre-check that could itself lose a race, the same pattern `createAccount` uses for `email` and
 * `nickname`. Not `mode: "insensitive"` anywhere (ISS-12 does not apply — this is a constraint
 * violation, not a lookup).
 */
export function isDuplicateNameError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  return JSON.stringify(error.meta ?? {}).includes("name");
}

/** The row was gone by the time the write reached it — a stale id from another tab or admin. */
export function isMissingRowError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
