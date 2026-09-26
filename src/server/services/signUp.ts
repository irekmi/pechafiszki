import { hash } from "argon2";
import { Prisma, type Role } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db";

/**
 * API-01 — creates an account and signs nobody in itself (the action does that). The role is
 * always `USER`: nothing here reads a role from the caller (`CLAUDE.md` §8, AC-04.6).
 *
 * The schema is exported so the action validates with the exact same rules it enforces here
 * (stage-04 task 2) — there is only one definition of "a valid registration".
 */

/** DEC-44 — letters incl. Polish, digits, `_` and `-`, 3–24 characters, as a single rule. */
const NICKNAME_PATTERN = /^[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9_-]{3,24}$/;
const NICKNAME_MESSAGE =
  "Pseudonim może zawierać litery, cyfry, znak podkreślenia i myślnik, od 3 do 24 znaków";

export const signUpSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "E-mail jest wymagany")
      .max(320)
      .email("Podaj poprawny adres e-mail"),
    nickname: z.string().trim().regex(NICKNAME_PATTERN, NICKNAME_MESSAGE),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków").max(1024),
    password_repeat: z.string().min(1, "Powtórz hasło jest wymagane").max(1024),
  })
  .refine((data) => data.password === data.password_repeat, {
    message: "Hasła nie są takie same",
    path: ["password_repeat"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export type NewAccount = { id: number; email: string; nickname: string; role: Role };

type CollisionField = "email" | "nickname";

export type SignUpResult =
  | { ok: true; user: NewAccount }
  | { ok: false; fieldErrors: Partial<Record<CollisionField, string>> };

const COLLISION_MESSAGE: Record<CollisionField, string> = {
  email: "Ten e-mail jest już zajęty",
  nickname: "Ten pseudonim jest już zajęty",
};

/** Hashes the password, writes the row with role `USER`, and maps a unique-index hit back. */
export async function createAccount(input: SignUpInput): Promise<SignUpResult> {
  const passwordHash = await hash(input.password);

  try {
    const user = await db.user.create({
      data: { email: input.email, nickname: input.nickname, passwordHash, role: "USER" },
      select: { id: true, email: true, nickname: true, role: true },
    });
    return { ok: true, user };
  } catch (error) {
    const field = collidedField(error);
    if (!field) throw error;
    return { ok: false, fieldErrors: { [field]: COLLISION_MESSAGE[field] } };
  }
}

/**
 * `email` and `nickname` are both unique case-insensitively, through `lower(...)` indexes (SQ-02.1), so a race between two
 * simultaneous registrations is caught here, not by a pre-check that could itself lose the race.
 *
 * The driver adapter Prisma 7 requires (`src/server/db.ts`) does not fill `meta.target` with the
 * column list the way Prisma's own query engine used to — it nests the constraint name from the
 * database driver instead (`meta.driverAdapterError.cause.constraint.index`, e.g.
 * `"User_email_key"`). Rather than depend on that exact shape, the whole `meta` object is searched
 * as text for the two column names it can only mean.
 */
function collidedField(error: unknown): CollisionField | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }
  const text = JSON.stringify(error.meta ?? {});
  if (text.includes("email")) return "email";
  if (text.includes("nickname")) return "nickname";
  return null;
}
