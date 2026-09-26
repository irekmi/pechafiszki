import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * REQ-01 / API-19, API-20, API-21 — the approval gate (CLAUDE.md §9.2). Each action is exercised as
 * Guest, User and Administrator and asserted on the refusal, not only the success; Pending → Approved
 * and Pending → Rejected each write their Moderation Decision (DEC-32); a second decision is refused
 * and overwrites nothing (DEC-33); the queue page is an administration address (DEC-57, NFR-01).
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/administracja/oczekujace" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { approveFlashcardAction } = await import("@/server/actions/approveFlashcard");
const { rejectFlashcardAction } = await import("@/server/actions/rejectFlashcard");
const { default: QueuePage } = await import("@/app/(admin)/administracja/oczekujace/page");
const { listFlashcards } = await import("@/server/services/listFlashcards");
const { parseLibraryParams } = await import("@/server/services/libraryParams");
const { buildSessionQueue } = await import("@/server/services/buildSessionQueue");
const { listMyFlashcards } = await import("@/server/services/listMyFlashcards");
const authMock = asSessionMock(auth);

type Person = { id: number; role: "USER" | "ADMIN"; nickname: string };

function signInAs(user: Person): void {
  authMock.mockResolvedValue({
    user: { id: String(user.id), email: `${user.nickname}@example.test`, nickname: user.nickname, role: user.role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session);
}

let author: Person;
let admin: Person;
let categoryId: number;
const decisions = () => db.moderationDecision.findMany({ orderBy: { id: "asc" } });
const cardOf = (id: number) => db.flashcard.findUniqueOrThrow({ where: { id } });
const pending = () => createFlashcard(categoryId, author.id, "PENDING");

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  categoryId = (await createCategory("PHP", 1)).id;
  author = await createUser();
  admin = await createUser({ role: "ADMIN" });
});

describe("REQ-01 — the actions refuse everybody but an Administrator (NFR-01, AC-14.7)", () => {
  it.each([
    ["approve", (id: number) => approveFlashcardAction({ id })],
    ["reject", (id: number) => rejectFlashcardAction({ id, rejection_reason: "Za krótkie." })],
  ])("%s: a Guest is redirected to SCR-01 and nothing changes", async (_name, call) => {
    const card = await pending();
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => call(card.id))).kind).toBe("redirect");
    expect(await cardOf(card.id)).toMatchObject({ status: "PENDING", decidedAt: null });
    expect(await decisions()).toHaveLength(0);
  });

  it.each([
    ["approve", (id: number) => approveFlashcardAction({ id, role: "ADMIN", admin: true })],
    ["reject", (id: number) => rejectFlashcardAction({ id, rejection_reason: "Za krótkie.", role: "ADMIN" })],
  ])("%s: a User gets the 403, even with a forged role in the body; nothing changes", async (_name, call) => {
    const card = await pending();
    signInAs(author);
    expect((await refusalFrom(() => call(card.id))).kind).toBe("forbidden");
    expect(await cardOf(card.id)).toMatchObject({ status: "PENDING", decidedAt: null });
    expect(await decisions()).toHaveLength(0);
  });

  it("an Administrator is allowed through both", async () => {
    const [one, two] = [await pending(), await pending()];
    signInAs(admin);
    expect(await approveFlashcardAction({ id: one.id })).toEqual({ ok: true });
    expect(await rejectFlashcardAction({ id: two.id, rejection_reason: "Nie." })).toEqual({ ok: true });
  });

  it("a malformed id is SCR-22's 404, not a write", async () => {
    signInAs(admin);
    for (const id of ["1", 0, -3, 1.5, null, { $gt: 0 }]) {
      expect((await refusalFrom(() => approveFlashcardAction({ id }))).kind).toBe("notFound");
    }
    expect((await refusalFrom(() => rejectFlashcardAction("nope"))).kind).toBe("notFound");
    expect(await decisions()).toHaveLength(0);
  });
});

