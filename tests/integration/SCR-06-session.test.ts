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
 * SCR-06 — the session around the markings: API-10 startSession, API-11 getSessionQueue,
 * API-14 shuffleSession, API-26 listCategories and the rebuild behind the chips (AC-08.1, 08.7 …
 * 08.10, 08.12; test scenarios 3, 4 and 6). Against the real database; access refusals of the
 * actions included (CLAUDE.md §9.2).
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/start" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { startSessionAction } = await import("@/server/actions/startSession");
const { shuffleSessionAction } = await import("@/server/actions/shuffleSession");
const { applySessionFiltersAction } = await import("@/server/actions/applySessionFilters");
const { getSessionQueue } = await import("@/server/services/getSessionQueue");
const { listCategories } = await import("@/server/services/listCategories");
const { startSession } = await import("@/server/services/startSession");
const authMock = asSessionMock(auth);

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

async function signedInUser(role: "USER" | "ADMIN" = "USER") {
  await db.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 7`);
  const user = await createUser({ role });
  authMock.mockResolvedValue(signedInSession(role));
  return user;
}

async function cards(categoryId: number, count: number) {
  const made = [];
  for (let i = 0; i < count; i++) made.push(await createFlashcard(categoryId, null));
  return made;
}

const storedQueue = async (sessionId: number) =>
  (await db.studySession.findUniqueOrThrow({ where: { id: sessionId } })).queue as {
    flashcardId: number;
    isReinforcement: boolean;
  }[];

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
});

describe("SCR-06 API-10 — startSessionAction (AC-08.1)", () => {
  it("a Guest is sent to SCR-01 and no session is written", async () => {
    authMock.mockResolvedValue(null);
    const refusal = await refusalFrom(() => startSessionAction(form({})));
    expect(refusal).toMatchObject({ kind: "redirect" });
    expect(await db.studySession.count()).toBe(0);
  });

  for (const role of ["USER", "ADMIN"] as const) {
    it(`a ${role} opens a session of at most 20 cards and lands on SCR-06`, async () => {
      const user = await signedInUser(role);
      await cards((await createCategory("PHP", 1)).id, 30);
      const refusal = await refusalFrom(() => startSessionAction(form({})));
      expect(refusal).toMatchObject({ kind: "redirect", target: "/nauka" });
      const session = await db.studySession.findFirstOrThrow({ where: { userId: user.id } });
      expect((session.queue as unknown[]).length).toBe(20);
      const result = await getSessionQueue(user.id);
      expect(result).toMatchObject({ status: "ok", position: 1, total: 20 });
    });
  }

  it("starting a new session closes the one left open (DEC-13)", async () => {
    const user = await signedInUser();
    await cards((await createCategory("PHP", 1)).id, 3);
    const first = await startSession(user.id, {});
    const second = await startSession(user.id, {});
    const rows = await db.studySession.findMany({ orderBy: { id: "asc" } });
    expect(rows.map((row) => row.endedAt !== null)).toEqual([true, false]);
    expect(second.sessionId).not.toBe(first.sessionId);
  });

  it("pending and rejected cards are never queued", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const [approved] = await cards(category.id, 1);
    await createFlashcard(category.id, user.id, "PENDING");
    await createFlashcard(category.id, user.id, "REJECTED");
    const { sessionId } = await startSession(user.id, {});
    expect((await storedQueue(sessionId)).map((entry) => entry.flashcardId)).toEqual([approved!.id]);
  });
});

describe("SCR-06 — the queue rules through the real domain (AC-08.10, scenario 3)", () => {
  it("every fifth position is a known card flagged Powtórka; hidden ones may fill it (DEC-09)", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const fresh = await cards(category.id, 8);
    const [known] = await cards(category.id, 1);
    await createProgress(user.id, known!.id, {
      knowCount: 5,
      hiddenUntil: new Date(Date.now() + 86_400_000),
    });
    const { sessionId } = await startSession(user.id, {});
    const queue = await storedQueue(sessionId);
    expect(queue).toHaveLength(9);
    expect(queue[4]).toEqual({ flashcardId: known!.id, isReinforcement: true });
    expect(queue.filter((entry) => entry.isReinforcement)).toHaveLength(1);
    expect(fresh.every((card) => queue.some((entry) => entry.flashcardId === card.id))).toBe(true);
  });

  it("no Powtórka badge when no known card exists", async () => {
    const user = await signedInUser();
    await cards((await createCategory("PHP", 1)).id, 8);
    const { sessionId } = await startSession(user.id, {});
    expect((await storedQueue(sessionId)).some((entry) => entry.isReinforcement)).toBe(false);
  });

  it("draws Nie umiem first, then Do powtórki, then unseen", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const [unseen, repeat, unknown] = await cards(category.id, 3);
    await createProgress(user.id, repeat!.id, { mark: "REPEAT" });
    await createProgress(user.id, unknown!.id, { mark: "UNKNOWN" });
    const { sessionId } = await startSession(user.id, {});
    const ids = (await storedQueue(sessionId)).map((entry) => entry.flashcardId);
    expect(ids).toEqual([unknown!.id, repeat!.id, unseen!.id]);
  });
});

describe("SCR-06 API-11 — the loader (AC-08.12, scenario 4)", () => {
  it("returns the card at the stored cursor after a reload", async () => {
    const user = await signedInUser();
    const [a, b, c] = await cards((await createCategory("PHP", 1)).id, 3);
    const session = await createSession(user.id, [a!.id, b!.id, c!.id], { cursor: 1 });
    const first = await getSessionQueue(user.id);
    const second = await getSessionQueue(user.id);
    expect(first).toMatchObject({ status: "ok", position: 2, total: 3 });
    expect(second).toMatchObject({ status: "ok", card: { id: b!.id } });
    expect(session.id).toBeGreaterThan(0);
  });

  it("persists a moved cursor, and reports finished past the last card", async () => {
    const user = await signedInUser();
    const [a, b] = await cards((await createCategory("PHP", 1)).id, 2);
    const session = await createSession(user.id, [a!.id, b!.id]);
    expect(await getSessionQueue(user.id, 1)).toMatchObject({ status: "ok", position: 2 });
    expect((await db.studySession.findUniqueOrThrow({ where: { id: session.id } })).cursor).toBe(1);
    expect(await getSessionQueue(user.id, 2)).toEqual({ status: "finished", sessionId: session.id });
  });

  it("returns none when the caller has no open session", async () => {
    const user = await signedInUser();
    expect(await getSessionQueue(user.id)).toEqual({ status: "none" });
  });

  it("never reads another person's session", async () => {
    const user = await signedInUser();
    const other = await createUser();
    const [a] = await cards((await createCategory("PHP", 1)).id, 1);
    await createSession(other.id, [a!.id]);
    expect(await getSessionQueue(user.id)).toEqual({ status: "none" });
  });

  it("skips a card deleted meanwhile, the total drops and no error is raised", async () => {
    const user = await signedInUser();
    const [a, b, c] = await cards((await createCategory("PHP", 1)).id, 3);
    await createSession(user.id, [a!.id, b!.id, c!.id], { cursor: 1 });
    await db.flashcard.delete({ where: { id: b!.id } });
    expect(await getSessionQueue(user.id)).toMatchObject({
      status: "ok",
      card: { id: c!.id },
      position: 2,
      total: 2,
    });
  });

  it("shows the learner's own standing and expires a finished hide (DEC-04)", async () => {
    const user = await signedInUser();
    const [a] = await cards((await createCategory("PHP", 1)).id, 1);
    await createProgress(user.id, a!.id, { knowCount: 5, hiddenUntil: new Date(Date.now() - 1000) });
    await createSession(user.id, [a!.id]);
    expect(await getSessionQueue(user.id)).toMatchObject({ mark: "REPEAT", knowCount: 0 });
  });
});

describe("SCR-06 — filters rebuild the queue inside the session (AC-08.8, AC-08.9, DEC-15, DEC-17)", () => {
  it("a chip change keeps the session id and the events already written", async () => {
    const user = await signedInUser();
    const php = await createCategory("PHP", 1);
    const react = await createCategory("React", 2);
    const [p] = await cards(php.id, 2);
    const [r] = await cards(react.id, 2);
    const { sessionId } = await startSession(user.id, {});
    await db.reviewEvent.create({ data: { userId: user.id, flashcardId: p!.id, sessionId, mark: "KNOW" } });
    await applySessionFiltersAction({ category: react.id });
    const row = await db.studySession.findUniqueOrThrow({ where: { id: sessionId } });
    expect(row).toMatchObject({ id: sessionId, endedAt: null, cursor: 0, filters: { category: react.id } });
    expect((await storedQueue(sessionId)).map((entry) => entry.flashcardId)).toContain(r!.id);
    expect(await db.reviewEvent.count()).toBe(1);
    expect(await db.studySession.count()).toBe(1);
  });

  it("Zacznij od nowa clears every filter and rebuilds over the whole pool", async () => {
    const user = await signedInUser();
    const php = await createCategory("PHP", 1);
    await cards(php.id, 3);
    const { sessionId } = await startSession(user.id, { category: php.id, query: "nic" });
    expect(await getSessionQueue(user.id)).toMatchObject({ status: "empty", kind: "no-results" });
    await applySessionFiltersAction({});
    expect((await storedQueue(sessionId)).length).toBe(3);
    expect((await db.studySession.findUniqueOrThrow({ where: { id: sessionId } })).filters).toEqual({});
  });

  it("finds a phrase regardless of case and diacritics (DEC-49)", async () => {
    const user = await signedInUser();
    const category = await createCategory("PHP", 1);
    const [a] = await cards(category.id, 2);
    await db.flashcard.update({ where: { id: a!.id }, data: { question: "Czym jest DOMKNIĘCIE?" } });
    const { sessionId } = await startSession(user.id, { query: "domkniecie" });
    expect((await storedQueue(sessionId)).map((entry) => entry.flashcardId)).toEqual([a!.id]);
  });

  it("the marking chip narrows the queue to that marking", async () => {
    const user = await signedInUser();
    const [a, b] = await cards((await createCategory("PHP", 1)).id, 2);
    await createProgress(user.id, a!.id, { mark: "UNKNOWN" });
    await createProgress(user.id, b!.id, { mark: "REPEAT" });
    const { sessionId } = await startSession(user.id, { mark: "unknown" });
    expect((await storedQueue(sessionId)).map((entry) => entry.flashcardId)).toEqual([a!.id]);
  });

  for (const role of ["USER", "ADMIN"] as const) {
    it(`a ${role} applying filters rebuilds only their own open session`, async () => {
      const user = await signedInUser(role);
      const other = await createUser();
      const php = await createCategory("PHP", 1);
      const ids = (await cards(php.id, 4)).map((card) => card.id);
      const mine = await startSession(user.id, {});
      const theirs = await createSession(other.id, ids.slice(0, 2));
      await applySessionFiltersAction({ category: php.id });
      const own = await db.studySession.findUniqueOrThrow({ where: { id: mine.sessionId } });
      expect(own.filters).toEqual({ category: php.id });
      const untouched = await db.studySession.findUniqueOrThrow({ where: { id: theirs.id } });
      expect(untouched.filters).toEqual(theirs.filters);
      expect((await storedQueue(theirs.id)).map((entry) => entry.flashcardId)).toEqual(ids.slice(0, 2));
    });
  }

  it("the applySessionFiltersAction sends a caller with no session to SCR-05, and a Guest to SCR-01", async () => {
    await signedInUser();
    expect(await refusalFrom(() => applySessionFiltersAction({}))).toMatchObject({ target: "/start" });
    authMock.mockResolvedValue(null);
    expect(await refusalFrom(() => applySessionFiltersAction({}))).toMatchObject({ kind: "redirect" });
  });
});

describe("SCR-06 — the two empty states (scenario 6)", () => {
  it("a phrase matching nothing is Brak wyników", async () => {
    const user = await signedInUser();
    await cards((await createCategory("PHP", 1)).id, 2);
    await startSession(user.id, { query: "kubernetes" });
    expect(await getSessionQueue(user.id)).toMatchObject({
      status: "empty",
      kind: "no-results",
      filters: { query: "kubernetes" },
    });
  });

  it("a category whose cards are all hidden is Nic tu teraz do nauki, with the return date", async () => {
    const user = await signedInUser();
    const category = await createCategory("Git", 1);
    const hiddenUntil = new Date(Date.now() + 3 * 86_400_000);
    for (const card of await cards(category.id, 2)) {
      await createProgress(user.id, card.id, { knowCount: 5, hiddenUntil });
    }
    await startSession(user.id, { category: category.id });
    const result = await getSessionQueue(user.id);
    expect(result).toMatchObject({ status: "empty", kind: "all-hidden" });
    expect(result.status === "empty" && result.returnDate?.getTime()).toBe(hiddenUntil.getTime());
  });
});

describe("SCR-06 API-14 — shuffleSessionAction (AC-08.7)", () => {
  for (const role of ["USER", "ADMIN"] as const) {
  it(`a ${role} reorders only the unseen tail and leaves the cursor and current card alone`, async () => {
    const user = await signedInUser(role);
    const made = await cards((await createCategory("PHP", 1)).id, 12);
    const ids = made.map((card) => card.id);
    const session = await createSession(user.id, ids, { cursor: 3 });
    let changed = false;
    for (let attempt = 0; attempt < 5 && !changed; attempt++) {
      await shuffleSessionAction({ sessionId: session.id });
      const after = (await storedQueue(session.id)).map((entry) => entry.flashcardId);
      expect(after.slice(0, 4)).toEqual(ids.slice(0, 4));
      expect([...after].sort((x, y) => x - y)).toEqual([...ids].sort((x, y) => x - y));
      changed = after.join() !== ids.join();
    }
    expect(changed).toBe(true);
    expect((await db.studySession.findUniqueOrThrow({ where: { id: session.id } })).cursor).toBe(3);
  });
  }

  it("refuses someone else's session with SCR-22 and a Guest with SCR-01", async () => {
    await signedInUser();
    const other = await createUser();
    const [a] = await cards((await createCategory("PHP", 1)).id, 1);
    const theirs = await createSession(other.id, [a!.id]);
    expect((await refusalFrom(() => shuffleSessionAction({ sessionId: theirs.id }))).kind).toBe("notFound");
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => shuffleSessionAction({ sessionId: theirs.id }))).kind).toBe("redirect");
  });

  it("an Administrator shuffling a User's session ends at SCR-22 and leaves the queue as it was", async () => {
    await signedInUser("ADMIN");
    const other = await createUser();
    const ids = (await cards((await createCategory("PHP", 1)).id, 12)).map((card) => card.id);
    const theirs = await createSession(other.id, ids);
    expect((await refusalFrom(() => shuffleSessionAction({ sessionId: theirs.id }))).kind).toBe("notFound");
    expect((await storedQueue(theirs.id)).map((entry) => entry.flashcardId)).toEqual(ids);
  });
});

describe("API-26 listCategories", () => {
  it("lists in display order with approved counts, and deletable only while empty", async () => {
    const user = await createUser();
    const second = await createCategory("React", 2);
    const first = await createCategory("PHP", 1);
    const empty = await createCategory("Testy", 3);
    await cards(first.id, 2);
    await createFlashcard(first.id, user.id, "PENDING");
    await createFlashcard(second.id, user.id, "REJECTED");
    const { rows } = await listCategories(true);
    expect(rows.map((row) => [row.name, row.flashcardCount, row.deletable])).toEqual([
      ["PHP", 2, false],
      ["React", 0, false],
      ["Testy", 0, true],
    ]);
    expect(rows[2]!.id).toBe(empty.id);
    expect((await listCategories()).rows[0]).toEqual({ id: first.id, name: "PHP", position: 1 });
  });
});
