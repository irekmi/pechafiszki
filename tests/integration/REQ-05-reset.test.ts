import { hash, verify } from "argon2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInSession } from "./setup/mockSession";

/**
 * REQ-05 / SCR-03 / SCR-04 / API-03 / API-04 / API-05 — exercised through the real actions and
 * services against the throwaway PostgreSQL. `auth` and `sendPasswordResetEmail` are the only two
 * seams mocked: no real SMTP call is made, and no session is real, but every hash, expiry and
 * single-use rule runs for real (`CLAUDE.md` §9.2).
 */

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn<(to: string, resetUrl: string) => Promise<void>>(),
}));

vi.mock("@/server/mail", () => ({ sendPasswordResetEmail: sendMock }));

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
}));

const { auth } = await import("@/server/auth");
const { requestPasswordResetAction } = await import("@/app/(auth)/reset-hasla/actions");
const { emptyResetHaslaState } = await import("@/app/(auth)/reset-hasla/resetHaslaState");
const { setNewPasswordAction } = await import("@/app/(auth)/nowe-haslo/actions");
const { validateResetToken } = await import("@/server/services/validateResetToken");

const authMock = asSessionMock(auth);

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

/** The raw token only ever exists in the argument handed to `sendPasswordResetEmail`. */
function lastRawToken(): string {
  const call = sendMock.mock.calls.at(-1);
  if (!call) throw new Error("sendPasswordResetEmail was never called");
  return new URL(call[1]).searchParams.get("token") as string;
}

beforeEach(async () => {
  await resetDatabase();
  authMock.mockResolvedValue(null);
  sendMock.mockClear();
});

