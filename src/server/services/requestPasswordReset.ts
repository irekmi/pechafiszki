import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/server/db";
import { sendPasswordResetEmail } from "@/server/mail";
import { hashToken } from "./validateResetToken";

/**
 * API-03 — the schema is exported so the action validates with the exact rule this enforces
 * (the pattern `signUpSchema` set in ST-04).
 */
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Podaj poprawny adres e-mail")
    .max(320)
    .email("Podaj poprawny adres e-mail"),
});

/** DEC-46 — 60 minutes. */
const TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Never a real user id (Postgres' serial `id` column starts at 1 and is never negative) — the
 * unknown-address path deletes and inserts against this id so it pays the same two local
 * round-trips a known address pays, without needing a real dummy row (mirrors `ABSENT_USER_HASH`
 * in `signIn.ts`, applied to a write instead of a hash comparison).
 */
const DUMMY_USER_ID = -1;

function baseUrl(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Always resolves, whether or not the address exists and whether or not SMTP itself works — the
 * caller (`reset-hasla/actions.ts`) renders the identical notice regardless (AC-05.1, `CLAUDE.md`
 * §8). `email` is `citext`, so the lookup is already case-insensitive.
 *
 * Timing symmetry: a known address used to additionally run `deleteMany` + `create` + an *awaited*
 * SMTP round trip before resolving, so a known address was measurably slower to respond to than an
 * unknown one even though the two response bodies are identical — an enumeration channel by timing
 * alone. The two local writes are now run (and awaited) on both paths, so the bounded, local part of
 * the cost is equal either way. The unbounded part — the SMTP round trip — cannot be matched by a
 * fixed dummy delay (network latency varies too much for that to hold up under repeated sampling),
 * so instead it is simply never awaited on the response path: the message is handed to Nodemailer
 * and the action returns without waiting to hear whether it was delivered.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true } });
  const userId = user?.id ?? DUMMY_USER_ID;

  // "Requesting a new link invalidates any outstanding one for that account" (ENT-09). For an
  // unknown address this matches nothing and costs one indexed round trip, same as a real one.
  await db.passwordResetToken.deleteMany({ where: { userId } });

  const raw = randomBytes(32).toString("hex");
  const data = { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) };
  if (user) {
    await db.passwordResetToken.create({ data });
  } else {
    // Rejected by the `userId` foreign key — caught and discarded, never persisted. Its cost is the
    // same insert-and-constraint-check round trip a real one pays.
    await db.passwordResetToken.create({ data }).catch(() => {});
    return;
  }

  const resetUrl = `${baseUrl()}/nowe-haslo?token=${raw}`;
  // Not awaited: the response must not wait on the SMTP round trip (see the doc comment above).
  // Surfacing a send failure would reveal the address exists (CLAUDE.md §8) — log only, never the
  // raw token or the link itself (AC-05.7).
  void Promise.resolve(sendPasswordResetEmail(user.email, resetUrl)).catch((error: unknown) => {
    console.error(
      "password reset e-mail failed to send:",
      error instanceof Error ? error.message : "unknown error",
    );
  });
}
