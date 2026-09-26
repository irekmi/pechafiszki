import { hash } from "argon2";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { authorizeCredentials, verifyCredentials } from "@/server/services/signIn";
import { resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInSession } from "./setup/mockSession";

/** The real argon2, with `verify` observed: the timing claim is about the code path it runs. */
const { verifySpy } = vi.hoisted(() => ({ verifySpy: vi.fn() }));

vi.mock("argon2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("argon2")>();
  verifySpy.mockImplementation(actual.verify);
  return { ...actual, verify: verifySpy, default: { ...actual, verify: verifySpy } };
});

/**
 * ISS-05 — `signInAction`'s own session guard, mirroring `SCR-02-signup.test.ts`'s equivalent
 * for `signUpAction`. Only `auth` (permissions.ts) and the action's own `signIn` call are mocked.
 */
vi.mock("@/server/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(async (_provider: string, options: { redirectTo: string }) => {
    throw new Refusal("redirect", options.redirectTo);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
}));

// `actions.ts` imports `AuthError` from the real package at module load time; the package itself
// pulls in `next/server`, which this Vitest environment cannot resolve. The action's own
// `error instanceof AuthError` check never runs in the guard test below, so a bare class stands in.
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

const { auth, signIn } = await import("@/server/auth");
const { signInAction } = await import("@/app/(auth)/logowanie/actions");
const { emptySignInState } = await import("@/app/(auth)/logowanie/signInState");

const authMock = asSessionMock(auth);
const signInMock = vi.mocked(signIn);

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const ADMIN = { email: "Admin.Seed@example.test", password: "correct horse battery staple" };
const LEARNER = { email: "learner@example.test", password: "another good password" };

describe("API-02 — action signIn", () => {
  beforeAll(async () => {
    await resetDatabase();
    await db.user.createMany({
      data: [
        {
          email: ADMIN.email,
          nickname: "seed_admin",
          passwordHash: await hash(ADMIN.password),
          role: "ADMIN",
        },
        {
          email: LEARNER.email,
          nickname: "learner",
          passwordHash: await hash(LEARNER.password),
          role: "USER",
        },
      ],
    });
  });

  beforeEach(() => {
    // A block body on purpose: returning the mock would let the runner treat it as a thenable.
    verifySpy.mockClear();
    authMock.mockReset();
    signInMock.mockClear();
  });

  it("verifies the seeded administrator and reports the role from the row (AC-03.1, DEC-42)", async () => {
    const user = await verifyCredentials(ADMIN.email, ADMIN.password);
    expect(user).toMatchObject({ nickname: "seed_admin", role: "ADMIN" });
  });

  it("matches the address case-insensitively, as ENT-01's lower(email) unique index implies", async () => {
    expect(await verifyCredentials("ADMIN.SEED@EXAMPLE.TEST", ADMIN.password)).not.toBeNull();
  });

  it("refuses a wrong password and an unknown address alike (AC-03.2)", async () => {
    expect(await verifyCredentials(ADMIN.email, "wrong password entirely")).toBeNull();
    expect(await verifyCredentials("nobody@example.test", ADMIN.password)).toBeNull();
  });

  it("runs argon2 for an unknown address too, so the timing does not differ", async () => {
    await verifyCredentials("nobody@example.test", "whatever was typed");
    expect(verifySpy).toHaveBeenCalledTimes(1);
  });

  it("never returns the password hash", async () => {
    const user = await verifyCredentials(LEARNER.email, LEARNER.password);
    expect(JSON.stringify(user)).not.toContain("$argon2");
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("ignores a role claimed in the submitted credentials (AC-03.5)", async () => {
    const user = await authorizeCredentials({
      email: LEARNER.email,
      password: LEARNER.password,
      role: "ADMIN",
      id: 1,
    });
    expect(user).toMatchObject({ role: "USER" });
  });

  it("refuses credentials that are not two strings", async () => {
    expect(await authorizeCredentials({ email: LEARNER.email })).toBeNull();
    expect(await authorizeCredentials({ email: "", password: "" })).toBeNull();
    expect(await authorizeCredentials(null)).toBeNull();
  });

  it("treats a row whose digest is not argon2 as a failed sign-in, not an error", async () => {
    await db.user.create({
      data: { email: "broken@example.test", nickname: "broken", passwordHash: "not-a-digest" },
    });
    await expect(verifyCredentials("broken@example.test", "anything")).resolves.toBeNull();
  });
});

describe("API-02 — action signIn, session guard (ISS-05)", () => {
  it("redirects a signed-in User/Administrator calling the action directly, no sign-in attempt", async () => {
    authMock.mockResolvedValue(signedInSession("USER"));
    expect(
      (await refusalFrom(() => signInAction(emptySignInState, form(LEARNER)))).target,
    ).toBe("/");
    expect(signInMock).not.toHaveBeenCalled();

    authMock.mockResolvedValue(signedInSession("ADMIN"));
    expect(
      (await refusalFrom(() => signInAction(emptySignInState, form(ADMIN)))).target,
    ).toBe("/");
    expect(signInMock).not.toHaveBeenCalled();
  });
});
