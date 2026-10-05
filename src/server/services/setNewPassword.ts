import { hash } from "argon2";
import { z } from "zod";
import { db } from "@/server/db";
import { validateResetToken } from "./validateResetToken";

/**
 * API-05 — re-validates the token (closing the load-to-submit window API-04 alone cannot, per the
 * stage file's task 7 note) and spends it atomically: the password update and the token's deletion
 * happen in one transaction, so a token can never be read as valid twice.
 */
export const setNewPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków").max(1024),
    password_repeat: z.string().min(1, "Powtórz nowe hasło jest wymagane").max(1024),
  })
  .refine((data) => data.password === data.password_repeat, {
    message: "Hasła nie są takie same",
    path: ["password_repeat"],
  });

export type SetNewPasswordInput = z.infer<typeof setNewPasswordSchema>;

export type SetNewPasswordResult = { ok: true } | { ok: false };

export async function setNewPassword(input: SetNewPasswordInput): Promise<SetNewPasswordResult> {
  const passwordHash = await hash(input.password);

  const saved = await db.$transaction(async (tx) => {
    const validation = await validateResetToken(input.token, tx);
    if (!validation.valid) return false;

    await tx.user.update({
      where: { id: validation.token.userId },
      data: { passwordHash },
    });
    // Deleted, not marked used — a redeemed token leaves no row at all (ENT-09, DEC-46).
    await tx.passwordResetToken.delete({ where: { id: validation.token.id } });
    return true;
  });

  return saved ? { ok: true } : { ok: false };
}
