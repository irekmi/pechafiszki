import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createProgress, createSession, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * SCR-19 / API-31 and API-34 from the table (CLAUDE.md §9.2, §8, DEC-47). The page and the delete action are
 * exercised as Guest, User and Administrator, asserting the refusal and that nothing was deleted (AC-18.11),
 * a person's own row and the last administrator (AC-18.1–18.3), the shared deletion's effect on every related
 * table (AC-18.5, 18.6), and the search, the role filter, the sorts and the paging (AC-18.9, 18.10).
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
const { default: UsersPage } = await import("@/app/(admin)/administracja/uzytkownicy/page");
const { deleteUserAction } = await import("@/server/actions/deleteUser");
const { deleteAccount } = await import("@/server/services/deleteAccount");
const { listPendingFlashcards } = await import("@/server/services/listPendingFlashcards");
const authMock = asSessionMock(auth);

type Person = { id: number; role: "USER" | "ADMIN"; nickname: string };
type Row = { id: number; nickname: string; email: string; role: string; submissionCount: number; isSelf: boolean; canDelete: boolean; blockReason: string | null };
type Page = { rows: Row[]; shown: number; total: number; users: number; admins: number };

function signInAs(user: Person): void {
  authMock.mockResolvedValue({
    user: { id: String(user.id), email: `${user.nickname}@example.test`, nickname: user.nickname, role: user.role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session);
}

let php: number;
let admin: Person;
let learner: Person;
const open = (search: Record<string, string> = {}) => UsersPage({ searchParams: Promise.resolve(search) });
const load = async (search: Record<string, string> = {}) => ((await open(search)) as unknown as { props: { page: Page } }).props.page;
const nicknames = async (search: Record<string, string>) => (await load(search)).rows.map((row) => row.nickname);

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  php = (await createCategory("PHP", 1)).id;
  admin = await createUser({ role: "ADMIN", nickname: "admin_root", email: "root@example.test" });
  learner = await createUser({ nickname: "learner_one", email: "learner@example.test" });
});

describe("SCR-19 — an administration address (NFR-01, DEC-57, AC-18.11)", () => {
  it("a Guest is redirected, a User gets the 403, an Administrator gets the table", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => open())).kind).toBe("redirect");
    signInAs(learner);
    expect((await refusalFrom(() => open())).kind).toBe("forbidden");
    signInAs(admin);
    expect(await load()).toMatchObject({ total: 2, users: 2, admins: 1 });
  });

  it("a forged role or id in the address does not open it for a User", async () => {
    signInAs(learner);
    expect((await refusalFrom(() => open({ role: "admin", admin: "1", id: String(admin.id) }))).kind).toBe("forbidden");
  });

  it("the rows carry no password hash and nothing beyond the listed columns", async () => {
    await db.user.update({ where: { id: learner.id }, data: { passwordHash: "argon2id$secret-hash-value" } });
    signInAs(admin);
    const page = await load();
    expect(JSON.stringify(page)).not.toMatch(/secret-hash-value|passwordHash/);
    expect(Object.keys(page.rows[0] ?? {}).sort()).toEqual(
      ["blockReason", "canDelete", "createdAt", "email", "id", "isSelf", "nickname", "role", "submissionCount"].sort(),
    );
  });
});

describe("SCR-19 — own row and the last administrator (AC-18.1, DEC-47)", () => {
  it("the caller's row carries isSelf and an inactive delete with the tooltip; other rows are deletable", async () => {
    signInAs(admin);
    const rows = (await load()).rows;
    expect(rows.find((row) => row.id === admin.id)).toMatchObject({
      isSelf: true,
      canDelete: false,
      blockReason: "Użyj swojego profilu, aby usunąć własne konto",
    });
    expect(rows.find((row) => row.id === learner.id)).toMatchObject({ isSelf: false, canDelete: true, blockReason: null });
  });

  it("with two administrators the other one can be deleted; with one, that row reads 'To jedyny administrator'", async () => {
    const second = await createUser({ role: "ADMIN", nickname: "admin_two" });
    signInAs(admin);
    expect((await load()).rows.find((row) => row.id === second.id)).toMatchObject({ canDelete: true, blockReason: null });
    const { listUsers } = await import("@/server/services/listUsers");
    await db.user.update({ where: { id: second.id }, data: { role: "USER" } });
    const asLearner = await listUsers(learner.id, { sort: "newest", limit: 20 });
    expect(asLearner.rows.find((row) => row.id === admin.id)).toMatchObject({ canDelete: false, blockReason: "To jedyny administrator" });
  });
});

