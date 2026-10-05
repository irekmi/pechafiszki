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
 * SCR-07 — API-13 finishSession and the summary page: reconciliation with the session's Review
 * Events (AC-09.3, 09.4), the hidden date (AC-09.5), the note forms (AC-09.6), idempotence
 * (AC-09.1, 09.7), the empty session (AC-09.10), AQ-001 isolation (AC-09.13) and the ownership
 * refusal (AC-09.9), as Guest, User and Administrator (CLAUDE.md §9.2).
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/podsumowanie/1" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { finishSessionAction } = await import("@/server/actions/finishSession");
const { markCard } = await import("@/server/services/markCard");
const { finishSession } = await import("@/server/services/finishSession");
const { default: SummaryPage } = await import("@/app/(app)/podsumowanie/[id]/page");
const authMock = asSessionMock(auth);

const DAY = 24 * 60 * 60 * 1000;
type Role = "USER" | "ADMIN";

function form(sessionId: number | string): FormData {
  const data = new FormData();
  data.set("sessionId", String(sessionId));
  return data;
}

async function signedInUser(role: Role = "USER") {
  await db.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 7`);
  const user = await createUser({ role });
  authMock.mockResolvedValue(signedInSession(role));
  return user;
}

const mark = (user: { id: number; role: Role }, flashcardId: number, value: "KNOW" | "REPEAT" | "UNKNOWN", sessionId?: number) =>
  markCard(user, { flashcardId, mark: value, ...(sessionId ? { sessionId } : {}) });

/** A card with `count` counted Umiem markings in its history (null session), the last one `daysAgo` ago. */
async function seedKnows(userId: number, flashcardId: number, count: number, daysAgo = 0) {
  const last = new Date(Date.now() - daysAgo * DAY);
  for (let i = 0; i < count; i++) {
    const createdAt = new Date(last.getTime() - (count - 1 - i) * 1000);
    await db.reviewEvent.create({
      data: { userId, flashcardId, mark: "KNOW", countedTowardsKnow: true, sessionId: null, createdAt },
    });
  }
  await createProgress(userId, flashcardId, {
    knowCount: count,
    ...(count >= 5 ? { hiddenUntil: new Date(last.getTime() + 7 * DAY) } : {}),
  });
}

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
});

describe("SCR-07 API-13 — the summary reconciles with the Review Events (AC-09.3, 09.4)", () => {
  it("counts each card once and splits reinforcement, and reviewed = know + repeat + unknown", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const cards = [];
    for (let i = 0; i < 6; i++) cards.push(await createFlashcard(category.id, null));
    const session = await createSession(user.id, cards.map((c) => c.id), { reinforcement: [cards[1]!.id, cards[4]!.id] });

    await mark(user, cards[0]!.id, "KNOW", session.id);
    await mark(user, cards[1]!.id, "KNOW", session.id);
    await mark(user, cards[2]!.id, "REPEAT", session.id);
    await mark(user, cards[3]!.id, "UNKNOWN", session.id);
    await mark(user, cards[4]!.id, "KNOW", session.id);
    await mark(user, cards[4]!.id, "REPEAT", session.id);

    const summary = await finishSession(user.id, session.id);
    expect(summary).toMatchObject({ reviewed: 5, queued: 6, know: 2, knowReinforcements: 1, repeat: 2, unknown: 1 });
    expect(summary!.know + summary!.repeat + summary!.unknown).toBe(summary!.reviewed);
    const distinct = await db.reviewEvent.groupBy({ by: ["flashcardId"], where: { sessionId: session.id } });
    expect(summary!.reviewed).toBe(distinct.length);
  });

  it("a session in which nothing was marked has every count zero and no rows (AC-09.10)", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    const session = await createSession(user.id, [card.id]);
    expect(await finishSession(user.id, session.id)).toMatchObject({
      reviewed: 0, know: 0, repeat: 0, unknown: 0, hiddenThisSession: 0, returnDate: null, unknownCards: [],
    });
  });

  it("a marking given outside a session appears in no summary (AC-09.13, AQ-001)", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const [outside, inside] = [await createFlashcard(category.id, null), await createFlashcard(category.id, null)];
    await mark(user, outside.id, "UNKNOWN");
    const session = await createSession(user.id, [inside.id]);
    await mark(user, inside.id, "KNOW", session.id);

    expect(await db.reviewEvent.count({ where: { sessionId: null } })).toBe(1);
    const summary = await finishSession(user.id, session.id);
    expect(summary).toMatchObject({ reviewed: 1, know: 1, unknown: 0, unknownCards: [] });
  });
});

describe("SCR-07 API-13 — the hidden cards (AC-09.5)", () => {
  it("a card taken to its fifth Umiem is hidden, and the date is seven days after that marking", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const [fifth, fourth] = [await createFlashcard(category.id, null), await createFlashcard(category.id, null)];
    await seedKnows(user.id, fifth.id, 4);
    await seedKnows(user.id, fourth.id, 3);
    const session = await createSession(user.id, [fifth.id, fourth.id]);
    await mark(user, fifth.id, "KNOW", session.id);
    await mark(user, fourth.id, "KNOW", session.id);

    const summary = await finishSession(user.id, session.id);
    const event = await db.reviewEvent.findFirstOrThrow({ where: { flashcardId: fifth.id, sessionId: session.id } });
    expect(summary!.hiddenThisSession).toBe(1);
    expect(summary!.returnDate).toEqual(new Date(event.createdAt.getTime() + 7 * DAY));
  });

  it("a card hidden earlier and only re-marked in this session is not counted", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await seedKnows(user.id, card.id, 5, 4);
    const session = await createSession(user.id, [card.id], { reinforcement: [card.id] });
    await mark(user, card.id, "KNOW", session.id);
    expect((await finishSession(user.id, session.id))!.hiddenThisSession).toBe(0);
  });

  it("a card marked Do powtórki after its fifth Umiem is no longer hidden", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await seedKnows(user.id, card.id, 4);
    const session = await createSession(user.id, [card.id]);
    await mark(user, card.id, "KNOW", session.id);
    await mark(user, card.id, "REPEAT", session.id);
    expect((await finishSession(user.id, session.id))!.hiddenThisSession).toBe(0);
  });

  it("re-marking the card in a later session (which un-hides it) leaves the old summary unchanged (AC-09.7)", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await seedKnows(user.id, card.id, 4);
    const session = await createSession(user.id, [card.id]);
    await mark(user, card.id, "KNOW", session.id);
    const before = await finishSession(user.id, session.id);
    expect(before!.hiddenThisSession).toBe(1);

    const later = await createSession(user.id, [card.id]);
    await mark(user, card.id, "UNKNOWN", later.id);
    await mark(user, card.id, "REPEAT");

    const after = await finishSession(user.id, session.id);
    expect(after).toEqual(before);
  });
});

describe("SCR-07 API-13 — the unknown rows and their notes (AC-09.6, DEC-20)", () => {
  it("each row carries exactly one of the three note forms", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const [reset, again, first] = [
      await createFlashcard(category.id, null),
      await createFlashcard(category.id, null),
      await createFlashcard(category.id, null),
    ];
    await seedKnows(user.id, reset.id, 3);
    const earlier = await createSession(user.id, [again.id]);
    await mark(user, again.id, "UNKNOWN", earlier.id);
    await db.studySession.update({ where: { id: earlier.id }, data: { endedAt: new Date() } });

    const session = await createSession(user.id, [reset.id, again.id, first.id]);
    await mark(user, reset.id, "UNKNOWN", session.id);
    await mark(user, again.id, "UNKNOWN", session.id);
    await mark(user, first.id, "UNKNOWN", session.id);

    const summary = await finishSession(user.id, session.id);
    const notes = Object.fromEntries(summary!.unknownCards.map((row) => [row.id, row.note]));
    expect(notes[reset.id]).toBe("Licznik „Umiem” wyzerowany z 3");
    expect(notes[again.id]).toBe("Oceniona „Nie umiem” po raz drugi");
    expect(notes[first.id]).toBe("Pierwszy raz w sesji");
    expect(summary!.resetCount).toBe(1);
    expect(summary!.unknownCards.every((row) => row.category === "PHP")).toBe(true);
  });

  it("a later session marking the same card does not change this session's note", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    const first = await createSession(user.id, [card.id]);
    await mark(user, card.id, "UNKNOWN", first.id);
    const before = await finishSession(user.id, first.id);
    const second = await createSession(user.id, [card.id]);
    await mark(user, card.id, "UNKNOWN", second.id);
    expect(await finishSession(user.id, first.id)).toEqual(before);
    expect(before!.unknownCards[0]!.note).toBe("Pierwszy raz w sesji");
  });
});

describe("SCR-07 API-13 — closing and idempotence (AC-09.1, 09.7)", () => {
  it("sets endedAt once; a second and third call change no number and do not re-close", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    const session = await createSession(user.id, [card.id]);
    await db.studySession.update({ where: { id: session.id }, data: { startedAt: new Date(Date.now() - 22 * 60_000) } });
    await mark(user, card.id, "KNOW", session.id);

    const first = await finishSession(user.id, session.id);
    const closed = (await db.studySession.findUniqueOrThrow({ where: { id: session.id } })).endedAt;
    expect(closed).not.toBeNull();
    expect(first!.durationMinutes).toBe(22);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await finishSession(user.id, session.id)).toEqual(first);
    expect(await finishSession(user.id, session.id)).toEqual(first);
    expect((await db.studySession.findUniqueOrThrow({ where: { id: session.id } })).endedAt).toEqual(closed);
  });
});

describe("SCR-07 — access (AC-09.9, NFR-01, DEC-57)", () => {
  it("a Guest is sent to SCR-01 by the action and the page, and nothing is closed", async () => {
    const owner = await createUser();
    const session = await createSession(owner.id, []);
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => finishSessionAction(form(session.id)))).kind).toBe("redirect");
    expect((await refusalFrom(() => SummaryPage({ params: Promise.resolve({ id: String(session.id) }) }))).kind).toBe("redirect");
    expect((await db.studySession.findUniqueOrThrow({ where: { id: session.id } })).endedAt).toBeNull();
  });

  for (const role of ["USER", "ADMIN"] as const) {
    it(`a ${role} finishing their own session lands on SCR-07; another person's id is the same 404 as a missing one`, async () => {
      const user = await signedInUser(role);
      const other = await createUser();
      const category = await createCategory("PHP", 1);
      const card = await createFlashcard(category.id, null);
      const own = await createSession(user.id, [card.id]);
      const theirs = await createSession(other.id, [card.id]);

      const landed = await refusalFrom(() => finishSessionAction(form(own.id)));
      expect(landed).toMatchObject({ kind: "redirect", target: `/podsumowanie/${own.id}` });
      expect((await db.studySession.findUniqueOrThrow({ where: { id: own.id } })).endedAt).not.toBeNull();

      const foreign = await refusalFrom(() => SummaryPage({ params: Promise.resolve({ id: String(theirs.id) }) }));
      const missing = await refusalFrom(() => SummaryPage({ params: Promise.resolve({ id: "99999" }) }));
      const malformed = await refusalFrom(() => SummaryPage({ params: Promise.resolve({ id: "abc" }) }));
      expect([foreign.kind, missing.kind, malformed.kind]).toEqual(["notFound", "notFound", "notFound"]);
      expect((await refusalFrom(() => finishSessionAction(form(theirs.id)))).kind).toBe("notFound");
      expect((await db.studySession.findUniqueOrThrow({ where: { id: theirs.id } })).endedAt).toBeNull();
    });
  }
});
