import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createProgress, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * SCR-20 / API-32 and API-33 from the table (CLAUDE.md §9.2, §8, DEC-47). The page and the role action are
 * exercised as Guest, User and Administrator, asserting the refusal and that nothing changed (AC-18.11); both
 * blocks by a direct call, including two administrators acting on each other at once (AC-18.2, 18.3); and the
 * aggregate-only, hash-free response (AC-18.7, AC-18.8, AC-18.10).
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/administracja/uzytkownicy/1" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { default: UserPage } = await import("@/app/(admin)/administracja/uzytkownicy/[id]/page");
const { changeUserRoleAction } = await import("@/server/actions/changeUserRole");
const { deleteUserAction } = await import("@/server/actions/deleteUser");
const { changeUserRole } = await import("@/server/services/changeUserRole");
const { deleteUser } = await import("@/server/services/deleteUser");
const authMock = asSessionMock(auth);

type Person = { id: number; role: "USER" | "ADMIN"; nickname: string };
type Details = {
  user: Record<string, unknown>;
  lastSessionAt: Date | null;
  submissions: Record<string, number>;
  progress: Record<string, number>;
  rows: { id: number; question: string; status: string }[];
  shown: number;
  total: number;
  isSelf: boolean;
  canDelete: boolean;
  canChangeRole: boolean;
  blockReason: string | null;
};

function signInAs(user: Person): void {
  authMock.mockResolvedValue({
    user: { id: String(user.id), email: `${user.nickname}@example.test`, nickname: user.nickname, role: user.role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session);
}

let php: number;
let admin: Person;
let learner: Person;
const open = (id: number | string) => UserPage({ params: Promise.resolve({ id: String(id) }) });
const load = async (id: number) => ((await open(id)) as unknown as { props: { details: Details } }).props.details;
const roleOf = async (id: number) => (await db.user.findUnique({ where: { id } }))?.role;

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  php = (await createCategory("PHP", 1)).id;
  admin = await createUser({ role: "ADMIN", nickname: "admin_root", email: "root@example.test" });
  learner = await createUser({ nickname: "learner_one", email: "learner@example.test" });
});

describe("SCR-20 — an administration address (NFR-01, DEC-57, AC-18.11)", () => {
  it("a Guest is redirected, a User gets the 403 for an existing and a missing account alike", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => open(learner.id))).kind).toBe("redirect");
    signInAs(learner);
    expect((await refusalFrom(() => open(admin.id))).kind).toBe("forbidden");
    expect((await refusalFrom(() => open(999_999))).kind).toBe("forbidden");
    signInAs(admin);
    expect((await load(learner.id)).user).toMatchObject({ nickname: "learner_one", email: "learner@example.test" });
  });

  it("a missing or malformed id is SCR-22's 404", async () => {
    signInAs(admin);
    for (const id of [999_999, "abc", "0", "-1", "1.5", "99999999999"]) {
      expect((await refusalFrom(() => open(id))).kind).toBe("notFound");
    }
  });
});

describe("SCR-20 — aggregates only, no hash (AC-18.7, AC-18.8, REQ-02, ENT-05)", () => {
  it("answers the account, three progress totals, the status counts and the latest session start — nothing per card", async () => {
    const cards = [await createFlashcard(php, admin.id), await createFlashcard(php, admin.id), await createFlashcard(php, admin.id)];
    await createProgress(learner.id, cards[0]!.id, { mark: "KNOW", knowCount: 3 });
    await createProgress(learner.id, cards[1]!.id, { mark: "REPEAT" });
    await createProgress(admin.id, cards[2]!.id, { mark: "UNKNOWN" });
    await db.user.update({ where: { id: learner.id }, data: { passwordHash: "argon2id$secret-hash-value" } });
    await db.studySession.create({ data: { userId: learner.id, queue: [], startedAt: new Date("2026-03-01T10:00:00Z") } });
    await db.studySession.create({ data: { userId: learner.id, queue: [], startedAt: new Date("2026-05-02T10:00:00Z") } });
    await db.studySession.create({ data: { userId: admin.id, queue: [], startedAt: new Date("2026-09-09T10:00:00Z") } });
    signInAs(admin);
    const details = await load(learner.id);
    expect(details.progress).toEqual({ know: 1, repeat: 1, unknown: 0 });
    expect(details.lastSessionAt).toEqual(new Date("2026-05-02T10:00:00Z"));
    expect(Object.keys(details.user).sort()).toEqual(["createdAt", "email", "id", "nickname", "role"]);
    expect(JSON.stringify(details)).not.toMatch(/secret-hash-value|passwordHash|knowCount|hiddenUntil|flashcardId/);
  });

  it("a person who never studied reads 'Brak' (null) and zeros; one who submitted nothing has no rows", async () => {
    signInAs(admin);
    expect(await load(learner.id)).toMatchObject({
      lastSessionAt: null,
      progress: { know: 0, repeat: 0, unknown: 0 },
      submissions: { pending: 0, approved: 0, rejected: 0 },
      rows: [],
      total: 0,
    });
  });

  it("shows the ten latest submissions of fifteen, with the count of each status and the whole total (AC-18.10)", async () => {
    for (let index = 0; index < 15; index += 1) {
      await db.flashcard.create({
        data: {
          categoryId: php,
          authorId: learner.id,
          question: `Zgłoszenie ${index}?`,
          answer: "x",
          status: index < 2 ? "PENDING" : index < 4 ? "REJECTED" : "APPROVED",
          submittedAt: new Date(2026, 0, 1, 0, 0, index),
        },
      });
    }
    signInAs(admin);
    const details = await load(learner.id);
    expect(details).toMatchObject({ shown: 10, total: 15, submissions: { pending: 2, rejected: 2, approved: 11 } });
    expect(details.rows[0]?.question).toBe("Zgłoszenie 14?");
    expect(details.rows.at(-1)?.question).toBe("Zgłoszenie 5?");
  });
});

