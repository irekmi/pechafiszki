import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import {
  createCategory,
  createFlashcard,
  createProgress,
  createSession,
  createUser,
  resetDatabase,
} from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInSession } from "./setup/mockSession";

/**
 * SCR-06 / API-12 markCard — every refusal and every rule the stage's acceptance criteria name
 * (AC-08.3 … AC-08.6, AC-08.11, AC-08.13), exercised as Guest, User and Administrator through the
 * real server action and the real database (CLAUDE.md §9.2). The study rules themselves are proven
 * in `tests/unit/DEC-*`; here the point is that the action applies them and persists the result.
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
  notFound: vi.fn(() => {
    throw new Refusal("notFound");
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-pathname": "/nauka" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { markCardAction } = await import("@/server/actions/markCard");
const authMock = asSessionMock(auth);

const DAY = 24 * 60 * 60 * 1000;

/** The signed-in mock session carries id 7, so the test user must be the seventh. */
async function signedInUser(role: "USER" | "ADMIN" = "USER") {
  await db.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 7`);
  const user = await createUser({ role });
  authMock.mockResolvedValue(signedInSession(role));
  return user;
}

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
});

describe("SCR-06 API-12 — refusals (AC-08.11)", () => {
  it("a Guest is sent to SCR-01 and nothing is written", async () => {
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    authMock.mockResolvedValue(null);
    const refusal = await refusalFrom(() => markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: 1 }));
    expect(refusal.kind).toBe("redirect");
    expect(await db.reviewEvent.count()).toBe(0);
    expect(await db.cardProgress.count()).toBe(0);
  });

  it("a User marking a card that is not in their open queue ends at SCR-22 and writes nothing", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const queued = await createFlashcard(category.id, null);
    const foreign = await createFlashcard(category.id, null);
    const session = await createSession(user.id, [queued.id]);
    const refusal = await refusalFrom(() =>
      markCardAction({ flashcardId: foreign.id, mark: "KNOW", sessionId: session.id }),
    );
    expect(refusal.kind).toBe("notFound");
    expect(await db.reviewEvent.count()).toBe(0);
    expect(await db.cardProgress.count()).toBe(0);
  });

  it("a User cannot mark through someone else's session", async () => {
    await signedInUser();
    const other = await createUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    const theirs = await createSession(other.id, [card.id]);
    const refusal = await refusalFrom(() =>
      markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: theirs.id }),
    );
    expect(refusal.kind).toBe("notFound");
    expect(await db.reviewEvent.count()).toBe(0);
  });

  it("a session that has ended is not an open queue", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    const closed = await createSession(user.id, [card.id], { endedAt: new Date() });
    const refusal = await refusalFrom(() =>
      markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: closed.id }),
    );
    expect(refusal.kind).toBe("notFound");
  });

  it("malformed input ends at SCR-22, never at an error page", async () => {
    await signedInUser();
    const refusal = await refusalFrom(() => markCardAction({ flashcardId: "x", mark: "MAYBE" }));
    expect(refusal.kind).toBe("notFound");
  });
});

describe("SCR-06 API-12 — the owner, User and Administrator (AC-08.3)", () => {
  for (const role of ["USER", "ADMIN"] as const) {
    it(`a ${role} marking a queued card saves it, writes the event and advances the cursor`, async () => {
      const user = await signedInUser(role);
      const category = await createCategory("PHP", 1);
      const [a, b] = [await createFlashcard(category.id, null), await createFlashcard(category.id, null)];
      const session = await createSession(user.id, [a.id, b.id], { reinforcement: [a.id] });
      const result = await markCardAction({ flashcardId: a.id, mark: "KNOW", sessionId: session.id });
      expect(result).toEqual({ status: "ok", knowCount: 1 });

      const progress = await db.cardProgress.findUniqueOrThrow({
        where: { userId_flashcardId: { userId: user.id, flashcardId: a.id } },
      });
      expect(progress).toMatchObject({ mark: "KNOW", knowCount: 1 });
      expect(progress.firstKnownAt).not.toBeNull();
      const event = await db.reviewEvent.findFirstOrThrow({ where: { flashcardId: a.id } });
      expect(event).toMatchObject({ sessionId: session.id, wasReinforcement: true, countedTowardsKnow: true });
      expect((await db.studySession.findUniqueOrThrow({ where: { id: session.id } })).cursor).toBe(1);
    });
  }
});

describe("SCR-06 API-12 — the hide boundary (AC-08.5, DEC-05)", () => {
  it("the fourth consecutive Umiem does not hide the card", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await createProgress(user.id, card.id, { knowCount: 3 });
    const session = await createSession(user.id, [card.id]);
    await markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: session.id });
    const row = await db.cardProgress.findFirstOrThrow({ where: { flashcardId: card.id } });
    expect(row).toMatchObject({ knowCount: 4, hiddenUntil: null });
  });

  it("the fifth consecutive Umiem hides it for seven days", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await createProgress(user.id, card.id, { knowCount: 4 });
    const session = await createSession(user.id, [card.id]);
    const before = Date.now();
    await markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: session.id });
    const row = await db.cardProgress.findFirstOrThrow({ where: { flashcardId: card.id } });
    expect(row.knowCount).toBe(5);
    const hiddenFor = row.hiddenUntil!.getTime() - before;
    expect(hiddenFor).toBeGreaterThan(7 * DAY - 60_000);
    expect(hiddenFor).toBeLessThan(7 * DAY + 60_000);
  });

  it("a hide whose week has ended is over: the next Umiem starts again from one", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await createProgress(user.id, card.id, { knowCount: 5, hiddenUntil: new Date(Date.now() - 1000) });
    const session = await createSession(user.id, [card.id]);
    await markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: session.id });
    const row = await db.cardProgress.findFirstOrThrow({ where: { flashcardId: card.id } });
    expect(row).toMatchObject({ knowCount: 1, hiddenUntil: null });
  });

  it("Do powtórki at four of five returns the counter to zero and records what it reset (AC-08.6)", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await createProgress(user.id, card.id, { knowCount: 4 });
    const session = await createSession(user.id, [card.id]);
    await markCardAction({ flashcardId: card.id, mark: "REPEAT", sessionId: session.id });
    const row = await db.cardProgress.findFirstOrThrow({ where: { flashcardId: card.id } });
    expect(row).toMatchObject({ mark: "REPEAT", knowCount: 0 });
    expect((await db.reviewEvent.findFirstOrThrow()).resetFrom).toBe(4);
  });
});

describe("SCR-06 API-12 — the counter rises once per session (AC-08.4, DEC-14, AQ-001)", () => {
  it("two Umiem on one card in one session are two events but raise the counter once", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    const session = await createSession(user.id, [card.id]);
    await markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: session.id });
    await markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: session.id });
    expect((await db.cardProgress.findFirstOrThrow()).knowCount).toBe(1);
    const events = await db.reviewEvent.findMany({ orderBy: { id: "asc" } });
    expect(events.map((event) => event.countedTowardsKnow)).toEqual([true, false]);
  });

  it("a marking with no session never suppresses the count of a session's first Umiem", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await db.reviewEvent.create({
      data: { userId: user.id, flashcardId: card.id, sessionId: null, mark: "KNOW", countedTowardsKnow: true },
    });
    const session = await createSession(user.id, [card.id]);
    await markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: session.id });
    expect((await db.cardProgress.findFirstOrThrow()).knowCount).toBe(1);
  });

  it("a card deleted meanwhile is skipped and nothing is written (DEC-59)", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    const session = await createSession(user.id, [card.id]);
    await db.flashcard.delete({ where: { id: card.id } });
    const result = await markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: session.id });
    expect(result).toEqual({ status: "skipped" });
    expect(await db.reviewEvent.count()).toBe(0);
  });
});

describe("SCR-06 — progress is per person (AC-08.13, REQ-02)", () => {
  it("two accounts marking the same card each see their own counter", async () => {
    const mine = await signedInUser();
    const other = await createUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await createProgress(other.id, card.id, { knowCount: 3 });
    const session = await createSession(mine.id, [card.id]);
    await markCardAction({ flashcardId: card.id, mark: "KNOW", sessionId: session.id });
    const rows = await db.cardProgress.findMany({ orderBy: { userId: "asc" } });
    expect(rows.map((row) => [row.userId, row.knowCount])).toEqual([
      [mine.id, 1],
      [other.id, 3],
    ]);
  });
});