describe("API-34 from SCR-19 — the deletion is the Administrator's alone (AC-18.2, AC-18.11)", () => {
  it.each([
    ["a Guest", () => authMock.mockResolvedValue(null), "redirect"],
    ["a User", () => signInAs(learner), "forbidden"],
  ])("%s is refused, even with stay and a forged role; the account stays", async (_who, sign, kind) => {
    const victim = await createUser();
    sign();
    expect((await refusalFrom(() => deleteUserAction({ id: victim.id, stay: true, role: "ADMIN" }))).kind).toBe(kind);
    expect((await refusalFrom(() => deleteUserAction({ id: admin.id }))).kind).toBe(kind);
    expect(await db.user.count()).toBe(3);
  });

  it("an Administrator's own id is refused with the note and deletes nothing", async () => {
    signInAs(admin);
    expect(await deleteUserAction({ id: admin.id, stay: true })).toEqual({
      ok: false,
      reason: "self",
      note: "Nie możesz zmienić własnej roli ani usunąć własnego konta w tym miejscu",
    });
    expect(await db.user.count({ where: { id: admin.id } })).toBe(1);
  });

  it("a caller demoted since sign-in (the token still says ADMIN) is refused with the 403 and writes nothing", async () => {
    const victim = await createUser();
    await db.user.update({ where: { id: admin.id }, data: { role: "USER" } });
    signInAs(admin);
    expect((await refusalFrom(() => deleteUserAction({ id: victim.id }))).kind).toBe("forbidden");
    expect(await db.user.count({ where: { id: victim.id } })).toBe(1);
  });

  it("a malformed body is SCR-22's 404 and deletes nothing", async () => {
    signInAs(admin);
    for (const body of [{ id: "1" }, { id: 0 }, { id: 1.5 }, { id: learner.id, stay: "yes" }, null, "x", {}]) {
      expect((await refusalFrom(() => deleteUserAction(body))).kind).toBe("notFound");
    }
    expect(await db.user.count()).toBe(2);
  });

  it("an unknown account answers not-found; from SCR-20 (no stay) a success redirects to SCR-19", async () => {
    signInAs(admin);
    expect(await deleteUserAction({ id: 999_999, stay: true })).toMatchObject({ ok: false, reason: "not-found" });
    const refusal = await refusalFrom(() => deleteUserAction({ id: learner.id }));
    expect(refusal).toMatchObject({ kind: "redirect", target: "/administracja/uzytkownicy" });
    expect(await db.user.count({ where: { id: learner.id } })).toBe(0);
    expect(await deleteUserAction({ id: learner.id, stay: true })).toMatchObject({ ok: false, reason: "not-found" });
  });
});

describe("The one deletion service — what goes and what stays (AC-18.5, AC-18.6, DEC-39, DEC-40, DEC-41)", () => {
  it("removes progress, events, sessions and reset tokens; pending and rejected cards go; approved stay authorless", async () => {
    const victim = await createUser({ nickname: "victim" });
    const other = await createUser();
    const [approved, pending, rejected] = [
      await createFlashcard(php, victim.id, "APPROVED"),
      await createFlashcard(php, victim.id, "PENDING"),
      await createFlashcard(php, victim.id, "REJECTED"),
    ];
    const foreign = await createFlashcard(php, other.id, "PENDING");
    await createProgress(victim.id, approved.id);
    await createProgress(other.id, approved.id);
    const session = await createSession(victim.id, [approved.id]);
    await db.reviewEvent.create({ data: { userId: victim.id, flashcardId: approved.id, sessionId: session.id, mark: "KNOW" } });
    await db.passwordResetToken.create({ data: { userId: victim.id, tokenHash: "hash-1", expiresAt: new Date() } });
    await db.moderationDecision.create({ data: { flashcardId: rejected.id, decision: "REJECTED", reason: "Nie", decidedById: admin.id } });
    signInAs(admin);
    expect((await listPendingFlashcards({ tab: "pending", sort: "oldest" })).rows.map((row) => row.id)).toContain(pending.id);

    expect(await deleteUserAction({ id: victim.id, stay: true })).toEqual({ ok: true });

    expect(await db.user.count({ where: { id: victim.id } })).toBe(0);
    expect(await db.cardProgress.findMany({ select: { userId: true } })).toEqual([{ userId: other.id }]);
    expect(await db.reviewEvent.count()).toBe(0);
    expect(await db.studySession.count()).toBe(0);
    expect(await db.passwordResetToken.count()).toBe(0);
    expect(await db.flashcard.findUnique({ where: { id: pending.id } })).toBeNull();
    expect(await db.flashcard.findUnique({ where: { id: rejected.id } })).toBeNull();
    expect(await db.flashcard.findUnique({ where: { id: approved.id } })).toMatchObject({ authorId: null, status: "APPROVED" });
    expect(await db.flashcard.count({ where: { id: foreign.id } })).toBe(1);
    expect((await listPendingFlashcards({ tab: "pending", sort: "oldest" })).rows.map((row) => row.id)).toEqual([foreign.id]);
  });

  it("refuses the last administrator (the path ST-22 takes for the caller's own id) and changes nothing", async () => {
    expect(await deleteAccount(admin.id)).toEqual({ ok: false, reason: "last-admin" });
    expect(await db.user.count({ where: { id: admin.id } })).toBe(1);
    expect(await deleteAccount(999_999)).toEqual({ ok: false, reason: "not-found" });
    const second = await createUser({ role: "ADMIN" });
    expect(await deleteAccount(second.id)).toEqual({ ok: true });
  });
});

