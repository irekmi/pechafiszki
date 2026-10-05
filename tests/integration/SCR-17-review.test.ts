import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * SCR-17 / API-07, API-19, API-20, API-21, API-26 — reviewing one submission (CLAUDE.md §9.2). The two
 * SCR-17 actions and the page are exercised as Guest, User and Administrator and asserted on the
 * refusal; the category change is stored with the status and the Moderation Decision in one write
 * (AC-15.3); the author's record counts only that author (AC-15.7, DEC-36); the similar-question
 * hint is bounded and advisory (AC-15.8, DEC-35); a decided card is refused and left untouched
 * (AC-15.9, DEC-33); the next address follows the queue (AC-15.5).
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/administracja/ocena/1" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { approveAndAdvanceAction, rejectAndAdvanceAction } = await import("@/server/actions/reviewSubmission");
const { default: ReviewPage } = await import("@/app/(admin)/administracja/ocena/[id]/page");
const { getAuthorRecord } = await import("@/server/services/getAuthorRecord");
const { findSimilarQuestions } = await import("@/server/services/findSimilarQuestions");
const { listFlashcards } = await import("@/server/services/listFlashcards");
const { parseLibraryParams } = await import("@/server/services/libraryParams");
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
let php: number;
let symfony: number;
const cardOf = (id: number) => db.flashcard.findUniqueOrThrow({ where: { id } });
const decisions = () => db.moderationDecision.findMany({ orderBy: { id: "asc" } });
const pending = (categoryId = php, authorId: number | null = author.id) => createFlashcard(categoryId, authorId, "PENDING");
const page = (id: number | string) => ReviewPage({ params: Promise.resolve({ id: String(id) }) });

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  php = (await createCategory("PHP", 1)).id;
  symfony = (await createCategory("Symfony", 2)).id;
  author = await createUser();
  admin = await createUser({ role: "ADMIN" });
});

describe("SCR-17 — access (NFR-01, AC-15.10, DEC-57)", () => {
  it.each([
    ["approve", (id: number) => approveAndAdvanceAction({ id, category: 2 })],
    ["reject", (id: number) => rejectAndAdvanceAction({ id, rejection_reason: "Nie." })],
  ])("%s: a Guest is redirected and a User is forbidden, forged role or not; nothing changes", async (_name, call) => {
    const card = await pending();
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => call(card.id))).kind).toBe("redirect");
    signInAs(author);
    expect((await refusalFrom(() => call(card.id))).kind).toBe("forbidden");
    expect(await cardOf(card.id)).toMatchObject({ status: "PENDING", categoryId: php, decidedAt: null });
    expect(await decisions()).toHaveLength(0);
  });

  it("the page: a Guest is redirected, a User gets the 403 even for their own card, an Administrator is let in", async () => {
    const card = await pending();
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => page(card.id))).kind).toBe("redirect");
    signInAs(author);
    expect((await refusalFrom(() => page(card.id))).kind).toBe("forbidden");
    signInAs(admin);
    await expect(page(card.id)).resolves.toBeTruthy();
  });

  it("a missing and a malformed id are both SCR-22's 404 for an Administrator", async () => {
    signInAs(admin);
    for (const id of [9999, "abc", "0", "-1", "1.5"]) {
      expect((await refusalFrom(() => page(id))).kind).toBe("notFound");
    }
    for (const id of [1.5, "1", null, { $gt: 0 }]) {
      expect((await refusalFrom(() => approveAndAdvanceAction({ id }))).kind).toBe("notFound");
    }
  });
});

