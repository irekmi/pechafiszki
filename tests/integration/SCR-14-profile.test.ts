import { hash, verify } from "argon2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInWithRow } from "./setup/mockSession";

/**
 * SCR-14 / API-35 / API-36 (CLAUDE.md §9.2, NFR-01, DEC-44, DEC-46). Guest/User/Administrator on the
 * page; a nickname change never touches anybody else's row; a wrong current password refuses without
 * ever hinting whether the new one would have been accepted; a successful password change leaves the
 * caller signed in.
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
  notFound: vi.fn(() => {
    throw new Refusal("notFound");
  }),
  forbidden: vi.fn(() => {
    throw new Refusal("forbidden");
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-pathname": "/profil" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { default: ProfilPage } = await import("@/app/(app)/profil/page");
const { updateNicknameAction } = await import("@/server/actions/updateNickname");
const { changePasswordAction } = await import("@/server/actions/changePassword");
const authMock = asSessionMock(auth);
const signedIn = (role: "USER" | "ADMIN") => signedInWithRow(authMock, role);

const SESSION_ID = 7;
const PASSWORD = "correct horse battery";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

type ScreenProps = { profile: { nickname: string; email: string; role: string; submittedCount: number } };
const open = async () => (await ProfilPage()) as unknown as { props: { children: { props: ScreenProps } } };
const profileOf = async () => (await open()).props.children.props.profile;

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
});

describe("SCR-14 — an address that needs a session (NFR-01)", () => {
  it("a Guest is redirected; a User and an Administrator both see their own row", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(open)).kind).toBe("redirect");
    await signedIn("USER");
    expect(await profileOf()).toMatchObject({ nickname: "person", role: "USER" });
    await signedIn("ADMIN");
    expect(await profileOf()).toMatchObject({ nickname: "person", role: "ADMIN" });
  });
});

describe("API-35 — updateNickname (DEC-44)", () => {
  it("a Guest is refused; nothing changes", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => updateNicknameAction({ nickname: "person" }, form({ nickname: "new_name" })))).kind).toBe("redirect");
  });

  it("saves a valid nickname, the session user's own row only", async () => {
    await signedIn("USER");
    const other = await createUser({ nickname: "someone_else" });
    expect(await updateNicknameAction({ nickname: "person" }, form({ nickname: "anna_w" }))).toEqual({ nickname: "anna_w" });
    expect((await db.user.findUnique({ where: { id: SESSION_ID } }))?.nickname).toBe("anna_w");
    expect((await db.user.findUnique({ where: { id: other.id } }))?.nickname).toBe("someone_else");
  });

  it("refuses a nickname already taken, differing only in case; changes nothing", async () => {
    await createUser({ nickname: "Anna_W" });
    await signedIn("USER");
    const result = await updateNicknameAction({ nickname: "person" }, form({ nickname: "anna_w" }));
    expect(result).toEqual({ nickname: "anna_w", error: "Ten pseudonim jest już zajęty" });
    expect((await db.user.findUnique({ where: { id: SESSION_ID } }))?.nickname).toBe("person");
  });

  it("refuses a malformed nickname (too short, disallowed character)", async () => {
    await signedIn("USER");
    for (const bad of ["ab", "a".repeat(25), "with space"]) {
      const result = await updateNicknameAction({ nickname: "person" }, form({ nickname: bad }));
      expect(result.error).toBeTruthy();
    }
    expect((await db.user.findUnique({ where: { id: SESSION_ID } }))?.nickname).toBe("person");
  });
});

describe("API-36 — changePassword (DEC-46)", () => {
  beforeEach(async () => {
    await signedIn("USER");
    await db.user.update({ where: { id: SESSION_ID }, data: { passwordHash: await hash(PASSWORD) } });
  });

  it("a Guest is refused", async () => {
    authMock.mockResolvedValue(null);
    const run = () =>
      changePasswordAction({}, form({ current_password: PASSWORD, new_password: "newpassword1", new_password_repeat: "newpassword1" }));
    expect((await refusalFrom(run)).kind).toBe("redirect");
  });

  it("a wrong current password refuses, before the new pair is even judged", async () => {
    const result = await changePasswordAction(
      {},
      form({ current_password: "not-it", new_password: "x", new_password_repeat: "y" }),
    );
    expect(result).toEqual({ currentError: "Obecne hasło jest nieprawidłowe" });
    expect(await verify((await db.user.findUnique({ where: { id: SESSION_ID } }))!.passwordHash, PASSWORD)).toBe(true);
  });

  it("refuses when the new pair does not match", async () => {
    const result = await changePasswordAction(
      {},
      form({ current_password: PASSWORD, new_password: "newpassword1", new_password_repeat: "different1" }),
    );
    expect(result).toEqual({ repeatError: "Hasła nie są takie same" });
  });

  it("refuses a new password under 8 characters", async () => {
    const result = await changePasswordAction(
      {},
      form({ current_password: PASSWORD, new_password: "short", new_password_repeat: "short" }),
    );
    expect(result).toEqual({ newError: "Hasło musi mieć co najmniej 8 znaków" });
  });

  it("saves the new password and leaves the account able to sign in with it", async () => {
    const result = await changePasswordAction(
      {},
      form({ current_password: PASSWORD, new_password: "newpassword1", new_password_repeat: "newpassword1" }),
    );
    expect(result).toEqual({});
    const row = await db.user.findUnique({ where: { id: SESSION_ID } });
    expect(await verify(row!.passwordHash, "newpassword1")).toBe(true);
    expect(await verify(row!.passwordHash, PASSWORD)).toBe(false);
  });
});
