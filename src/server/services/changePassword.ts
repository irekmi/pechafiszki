import { hash } from "argon2";
import { z } from "zod";
import { db } from "@/server/db";
import { verifyCurrentPassword } from "./verifyCurrentPassword";

const newPasswordSchema = z.string().min(8);

export type ChangePasswordResult = { ok: true } | { ok: false; error: "current" | "mismatch" | "weak" };

/**
 * API-36 — the current password is checked first, always: a wrong one refuses before the new pair is
 * even looked at, so the refusal never reveals whether the new password would have been acceptable
 * (SCR-14 acceptance hint). Other sessions are left alone (DEC-46) — nothing here touches a token.
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  newPasswordRepeat: string,
): Promise<ChangePasswordResult> {
  if (!(await verifyCurrentPassword(userId, currentPassword))) return { ok: false, error: "current" };
  if (newPassword !== newPasswordRepeat) return { ok: false, error: "mismatch" };

  const parsed = newPasswordSchema.safeParse(newPassword);
  if (!parsed.success) return { ok: false, error: "weak" };

  const passwordHash = await hash(parsed.data);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true };
}
