import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { nicknameSchema } from "./signUp";

export type UpdateNicknameResult = { ok: true; nickname: string } | { ok: false; error: string };

const INVALID_MESSAGE = "Pseudonim może zawierać litery, cyfry, znak podkreślenia i myślnik, od 3 do 24 znaków";

/**
 * API-35 — DEC-44's rules, always the session user's own row; no id is read from the form (NFR-01).
 * Uniqueness is the database's case-insensitive `lower(nickname)` index, caught here on a collision
 * rather than a pre-check that could itself lose a race — the same pattern `createAccount` uses.
 */
export async function updateNickname(userId: number, raw: string): Promise<UpdateNicknameResult> {
  const parsed = nicknameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? INVALID_MESSAGE };

  try {
    await db.user.update({ where: { id: userId }, data: { nickname: parsed.data } });
    return { ok: true, nickname: parsed.data };
  } catch (error) {
    if (isNicknameCollision(error)) return { ok: false, error: "Ten pseudonim jest już zajęty" };
    throw error;
  }
}

function isNicknameCollision(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  return JSON.stringify(error.meta ?? {}).includes("nickname");
}
