import { db } from "@/server/db";
import { verifyQuietly } from "./signIn";

/**
 * Confirms the session user's own current password (API-36, API-37) against the stored digest,
 * which never leaves this function. Shared by `changePassword` and `deleteOwnAccount` so there is
 * one place that reads a `passwordHash` for a self-confirmation, not two.
 */
export async function verifyCurrentPassword(userId: number, password: string): Promise<boolean> {
  if (password === "") return false;
  const row = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!row) return false;
  return verifyQuietly(row.passwordHash, password);
}