describe("SCR-17 — approving with a category (AC-15.2, AC-15.3, REQ-01)", () => {
  it("stores the corrected category with the status and the decision, and the card is in the library under it", async () => {
    const card = await pending(php);
    const reader = await createUser();
    signInAs(admin);
    const result = await approveAndAdvanceAction({ id: card.id, category: symfony });
    expect(result).toMatchObject({ ok: true });
    expect(await cardOf(card.id)).toMatchObject({ status: "APPROVED", categoryId: symfony });
    const [decision, ...rest] = await decisions();
    expect(rest).toHaveLength(0);
    expect(decision).toMatchObject({ flashcardId: card.id, decision: "APPROVED", decidedById: admin.id, reason: null });
    const inSymfony = await listFlashcards(reader.id, parseLibraryParams({ category: String(symfony) }));
    expect(inSymfony.rows.map((row) => row.id)).toContain(card.id);
    const inPhp = await listFlashcards(reader.id, parseLibraryParams({ category: String(php) }));
    expect(inPhp.rows.map((row) => row.id)).not.toContain(card.id);
  });

  it("without a category the submitted one is kept", async () => {
    const card = await pending(php);
    signInAs(admin);
    await approveAndAdvanceAction({ id: card.id });
    expect(await cardOf(card.id)).toMatchObject({ status: "APPROVED", categoryId: php });
  });

  it("a category that does not exist is refused and nothing is written", async () => {
    const card = await pending(php);
    signInAs(admin);
    const result = await approveAndAdvanceAction({ id: card.id, category: 999999 });
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(await cardOf(card.id)).toMatchObject({ status: "PENDING", categoryId: php, decidedAt: null });
    expect(await decisions()).toHaveLength(0);
  });

  it("a decided card is refused, and the category of the earlier decision stays (DEC-33, AC-15.9)", async () => {
    const card = await pending(php);
    signInAs(admin);
    await approveAndAdvanceAction({ id: card.id, category: php });
    const again = await approveAndAdvanceAction({ id: card.id, category: symfony });
    expect(again).toEqual({ ok: false, reason: "already-decided" });
    const rejectedToo = await rejectAndAdvanceAction({ id: card.id, rejection_reason: "Za późno." });
    expect(rejectedToo).toEqual({ ok: false, reason: "already-decided" });
    expect(await cardOf(card.id)).toMatchObject({ status: "APPROVED", categoryId: php });
    expect(await decisions()).toHaveLength(1);
  });
});

describe("SCR-17 — rejecting (DEC-32, AC-15.4)", () => {
  it("writes the reason and moves on; an empty reason is refused with nothing written", async () => {
    const card = await pending();
    signInAs(admin);
    for (const rejection_reason of ["", "   ", "\r\n"]) {
      expect(await rejectAndAdvanceAction({ id: card.id, rejection_reason })).toMatchObject({ ok: false, reason: "invalid" });
    }
    expect(await rejectAndAdvanceAction({ id: card.id, rejection_reason: "x".repeat(501) })).toMatchObject({ reason: "invalid" });
    expect(await cardOf(card.id)).toMatchObject({ status: "PENDING", decidedAt: null });
    expect(await decisions()).toHaveLength(0);

    expect(await rejectAndAdvanceAction({ id: card.id, rejection_reason: " Zbyt ogólne. " })).toMatchObject({ ok: true });
    expect(await cardOf(card.id)).toMatchObject({ status: "REJECTED" });
    expect((await decisions())[0]).toMatchObject({ decision: "REJECTED", reason: "Zbyt ogólne.", decidedById: admin.id });
  });
});

describe("SCR-17 — where a decision leads (AC-15.5)", () => {
  it("the next pending submission in queue order, wrapping to the first, then SCR-16", async () => {
    const [one, two, three] = [await pending(), await pending(), await pending()];
    signInAs(admin);
    expect(await approveAndAdvanceAction({ id: two.id })).toEqual({ ok: true, next: `/administracja/ocena/${three.id}` });
    expect(await rejectAndAdvanceAction({ id: three.id, rejection_reason: "Nie." })).toEqual({
      ok: true,
      next: `/administracja/ocena/${one.id}`,
    });
    expect(await approveAndAdvanceAction({ id: one.id })).toEqual({ ok: true, next: "/administracja/oczekujace" });
  });

  it("the page reads its position and neighbours from the queue, and a decided card has none", async () => {
    const [one, two] = [await pending(), await pending()];
    signInAs(admin);
    type Props = { position: { position: number; total: number; previousId: number; nextId: number } | null };
    const screen = (await page(two.id)) as { props: Props };
    expect(screen.props.position).toEqual({ position: 2, total: 2, previousId: one.id, nextId: one.id });
    await db.flashcard.update({ where: { id: two.id }, data: { status: "APPROVED" } });
    expect(((await page(two.id)) as { props: Props }).props.position).toBeNull();
    expect(((await page(one.id)) as { props: Props }).props.position).toMatchObject({ position: 1, total: 1, previousId: null });
  });
});

