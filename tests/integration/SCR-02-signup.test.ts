import { verify } from "argon2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInSession } from "./setup/mockSession";

/**
 * SCR-02 / API-01 — exercised through the real server action and the real database, as
 * `CLAUDE.md` §9.2 asks: every refusal in the stage file's acceptance criteria, not only the
 * happy path. `auth` (permissions.ts) and `signIn` (the action's own sign-in call) are the only
 * two seams mocked — everything else, including uniqueness, runs against the throwaway PostgreSQL.
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

const { auth, signIn } = await import("@/server/auth");
const { signUpAction } = await import("@/app/(auth)/rejestracja/actions");
const { emptySignUpState } = await import("@/app/(auth)/rejestracja/signUpState");
const RejestracjaPage = (await import("@/app/(auth)/rejestracja/page")).default;

const authMock = asSessionMock(auth);
const signInMock = vi.mocked(signIn);

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const FRESH = {
  email: "anna.wojcik@example.test",
  nickname: "anna_w",
  password: "correct horse battery staple",
  password_repeat: "correct horse battery staple",
};

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  signInMock.mockClear();
});

describe("SCR-02 — access (public, redirected away when already signed in)", () => {
  it("renders for a Guest", async () => {
    authMock.mockResolvedValue(null);
    await expect(RejestracjaPage()).resolves.toBeTruthy();
  });

  it("redirects a signed-in User and Administrator to /start", async () => {
    authMock.mockResolvedValue(signedInSession("USER"));
    expect((await refusalFrom(() => RejestracjaPage())).target).toBe("/start");
    authMock.mockResolvedValue(signedInSession("ADMIN"));
    expect((await refusalFrom(() => RejestracjaPage())).target).toBe("/start");
  });
});

describe("API-01 — action signUp", () => {
  it("creates the account as USER, hashed, and signs the person in (AC-04.1)", async () => {
    const refusal = await refusalFrom(() => signUpAction(emptySignUpState, form(FRESH)));
    expect(refusal.target).toBe("/start");

    const row = await db.user.findUniqueOrThrow({ where: { email: FRESH.email } });
    expect(row).toMatchObject({ nickname: FRESH.nickname, role: "USER" });
    expect(await verify(row.passwordHash, FRESH.password)).toBe(true);
    expect(signInMock).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ email: FRESH.email, password: FRESH.password }),
    );
  });

  it("refuses a taken e-mail under the e-mail field, keeps the other values, no second row (AC-04.2)", async () => {
    await createUser({ email: FRESH.email, nickname: "someone_else" });
    const state = await signUpAction(emptySignUpState, form(FRESH));
    expect(state.emailError).toBe("Ten e-mail jest już zajęty");
    expect(state.nicknameError).toBeUndefined();
    expect(state.email).toBe(FRESH.email);
    expect(state.nickname).toBe(FRESH.nickname);
    expect(await db.user.count({ where: { email: FRESH.email } })).toBe(1);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("refuses Anna_W when anna_w already exists (AC-04.3, DEC-44)", async () => {
    await createUser({ email: "other@example.test", nickname: "anna_w" });
    const state = await signUpAction(
      emptySignUpState,
      form({ ...FRESH, email: "second@example.test", nickname: "Anna_W" }),
    );
    expect(state.nicknameError).toBe("Ten pseudonim jest już zajęty");
    expect(await db.user.count()).toBe(1);
  });

  it("refuses mismatched passwords under Powtórz hasło, keeps e-mail and nickname (AC-04.4)", async () => {
    const state = await signUpAction(
      emptySignUpState,
      form({ ...FRESH, password_repeat: "something entirely different" }),
    );
    expect(state.passwordRepeatError).toBe("Hasła nie są takie same");
    expect(state.email).toBe(FRESH.email);
    expect(state.nickname).toBe(FRESH.nickname);
    expect(await db.user.count()).toBe(0);
  });

  it("refuses a nickname too short or containing a space, at the server, writing nothing (AC-04.5)", async () => {
    const message = "Pseudonim może zawierać litery, cyfry, znak podkreślenia i myślnik, od 3 do 24 znaków";

    const tooShort = await signUpAction(emptySignUpState, form({ ...FRESH, nickname: "an" }));
    expect(tooShort.nicknameError).toBe(message);

    const withSpace = await signUpAction(
      emptySignUpState,
      form({ ...FRESH, email: "other@example.test", nickname: "anna w" }),
    );
    expect(withSpace.nicknameError).toBe(message);

    expect(await db.user.count()).toBe(0);
  });

  it("writes role USER even when the request body claims ADMIN (AC-04.6, CLAUDE.md §8)", async () => {
    await refusalFrom(() =>
      signUpAction(emptySignUpState, form({ ...FRESH, role: "ADMIN" } as Record<string, string>)),
    );
    const row = await db.user.findUniqueOrThrow({ where: { email: FRESH.email } });
    expect(row.role).toBe("USER");
  });

  it("refuses a signed-in User/Administrator calling the action directly, no row written (CLAUDE.md §8)", async () => {
    authMock.mockResolvedValue(signedInSession("USER"));
    expect((await refusalFrom(() => signUpAction(emptySignUpState, form(FRESH)))).target).toBe(
      "/start",
    );
    expect(await db.user.count({ where: { email: FRESH.email } })).toBe(0);

    authMock.mockResolvedValue(signedInSession("ADMIN"));
    expect((await refusalFrom(() => signUpAction(emptySignUpState, form(FRESH)))).target).toBe(
      "/start",
    );
    expect(await db.user.count({ where: { email: FRESH.email } })).toBe(0);
    expect(signInMock).not.toHaveBeenCalled();
  });
});
