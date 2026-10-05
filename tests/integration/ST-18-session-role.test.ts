import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * ST-18 / AC-18.4 / AC-18.11 / NFR-01 — the role and the existence of the signed-in account come from the
 * database on every request, not from the sign-in token (CLAUDE.md §8). "Open session" below is a token
 * minted before the change: its claims are frozen, the row behind it is not. The application has no
 * block/deactivate state (ST-18 defines role change and deletion only), so a deleted account is the
 * "account that no longer exists" case.
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
  forbidden: vi.fn(() => {
    throw new Refusal("forbidden");
  }),
  notFound: vi.fn(() => {
    throw new Refusal("notFound");
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-pathname": "/administracja/uzytkownicy" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { currentUser, requireAdmin, requireUser } = await import("@/server/permissions");
const { default: UsersPage } = await import("@/app/(admin)/administracja/uzytkownicy/page");
const { changeUserRoleAction } = await import("@/server/actions/changeUserRole");
const { deleteUserAction } = await import("@/server/actions/deleteUser");
const authMock = asSessionMock(auth);

type Person = { id: number; nickname: string; email: string };

/** A token as minted at sign-in: whatever role it says is what it will keep saying. */
function openSession(person: Person, tokenRole: "USER" | "ADMIN"): void {
  authMock.mockResolvedValue({
    user: { id: String(person.id), email: "stale@token.test", nickname: "stale_token", role: tokenRole },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session);
}

let boss: Person;
let helper: Person;

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  boss = await createUser({ role: "ADMIN", nickname: "boss" });
  helper = await createUser({ nickname: "helper" });
});

describe("ST-18 / AC-18.4 — a promotion applies to the session that is already open", () => {
  it("a User promoted on SCR-20 passes requireAdmin on the very next request, without signing in again", async () => {
    openSession(helper, "USER");
    expect((await refusalFrom(() => requireAdmin())).kind).toBe("forbidden");

    openSession(boss, "ADMIN");
    expect(await changeUserRoleAction({ id: helper.id, role: "ADMIN" })).toEqual({ ok: true });

    openSession(helper, "USER");
    await expect(requireAdmin()).resolves.toMatchObject({ id: helper.id, role: "ADMIN" });
  });
});

describe("ST-18 / AC-18.11 — a demotion, and a deletion, end the access on the next request", () => {
  it("a demoted administrator gets the 403 on SCR-19 and on requireAdmin, though the token still says ADMIN", async () => {
    await db.user.update({ where: { id: helper.id }, data: { role: "ADMIN" } });
    openSession(helper, "ADMIN");
    await expect(requireAdmin()).resolves.toMatchObject({ role: "ADMIN" });
    await expect(UsersPage({ searchParams: Promise.resolve({}) })).resolves.toBeTruthy();

    openSession(boss, "ADMIN");
    expect(await changeUserRoleAction({ id: helper.id, role: "USER" })).toEqual({ ok: true });

    openSession(helper, "ADMIN");
    expect((await refusalFrom(() => requireAdmin())).kind).toBe("forbidden");
    expect((await refusalFrom(() => UsersPage({ searchParams: Promise.resolve({}) }))).kind).toBe("forbidden");
    await expect(requireUser()).resolves.toMatchObject({ role: "USER" });
  });

  it("a deleted account is a Guest on its next request: redirected, no user, nothing readable", async () => {
    openSession(boss, "ADMIN");
    expect(await deleteUserAction({ id: helper.id, stay: true })).toEqual({ ok: true });

    openSession(helper, "USER");
    expect(await currentUser()).toBeNull();
    expect((await refusalFrom(() => requireUser())).kind).toBe("redirect");
    expect((await refusalFrom(() => requireAdmin())).kind).toBe("redirect");
  });

  it("a deleted administrator loses the administration area on its next request", async () => {
    await db.user.update({ where: { id: helper.id }, data: { role: "ADMIN" } });
    openSession(boss, "ADMIN");
    expect(await deleteUserAction({ id: helper.id, stay: true })).toEqual({ ok: true });

    openSession(helper, "ADMIN");
    expect((await refusalFrom(() => UsersPage({ searchParams: Promise.resolve({}) }))).kind).toBe("redirect");
  });

  it("role, nickname and address are the account's, never the token's", async () => {
    openSession(helper, "ADMIN");
    expect(await currentUser()).toEqual({
      id: helper.id,
      email: helper.email,
      nickname: "helper",
      role: "USER",
    });
  });

  it("a token whose id is not a positive integer is a Guest, with no lookup", async () => {
    for (const id of ["undefined", "0", "-3", "1.5", "abc", ""]) {
      authMock.mockResolvedValue({ user: { id, role: "ADMIN" }, expires: "2099-01-01T00:00:00.000Z" } as Session);
      expect(await currentUser()).toBeNull();
    }
  });
});

describe("ST-18 / DEC-47 — the last administrator rule still holds under a live-role session", () => {
  it("the sole administrator can neither demote nor delete themselves, and stays the administrator", async () => {
    openSession(boss, "ADMIN");
    expect(await changeUserRoleAction({ id: boss.id, role: "USER" })).toMatchObject({ ok: false, reason: "self" });
    expect(await deleteUserAction({ id: boss.id, stay: true })).toMatchObject({ ok: false, reason: "self" });
    expect((await db.user.findUniqueOrThrow({ where: { id: boss.id } })).role).toBe("ADMIN");
  });

  it("with two administrators, the one demoted first cannot then remove the other: exactly one remains", async () => {
    await db.user.update({ where: { id: helper.id }, data: { role: "ADMIN" } });
    openSession(boss, "ADMIN");
    expect(await changeUserRoleAction({ id: helper.id, role: "USER" })).toEqual({ ok: true });

    openSession(helper, "ADMIN");
    expect((await refusalFrom(() => changeUserRoleAction({ id: boss.id, role: "USER" }))).kind).toBe("forbidden");
    expect((await refusalFrom(() => deleteUserAction({ id: boss.id, stay: true }))).kind).toBe("forbidden");
    expect(await db.user.count({ where: { role: "ADMIN" } })).toBe(1);
  });
});