describe("API-31 — search, role filter, sorts (AC-18.9)", () => {
  beforeEach(async () => {
    await createUser({ nickname: "anna_w", email: "Anna.Wojcik@Example.com" });
    await createUser({ nickname: "zażółć", email: "gesla@other.org" });
    await createUser({ nickname: "100%_user", email: "literal@x.pl" });
    signInAs(admin);
  });

  it("finds a fragment of an e-mail domain, of a nickname, in either case and without diacritics", async () => {
    expect(await nicknames({ query: "example.com" })).toEqual(["anna_w"]);
    expect(await nicknames({ query: "EXAMPLE.TEST" })).toEqual(expect.arrayContaining(["admin_root", "learner_one"]));
    expect(await nicknames({ query: "zazolc" })).toEqual(["zażółć"]);
    expect(await nicknames({ query: "ANNA" })).toEqual(["anna_w"]);
  });

  it("treats % and _ as characters and survives quotes (ISS-12)", async () => {
    expect(await nicknames({ query: "100%" })).toEqual(["100%_user"]);
    expect(await nicknames({ query: "%" })).toEqual(["100%_user"]);
    expect(await nicknames({ query: "a_na" })).toEqual([]);
    expect(await nicknames({ query: "'; DROP TABLE \"User\"; --" })).toEqual([]);
    expect(await db.user.count()).toBe(5);
  });

  it("filters by role, keeps the whole-system counts, and orders by newest, oldest and nickname", async () => {
    expect(await load({ role: "admin" })).toMatchObject({ total: 1, users: 5, admins: 1 });
    expect((await load({ role: "user" })).total).toBe(4);
    const all = await load();
    expect(all.rows.map((row) => row.id)).toEqual([...all.rows.map((row) => row.id)].sort((a, b) => b - a));
    expect((await load({ sort: "oldest" })).rows[0]?.nickname).toBe("admin_root");
    expect(await nicknames({ sort: "nickname" })).toEqual(["100%_user", "admin_root", "anna_w", "learner_one", "zażółć"]);
    expect((await load({ sort: "nonsense", role: "x" })).total).toBe(5);
  });

  it("counts every submission of a person in the row", async () => {
    await createFlashcard(php, learner.id, "APPROVED");
    await createFlashcard(php, learner.id, "PENDING");
    expect((await load({ query: "learner@" })).rows[0]?.submissionCount).toBe(2);
  });
});

describe("API-31 — 20 rows at a time (AC-18.10, DEC-48, NFR-04)", () => {
  beforeEach(async () => {
    await db.user.createMany({
      data: Array.from({ length: 205 }, (_, index) => ({ email: `bulk${index}@x.pl`, nickname: `bulk_${index}`, passwordHash: "x" })),
    });
    signInAs(admin);
  });

  it("holds 20 rows, 40 for limit=40, caps at 200 and falls back to 20", async () => {
    expect(await load()).toMatchObject({ shown: 20, total: 207 });
    expect((await load({ limit: "40" })).shown).toBe(40);
    expect((await load({ limit: "5000" })).shown).toBe(200);
    for (const limit of ["25", "0", "-20", "abc", ""]) expect((await load({ limit })).shown).toBe(20);
    expect((await load({ limit: "40" })).rows.slice(0, 20).map((row) => row.id)).toEqual((await load()).rows.map((row) => row.id));
  });
});