describe("REQ-01 — Pending → Approved (AC-14.1, AC-14.2)", () => {
  it("sets APPROVED and decidedAt and writes a Moderation Decision naming the administrator", async () => {
    const card = await pending();
    signInAs(admin);
    await approveFlashcardAction({ id: card.id });
    const after = await cardOf(card.id);
    expect(after.status).toBe("APPROVED");
    const [decision, ...rest] = await decisions();
    expect(rest).toHaveLength(0);
    expect(decision).toMatchObject({ flashcardId: card.id, decision: "APPROVED", reason: null, decidedById: admin.id });
    expect(after.decidedAt).toEqual(decision?.decidedAt);
  });

  it("the card is in the library and in a session queue afterwards, and left the queue", async () => {
    const card = await pending();
    const reader = await createUser();
    expect((await listFlashcards(reader.id, parseLibraryParams({}))).rows.map((row) => row.id)).not.toContain(card.id);
    signInAs(admin);
    await approveFlashcardAction({ id: card.id });
    expect((await listFlashcards(reader.id, parseLibraryParams({}))).rows.map((row) => row.id)).toContain(card.id);
    const { queue } = await buildSessionQueue(reader.id, {}, new Date());
    expect(queue.map((entry) => entry.flashcardId)).toContain(card.id);
    const screen = (await QueuePage({ searchParams: Promise.resolve({}) })) as { props: { queue: { rows: unknown[] } } };
    expect(screen.props.queue.rows).toHaveLength(0);
  });
});

describe("REQ-01 — Pending → Rejected (DEC-32, AC-14.3, AC-14.4)", () => {
  it("sets REJECTED and writes the reason, verbatim inside, and the author reads it", async () => {
    const card = await pending();
    signInAs(admin);
    await rejectFlashcardAction({ id: card.id, rejection_reason: "  Odpowiedź  jest\r\nzbyt ogólna.  " });
    expect((await cardOf(card.id)).status).toBe("REJECTED");
    const [decision, ...rest] = await decisions();
    expect(rest).toHaveLength(0);
    expect(decision).toMatchObject({
      flashcardId: card.id,
      decision: "REJECTED",
      reason: "Odpowiedź  jest\nzbyt ogólna.",
      decidedById: admin.id,
    });
    const { rows } = await listMyFlashcards(author.id);
    expect(rows[0]).toMatchObject({ status: "REJECTED", rejectionReason: "Odpowiedź  jest\nzbyt ogólna." });
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["blank", "  \r\n \t "],
    ["not text", 42],
  ])("a %s reason is refused at the server; the card stays pending and nothing is written", async (_name, reason) => {
    const card = await pending();
    signInAs(admin);
    const result = await rejectFlashcardAction({ id: card.id, rejection_reason: reason });
    expect(result).toEqual({ ok: false, reason: "invalid", message: "Powód odrzucenia jest wymagany" });
    expect((await cardOf(card.id)).status).toBe("PENDING");
    expect(await decisions()).toHaveLength(0);
  });

  it("500 characters are accepted, 501 are refused", async () => {
    const [long, longer] = [await pending(), await pending()];
    signInAs(admin);
    expect(await rejectFlashcardAction({ id: long.id, rejection_reason: "a".repeat(500) })).toEqual({ ok: true });
    const refused = await rejectFlashcardAction({ id: longer.id, rejection_reason: "a".repeat(501) });
    expect(refused).toMatchObject({ ok: false, reason: "invalid" });
    expect((await cardOf(longer.id)).status).toBe("PENDING");
    expect(await decisions()).toHaveLength(1);
  });
});