describe("SCR-20 — the two blocks in the read (AC-18.1–18.3)", () => {
  it("own account: both actions inactive with the self note; another account: both active", async () => {
    signInAs(admin);
    expect(await load(admin.id)).toMatchObject({
      isSelf: true,
      canDelete: false,
      canChangeRole: false,
      blockReason: "Nie możesz zmienić własnej roli ani usunąć własnego konta w tym miejscu",
    });
    expect(await load(learner.id)).toMatchObject({ isSelf: false, canDelete: true, canChangeRole: true, blockReason: null });
  });
});

describe("API-33 — changing a role is the Administrator's alone (AC-18.11, AC-18.4)", () => {
  it.each([
    ["a Guest", () => authMock.mockResolvedValue(null), "redirect"],
    ["a User", () => signInAs(learner), "forbidden"],
  ])("%s is refused, even with a forged role field; nothing changes", async (_who, sign, kind) => {
    sign();
    expect((await refusalFrom(() => changeUserRoleAction({ id: learner.id, role: "ADMIN" }))).kind).toBe(kind);
    expect((await refusalFrom(() => changeUserRoleAction({ id: admin.id, role: "USER", caller: "ADMIN" }))).kind).toBe(kind);
    expect(await roleOf(learner.id)).toBe("USER");
    expect(await roleOf(admin.id)).toBe("ADMIN");
  });

  it("promotes and demotes, is idempotent, and writes only the role", async () => {
    signInAs(admin);
    expect(await changeUserRoleAction({ id: learner.id, role: "ADMIN", email: "x@y.z", passwordHash: "p", nickname: "hacked" })).toEqual({ ok: true });
    expect(await db.user.findUnique({ where: { id: learner.id } })).toMatchObject({ role: "ADMIN", email: "learner@example.test", nickname: "learner_one", passwordHash: "not-a-real-hash" });
    expect(await changeUserRoleAction({ id: learner.id, role: "ADMIN" })).toEqual({ ok: true });
    expect(await changeUserRoleAction({ id: learner.id, role: "USER" })).toEqual({ ok: true });
    expect(await roleOf(learner.id)).toBe("USER");
  });

  it("appoints a successor, then the original administrator can be demoted by them (scenario 1)", async () => {
    signInAs(admin);
    expect(await changeUserRoleAction({ id: learner.id, role: "ADMIN" })).toEqual({ ok: true });
    signInAs({ ...learner, role: "ADMIN" });
    expect(await changeUserRoleAction({ id: admin.id, role: "USER" })).toEqual({ ok: true });
    expect(await db.user.count({ where: { role: "ADMIN" } })).toBe(1);
  });

  it("an Administrator changing their own role is refused with the note, promoting or demoting (AC-18.2, scenario 3)", async () => {
    signInAs(admin);
    for (const role of ["USER", "ADMIN"] as const) {
      expect(await changeUserRoleAction({ id: admin.id, role })).toMatchObject({
        ok: false,
        reason: "self",
        note: "Nie możesz zmienić własnej roli ani usunąć własnego konta w tym miejscu",
      });
    }
    expect(await roleOf(admin.id)).toBe("ADMIN");
  });

  it("an unknown account answers not-found; a malformed body is SCR-22's 404", async () => {
    signInAs(admin);
    expect(await changeUserRoleAction({ id: 999_999, role: "ADMIN" })).toMatchObject({ ok: false, reason: "not-found" });
    for (const body of [{ id: learner.id }, { id: learner.id, role: "SUPER" }, { id: "1", role: "USER" }, { role: "ADMIN" }, null, "x"]) {
      expect((await refusalFrom(() => changeUserRoleAction(body))).kind).toBe("notFound");
    }
    expect(await roleOf(learner.id)).toBe("USER");
  });
});