describe("SCR-17 — the author's record counts only that author (AC-15.7, DEC-36)", () => {
  it("compares against each author's own approved and rejected cards", async () => {
    const other = await createUser();
    const current = await pending();
    for (const [status, owner, times] of [
      ["APPROVED", author, 3],
      ["REJECTED", author, 1],
      ["APPROVED", other, 5],
      ["REJECTED", other, 2],
      ["PENDING", author, 4],
    ] as const) {
      for (let i = 0; i < times; i += 1) await createFlashcard(php, owner.id, status);
    }
    expect(await getAuthorRecord(current.id)).toEqual({ authorId: author.id, nickname: author.nickname, approved: 3, rejected: 1 });
    const theirs = await createFlashcard(php, other.id, "PENDING");
    expect(await getAuthorRecord(theirs.id)).toMatchObject({ authorId: other.id, approved: 5, rejected: 2 });
  });

  it("is null once the author's account is gone", async () => {
    const orphan = await pending(php, null);
    expect(await getAuthorRecord(orphan.id)).toBeNull();
  });
});

describe("SCR-17 — Podobne pytania w puli (AC-15.8, DEC-35)", () => {
  const approved = (categoryId: number, question: string, status: "APPROVED" | "PENDING" = "APPROVED") =>
    db.flashcard.create({ data: { categoryId, authorId: null, question, answer: "Odpowiedź.", status } });
  const subject = async (question: string, categoryId = php) => ({ id: (await pending(categoryId)).id, categoryId, question });

  it("lists the closest approved questions of the same category, best first, at most three", async () => {
    await approved(php, "Czym różni się interface od type alias?");
    await approved(php, "Czym się różni interface od type alias w TypeScript?");
    await approved(php, "Czym różni się interface od aliasu typu?");
    await approved(php, "Czym różni się interface od type alias i klasy?");
    await approved(php, "Jak działa garbage collector w PHP?");
    const found = await findSimilarQuestions(await subject("Czym różni się interface od type alias?"));
    expect(found).toHaveLength(3);
    expect(found[0]?.question).toBe("Czym różni się interface od type alias?");
    expect(found.map((item) => item.question)).not.toContain("Jak działa garbage collector w PHP?");
  });

  it("ignores other categories, unapproved cards and unrelated questions; diacritics do not matter", async () => {
    await approved(symfony, "Czym różni się interface od type alias?");
    await approved(php, "Czym różni się interface od type alias?", "PENDING");
    await approved(php, "Jak działa garbage collector w PHP?");
    expect(await findSimilarQuestions(await subject("Czym różni się interface od type alias?"))).toEqual([]);
    await approved(php, "Domknięcie w PHP — czym jest?");
    expect((await findSimilarQuestions(await subject("Domkniecie w PHP - czym jest"))).map((i) => i.question)).toEqual([
      "Domknięcie w PHP — czym jest?",
    ]);
  });

  it("is only a hint: the card is decided whatever the list holds", async () => {
    await approved(php, "Czym różni się interface od type alias?");
    const card = await db.flashcard.create({
      data: { categoryId: php, authorId: author.id, question: "Czym różni się interface od type alias?", answer: "A.", status: "PENDING" },
    });
    signInAs(admin);
    expect(await approveAndAdvanceAction({ id: card.id })).toMatchObject({ ok: true });
    expect((await cardOf(card.id)).status).toBe("APPROVED");
  });

  it("treats the question as a value, never as SQL", async () => {
    const found = await findSimilarQuestions(await subject(`'; DROP TABLE "Flashcard"; -- %_`));
    expect(found).toEqual([]);
    expect(await db.flashcard.count()).toBeGreaterThan(0);
  });
});