describe("REQ-01 — a decision is made once (DEC-33, AC-14.5)", () => {
  it.each([
    ["approved", "APPROVED"],
    ["rejected", "REJECTED"],
  ] as const)("a card already %s answers 'already-decided' to both actions and keeps its state", async (_name, status) => {
    const card = await createFlashcard(categoryId, author.id, status);
    signInAs(admin);
    expect(await approveFlashcardAction({ id: card.id })).toEqual({ ok: false, reason: "already-decided" });
    expect(await rejectFlashcardAction({ id: card.id, rejection_reason: "Za późno." })).toEqual({
      ok: false,
      reason: "already-decided",
    });
    expect((await cardOf(card.id)).status).toBe(status);
    expect(await decisions()).toHaveLength(0);
  });

  it("two administrators deciding at once produce one decision; the second is told", async () => {
    const card = await pending();
    signInAs(admin);
    const results = await Promise.all([
      approveFlashcardAction({ id: card.id }),
      rejectFlashcardAction({ id: card.id, rejection_reason: "Nie." }),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok && result.reason === "already-decided")).toHaveLength(1);
    const [only, ...rest] = await decisions();
    expect(rest).toHaveLength(0);
    expect((await cardOf(card.id)).status).toBe(only?.decision);
  });

  it("a card that no longer exists answers the same way", async () => {
    signInAs(admin);
    expect(await approveFlashcardAction({ id: 999_999 })).toEqual({ ok: false, reason: "already-decided" });
  });
});

describe("REQ-01 — SCR-16 is an administration address (DEC-57, AC-14.7, AC-14.8)", () => {
  const open = (search: Record<string, string> = {}) => QueuePage({ searchParams: Promise.resolve(search) });

  it("a Guest is redirected, a User gets the 403, an Administrator gets the queue", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => open())).kind).toBe("redirect");
    signInAs(author);
    expect((await refusalFrom(() => open())).kind).toBe("forbidden");
    signInAs(admin);
    await expect(open()).resolves.toBeTruthy();
  });

  it("lists the tabs with counts, oldest first by default, newest on request, by category (AC-14.10)", async () => {
    const other = (await createCategory("React", 2)).id;
    const first = await pending();
    const second = await createFlashcard(other, author.id, "PENDING");
    const third = await pending();
    await createFlashcard(categoryId, author.id, "APPROVED");
    await createFlashcard(other, null, "REJECTED");
    await db.flashcard.update({ where: { id: first.id }, data: { submittedAt: new Date("2026-09-01T10:00:00Z") } });
    await db.flashcard.update({ where: { id: second.id }, data: { submittedAt: new Date("2026-09-02T10:00:00Z") } });
    await db.flashcard.update({ where: { id: third.id }, data: { submittedAt: new Date("2026-09-03T10:00:00Z") } });
    signInAs(admin);
    type Queue = { rows: { id: number; author: string | null }[]; counts: unknown; pendingTotal: number; category?: number };
    const queueOf = async (search?: Record<string, string>) =>
      ((await open(search)) as { props: { queue: Queue } }).props.queue;

    const all = await queueOf();
    expect(all.rows.map((row) => row.id)).toEqual([first.id, second.id, third.id]);
    expect(all.counts).toEqual({ pending: 3, approved: 1, rejected: 1 });
    expect(all.rows[0]?.author).toBe(author.nickname);
    expect((await queueOf({ sort: "newest" })).rows.map((row) => row.id)).toEqual([third.id, second.id, first.id]);
    const inReact = await queueOf({ category: String(other) });
    expect(inReact.rows.map((row) => row.id)).toEqual([second.id]);
    expect(inReact.counts).toEqual({ pending: 1, approved: 0, rejected: 1 });
    expect(inReact.pendingTotal).toBe(3);
    expect((await queueOf({ category: "9999" })).rows).toHaveLength(3);
    expect((await queueOf({ tab: "rejected" })).rows).toHaveLength(1);
    expect((await queueOf({ tab: "rejected" })).rows[0]?.author).toBeNull();
    expect((await queueOf({ tab: "bogus", sort: "x", category: "1; DROP" })).rows).toHaveLength(3);
  });
});