describe("DEC-47 — the last administrator, decided in the service (AC-18.3, scenario 2)", () => {
  it("the only administrator can neither demote nor delete themselves, by a direct call", async () => {
    expect(await changeUserRole(admin.id, admin.id, "USER")).toEqual({ ok: false, reason: "self" });
    expect(await deleteUser(admin.id, admin.id)).toEqual({ ok: false, reason: "self" });
    expect(await roleOf(admin.id)).toBe("ADMIN");
  });

  it("a caller who is no longer an administrator in the database cannot touch the last one", async () => {
    await db.user.update({ where: { id: learner.id }, data: { role: "USER" } });
    expect(await changeUserRole(learner.id, admin.id, "USER")).toEqual({ ok: false, reason: "forbidden" });
    expect(await deleteUser(learner.id, admin.id)).toEqual({ ok: false, reason: "forbidden" });
    expect(await deleteUser(999_999, admin.id)).toEqual({ ok: false, reason: "forbidden" });
    expect(await db.user.count({ where: { role: "ADMIN" } })).toBe(1);
  });

  it.each([
    ["two demotions", (a: number, b: number) => [changeUserRole(a, b, "USER"), changeUserRole(b, a, "USER")]],
    ["two deletions", (a: number, b: number) => [deleteUser(a, b), deleteUser(b, a)]],
    ["a demotion and a deletion", (a: number, b: number) => [changeUserRole(a, b, "USER"), deleteUser(b, a)]],
  ])("%s at the same moment leave exactly one administrator", async (_name, fire) => {
    for (let round = 0; round < 5; round += 1) {
      await resetDatabase();
      const [first, second] = [await createUser({ role: "ADMIN" }), await createUser({ role: "ADMIN" })];
      const results = await Promise.all(fire(first.id, second.id));
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(results.filter((result) => !result.ok)).toEqual([{ ok: false, reason: "forbidden" }]);
      expect(await db.user.count({ where: { role: "ADMIN" } })).toBe(1);
    }
  });

  it("through the actions: the demoted one's open session is refused with SCR-22's 403 and deletes nothing", async () => {
    signInAs(admin);
    const other = await createUser({ role: "ADMIN", nickname: "admin_two" });
    expect(await changeUserRoleAction({ id: other.id, role: "USER" })).toEqual({ ok: true });
    signInAs({ id: other.id, role: "ADMIN", nickname: "admin_two" });
    expect((await refusalFrom(() => deleteUserAction({ id: admin.id, stay: true }))).kind).toBe("forbidden");
    expect((await refusalFrom(() => changeUserRoleAction({ id: admin.id, role: "USER" }))).kind).toBe("forbidden");
    expect(await roleOf(admin.id)).toBe("ADMIN");
  });
});

describe("SCR-20 → SCR-18 — the list filtered by author (DEC-48)", () => {
  it("shows only that account's cards, in every status; an unknown author matches nothing", async () => {
    const mine = [await createFlashcard(php, learner.id, "APPROVED"), await createFlashcard(php, learner.id, "PENDING")];
    await createFlashcard(php, admin.id, "APPROVED");
    const { adminListFlashcards } = await import("@/server/services/adminListFlashcards");
    const { adminCardsHref, parseAdminCardsParams } = await import("@/server/services/adminCardsParams");
    const page = await adminListFlashcards(parseAdminCardsParams({ author: String(learner.id) }));
    expect(page.rows.map((row) => row.id).sort()).toEqual(mine.map((card) => card.id).sort());
    expect((await adminListFlashcards(parseAdminCardsParams({ author: "999999" }))).total).toBe(0);
    expect(adminCardsHref({ author: learner.id })).toBe(`/administracja/fiszki?author=${learner.id}`);
    expect(parseAdminCardsParams({ author: "abc" }).author).toBeUndefined();
  });
});

describe("SCR-17 → SCR-20 — the author's nickname (task 9)", () => {
  it("SCR-17's author link points at the account's SCR-20 address", async () => {
    const card = await createFlashcard(php, learner.id, "PENDING");
    const { getAuthorRecord } = await import("@/server/services/getAuthorRecord");
    expect((await getAuthorRecord(card.id))?.authorId).toBe(learner.id);
    const { userHref } = await import("@/server/services/usersParams");
    expect(userHref(learner.id)).toBe(`/administracja/uzytkownicy/${learner.id}`);
  });
});