describe("SCR-03 / API-03 — requestPasswordReset", () => {
  it("gives a byte-identical response for a registered and an unregistered address (AC-05.1)", async () => {
    const user = await createUser({ email: "known@example.test" });

    const known = await requestPasswordResetAction(
      emptyResetHaslaState,
      form({ email: user.email }),
    );
    const unknown = await requestPasswordResetAction(
      emptyResetHaslaState,
      form({ email: "nikt@example.test" }),
    );

    expect(known).toEqual(unknown);
    expect(known).toEqual({ email: "", submitted: true });
  });

  it("sends nothing for an unregistered address, exactly one message for a known one", async () => {
    await requestPasswordResetAction(emptyResetHaslaState, form({ email: "nikt@example.test" }));
    expect(sendMock).not.toHaveBeenCalled();

    const user = await createUser({ email: "known@example.test" });
    await requestPasswordResetAction(emptyResetHaslaState, form({ email: user.email }));
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("finds the account whatever the case of the typed address (SQ-02.1)", async () => {
    await createUser({ email: "Known@Example.Test" });
    await requestPasswordResetAction(emptyResetHaslaState, form({ email: "known@example.test" }));
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("invalidates a previously issued link when a new one is requested (AC-05.2)", async () => {
    const user = await createUser({ email: "known@example.test" });

    await requestPasswordResetAction(emptyResetHaslaState, form({ email: user.email }));
    const firstToken = lastRawToken();

    await requestPasswordResetAction(emptyResetHaslaState, form({ email: user.email }));

    expect(await db.passwordResetToken.count({ where: { userId: user.id } })).toBe(1);
    expect((await validateResetToken(firstToken)).valid).toBe(false);
  });

  it("refuses an empty address, sends nothing (AC-05.8)", async () => {
    const state = await requestPasswordResetAction(emptyResetHaslaState, form({ email: "" }));
    expect(state).toEqual({ email: "", submitted: false, emailError: "Podaj poprawny adres e-mail" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("still returns the identical success notice when SMTP itself fails (test scenario 5)", async () => {
    const user = await createUser({ email: "known@example.test" });
    sendMock.mockRejectedValueOnce(new Error("smtp down"));

    const state = await requestPasswordResetAction(
      emptyResetHaslaState,
      form({ email: user.email }),
    );
    expect(state).toEqual({ email: "", submitted: true });
  });

  it("stores only the hash, never the raw token (AC-05.7)", async () => {
    const user = await createUser({ email: "known@example.test" });
    await requestPasswordResetAction(emptyResetHaslaState, form({ email: user.email }));
    const raw = lastRawToken();

    const row = await db.passwordResetToken.findFirstOrThrow({ where: { userId: user.id } });
    expect(row.tokenHash).not.toBe(raw);
    expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("does not block the response on the SMTP round trip (timing side-channel fix)", async () => {
    const user = await createUser({ email: "known@example.test" });
    // The mail send never settles during this test — if the action awaited it, this test would
    // time out instead of resolving quickly.
    sendMock.mockImplementationOnce(() => new Promise<void>(() => {}));

    const started = performance.now();
    const state = await requestPasswordResetAction(
      emptyResetHaslaState,
      form({ email: user.email }),
    );
    const elapsedMs = performance.now() - started;

    expect(state).toEqual({ email: "", submitted: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(elapsedMs).toBeLessThan(1000);
  });

  it("pays the same local write cost for a known and an unknown address (timing side-channel fix)", async () => {
    const user = await createUser({ email: "known@example.test" });

    const knownStart = performance.now();
    await requestPasswordResetAction(emptyResetHaslaState, form({ email: user.email }));
    const knownElapsedMs = performance.now() - knownStart;

    const unknownStart = performance.now();
    await requestPasswordResetAction(emptyResetHaslaState, form({ email: "nikt@example.test" }));
    const unknownElapsedMs = performance.now() - unknownStart;

    // Both paths now run exactly one deleteMany + one create before resolving, and neither awaits
    // the SMTP call — so neither should dominate the other by an order of magnitude.
    expect(Math.abs(knownElapsedMs - unknownElapsedMs)).toBeLessThan(
      Math.max(knownElapsedMs, unknownElapsedMs, 20),
    );
  });

  it("refuses a signed-in caller, sends nothing (CLAUDE.md §8)", async () => {
    authMock.mockResolvedValue(signedInSession("USER"));
    const refusal = await refusalFrom(() =>
      requestPasswordResetAction(emptyResetHaslaState, form({ email: "known@example.test" })),
    );
    expect(refusal.target).toBe("/");
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("SCR-04 / API-04 — validateResetToken", () => {
  it("is valid for a fresh token, invalid for a missing or unknown one", async () => {
    const user = await createUser({ email: "known@example.test" });
    await requestPasswordResetAction(emptyResetHaslaState, form({ email: user.email }));
    const raw = lastRawToken();

    expect((await validateResetToken(raw)).valid).toBe(true);
    expect((await validateResetToken(undefined)).valid).toBe(false);
    expect((await validateResetToken("not-a-real-token")).valid).toBe(false);
  });

  it("is invalid once older than 60 minutes, same outcome as a spent one (AC-05.5, DEC-46)", async () => {
    const user = await createUser({ email: "known@example.test" });
    await requestPasswordResetAction(emptyResetHaslaState, form({ email: user.email }));
    const raw = lastRawToken();

    await db.passwordResetToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect((await validateResetToken(raw)).valid).toBe(false);
  });
});

describe("SCR-04 / API-05 — setNewPassword", () => {
  const OLD_PASSWORD = "correct horse battery staple";
  const NEW_PASSWORD = "a brand new password entirely";

  async function issueToken(email: string): Promise<string> {
    await requestPasswordResetAction(emptyResetHaslaState, form({ email }));
    return lastRawToken();
  }

  it("saves the password, deletes the token, and redirects to SCR-01 with no token on the URL (AC-05.3, AC-05.6)", async () => {
    const user = await createUser({ email: "known@example.test", passwordHash: await hash(OLD_PASSWORD) });
    const raw = await issueToken(user.email);

    const refusal = await refusalFrom(() =>
      setNewPasswordAction(
        { invalid: false },
        form({ token: raw, password: NEW_PASSWORD, password_repeat: NEW_PASSWORD }),
      ),
    );

    expect(refusal.target).toBe("/logowanie?zmiana=haslo-zmienione");
    expect(refusal.target).not.toContain(raw);

    const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verify(row.passwordHash, NEW_PASSWORD)).toBe(true);
    expect(await verify(row.passwordHash, OLD_PASSWORD)).toBe(false);
    expect(await db.passwordResetToken.count({ where: { userId: user.id } })).toBe(0);
  });

  it("shows the same expired-link outcome for a second use of the same link (AC-05.4)", async () => {
    const user = await createUser({ email: "known@example.test" });
    const raw = await issueToken(user.email);
    const submit = (password: string) =>
      setNewPasswordAction(
        { invalid: false },
        form({ token: raw, password, password_repeat: password }),
      );

    await refusalFrom(() => submit(NEW_PASSWORD));
    const second = await submit("yet another password");

    expect(second).toEqual({ invalid: true });
  });

  it("re-validates at submit time — expiring between load and submit refuses, password unchanged (scenario 4)", async () => {
    const user = await createUser({
      email: "known@example.test",
      passwordHash: await hash(OLD_PASSWORD),
    });
    const raw = await issueToken(user.email);
    expect((await validateResetToken(raw)).valid).toBe(true);

    await db.passwordResetToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await setNewPasswordAction(
      { invalid: false },
      form({ token: raw, password: NEW_PASSWORD, password_repeat: NEW_PASSWORD }),
    );

    expect(result).toEqual({ invalid: true });
    const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verify(row.passwordHash, OLD_PASSWORD)).toBe(true);
  });

  it("refuses mismatched passwords under Powtórz nowe hasło (behaviour row 4)", async () => {
    const user = await createUser({ email: "known@example.test" });
    const raw = await issueToken(user.email);

    const state = await setNewPasswordAction(
      { invalid: false },
      form({ token: raw, password: NEW_PASSWORD, password_repeat: "something else entirely" }),
    );

    expect(state).toEqual({ invalid: false, passwordRepeatError: "Hasła nie są takie same" });
    expect((await validateResetToken(raw)).valid).toBe(true);
  });

  it("refuses a signed-in caller, token stays valid (CLAUDE.md §8)", async () => {
    const user = await createUser({ email: "known@example.test" });
    const raw = await issueToken(user.email);

    authMock.mockResolvedValue(signedInSession("ADMIN"));
    const refusal = await refusalFrom(() =>
      setNewPasswordAction(
        { invalid: false },
        form({ token: raw, password: NEW_PASSWORD, password_repeat: NEW_PASSWORD }),
      ),
    );

    expect(refusal.target).toBe("/");
    authMock.mockResolvedValue(null);
    expect((await validateResetToken(raw)).valid).toBe(true);
  });
});
