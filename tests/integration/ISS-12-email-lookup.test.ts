import { hash } from "argon2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { findUserByEmail } from "@/server/services/findUserByEmail";
import { requestPasswordReset } from "@/server/services/requestPasswordReset";
import { createAccount } from "@/server/services/signUp";
import { verifyCredentials } from "@/server/services/signIn";
import { createUser, resetDatabase } from "./setup/fixtures";

// ISS-12 / SQ-02.1 — the address lookup is exact equality that ignores case only. `_`, `%` and `\`
// typed in an address are ordinary characters, never LIKE wildcards, so no other account is ever
// resolved, signed into or sent a reset message. Covers sign-in (API-02), reset (API-03) and
// registration (API-01).

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn<(to: string, resetUrl: string) => Promise<void>>(),
}));
vi.mock("@/server/mail", () => ({ sendPasswordResetEmail: sendMock }));

const PASSWORD = "shared password 123";

/** Wildcard-shaped addresses, each of which would match `victim` under an unescaped ILIKE. */
const CASES = [
  { name: "underscore", typed: "a_@example.test", victim: "ab@example.test" },
  { name: "percent", typed: "%@example.test", victim: "ab@example.test" },
  { name: "backslash", typed: "a\\b@example.test", victim: "ab@example.test" },
  {
    name: "underscore inside a longer local part",
    typed: "m_xed.case@example.test",
    victim: "Mixed.Case@Example.test",
  },
];

let n = 0;
async function makeUser(email: string) {
  n += 1;
  return createUser({
    email,
    nickname: `iss12_${n}`,
    passwordHash: await hash(PASSWORD),
  });
}

beforeEach(async () => {
  await resetDatabase();
  sendMock.mockClear();
});

describe("ISS-12 — findUserByEmail", () => {
  it("matches a differently cased address", async () => {
    const user = await makeUser("Mixed.Case@Example.test");
    expect((await findUserByEmail("MIXED.CASE@EXAMPLE.TEST"))?.id).toBe(
      user.id,
    );
    expect((await findUserByEmail("mixed.case@example.test"))?.id).toBe(
      user.id,
    );
  });

  it.each(CASES)(
    "resolves nobody for a $name address that only looks like another one",
    async (c) => {
      await makeUser(c.victim);
      expect(await findUserByEmail(c.typed)).toBeNull();
    },
  );

  it("finds an address that really contains the metacharacters, and only that one", async () => {
    await makeUser("aXb@example.test");
    const own = await makeUser("a_b@example.test");
    expect((await findUserByEmail("A_B@example.test"))?.id).toBe(own.id);
  });
});

describe("ISS-12 — sign-in (API-02)", () => {
  it.each(CASES)(
    "refuses a $name address that is not an account's own",
    async (c) => {
      await makeUser(c.victim);
      expect(await verifyCredentials(c.typed, PASSWORD)).toBeNull();
    },
  );

  it("signs the owner of a_b@… in, not the owner of aXb@…, whatever the case", async () => {
    await makeUser("aXb@example.test");
    const own = await makeUser("a_b@example.test");
    expect((await verifyCredentials("A_B@EXAMPLE.TEST", PASSWORD))?.id).toBe(
      own.id,
    );
  });
});

describe("ISS-12 — password reset (API-03)", () => {
  it.each(CASES)(
    "neither sends nor writes a token for a $name address",
    async (c) => {
      const victim = await makeUser(c.victim);
      const token = await db.passwordResetToken.create({
        data: {
          userId: victim.id,
          tokenHash: "kept",
          expiresAt: new Date(Date.now() + 60_000),
        },
      });
      await requestPasswordReset(c.typed);
      expect(sendMock).not.toHaveBeenCalled();
      expect(await db.passwordResetToken.findMany()).toEqual([token]);
    },
  );

  it("sends to the real owner of a_b@… when typed in another case", async () => {
    await makeUser("aXb@example.test");
    const own = await makeUser("a_b@example.test");
    await requestPasswordReset("A_B@Example.Test");
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0]?.[0]).toBe("a_b@example.test");
    expect(
      (await db.passwordResetToken.findMany()).map((t) => t.userId),
    ).toEqual([own.id]);
  });
});

describe("ISS-12 — registration (API-01)", () => {
  const input = (email: string, nickname: string) => ({
    email,
    nickname,
    password: PASSWORD,
    password_repeat: PASSWORD,
  });

  it.each(CASES)(
    "accepts a $name address that is not a duplicate",
    async (c) => {
      await makeUser(c.victim);
      const result = await createAccount(input(c.typed, "fresh_nick"));
      expect(result.ok).toBe(true);
      expect(await db.user.count()).toBe(2);
    },
  );

  it("still rejects an address that differs from an existing one only in case", async () => {
    await makeUser("a_b@example.test");
    const result = await createAccount(input("A_B@Example.Test", "fresh_nick"));
    expect(result).toEqual({
      ok: false,
      fieldErrors: { email: "Ten e-mail jest już zajęty" },
    });
  });
});
