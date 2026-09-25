import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createProgress, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * SCR-09 / API-07 getFlashcard and the session-less API-12 — the object rule on ENT-03 as Guest,
 * author, another User and Administrator (AC-12.2, NFR-01, DEC-57), and the marking rules that
 * apply here without a session (AC-12.4 … AC-12.9, AC-12.11; CLAUDE.md §9.2).
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/fiszki/1" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { markCardAction } = await import("@/server/actions/markCard");
const { getFlashcard } = await import("@/server/services/getFlashcard");
const { getHomeSummary } = await import("@/server/services/getHomeSummary");
const { default: FlashcardPage } = await import("@/app/(app)/fiszki/[id]/page");
const authMock = asSessionMock(auth);

const DAY = 24 * 60 * 60 * 1000;
type Person = { id: number; role: "USER" | "ADMIN"; nickname: string };

function signInAs(user: Person): void {
  authMock.mockResolvedValue({
    user: { id: String(user.id), email: `${user.nickname}@example.test`, nickname: user.nickname, role: user.role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session);
}

const open = (id: string | number, search: Record<string, string> = {}) =>
  FlashcardPage({ params: Promise.resolve({ id: String(id) }), searchParams: Promise.resolve(search) });

async function world() {
  const category = await createCategory("PHP", 1);
  const author = await createUser({ nickname: "autorka" });
  const other = await createUser({ nickname: "obcy" });
  const admin = await createUser({ role: "ADMIN", nickname: "admin" });
  const approved = await createFlashcard(category.id, author.id, "APPROVED");
  const pending = await createFlashcard(category.id, author.id, "PENDING");
  const rejected = await createFlashcard(category.id, author.id, "REJECTED");
  return { category, author, other, admin, approved, pending, rejected };
}

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
});

describe("SCR-09 — access (AC-12.2, DEC-57)", () => {
  it("a Guest is sent to SCR-01 by the page and by the marking action; nothing is written", async () => {
    const { approved } = await world();
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => open(approved.id))).kind).toBe("redirect");
    const marked = await refusalFrom(() => markCardAction({ flashcardId: approved.id, mark: "KNOW" }));
    expect(marked.kind).toBe("redirect");
    expect(await db.reviewEvent.count()).toBe(0);
  });

  it("any signed-in person opens an approved card", async () => {
    const { other, admin, approved } = await world();
    for (const person of [other, admin]) {
      signInAs(person);
      const screen = await open(approved.id);
      expect(screen.props.detail.card.id).toBe(approved.id);
    }
  });

  it("the author and an Administrator open a pending and a rejected card", async () => {
    const { author, admin, pending, rejected } = await world();
    for (const person of [author, admin]) {
      signInAs(person);
      for (const card of [pending, rejected]) {
        expect((await open(card.id)).props.detail.card.status).toBe(card.status);
      }
    }
  });

  it("another User gets the same refusal for a pending or rejected card as for a missing id", async () => {
    const { other, pending, rejected } = await world();
    signInAs(other);
    const missing = await refusalFrom(() => open(999_999));
    const malformed = await refusalFrom(() => open("abc"));
    const overflow = await refusalFrom(() => open("99999999999999999999"));
    for (const card of [pending, rejected]) {
      const refused = await refusalFrom(() => open(card.id));
      expect(refused).toEqual(missing);
      expect(refused.kind).toBe("notFound");
    }
    expect(malformed).toEqual(missing);
    expect(overflow).toEqual(missing);
  });

  it("the service answers null for a missing card and for a card the caller may not read", async () => {
    const { other, pending } = await world();
    expect(await getFlashcard(other, pending.id)).toBeNull();
    expect(await getFlashcard(other, 999_999)).toBeNull();
  });

  it("marking another person's pending card is refused as a missing card, and writes nothing", async () => {
    const { other, pending } = await world();
    signInAs(other);
    const refused = await refusalFrom(() => markCardAction({ flashcardId: pending.id, mark: "KNOW" }));
    const missing = await refusalFrom(() => markCardAction({ flashcardId: 999_999, mark: "KNOW" }));
    expect(refused).toEqual(missing);
    expect(await db.cardProgress.count()).toBe(0);
    expect(await db.reviewEvent.count()).toBe(0);
  });

  it("edit and delete flags are computed on the server and never true for a User on another's card", async () => {
    const { author, other, admin, approved, pending } = await world();
    expect(await getFlashcard(other, approved.id)).toMatchObject({ canEdit: false, canDelete: false });
    expect(await getFlashcard(author, approved.id)).toMatchObject({ canEdit: false, canDelete: false });
    expect(await getFlashcard(author, pending.id)).toMatchObject({ canEdit: true, canDelete: false });
    expect(await getFlashcard(admin, approved.id)).toMatchObject({ canEdit: true, canDelete: true });
  });
});

describe("SCR-09 — what the screen reads", () => {
  it("a card never marked has no marking, a zero count and no hide (AC-12.9)", async () => {
    const { other, approved } = await world();
    expect(await getFlashcard(other, approved.id)).toMatchObject({
      mark: null,
      knowCount: 0,
      hiddenUntil: null,
      lastSeenAt: null,
    });
  });

  it("reads only the caller's own progress (ENT-05)", async () => {
    const { author, other, approved } = await world();
    await createProgress(author.id, approved.id, { mark: "KNOW", knowCount: 3 });
    expect(await getFlashcard(other, approved.id)).toMatchObject({ mark: null, knowCount: 0 });
    expect(await getFlashcard(author, approved.id)).toMatchObject({ mark: "KNOW", knowCount: 3 });
  });

  it("a card whose account was deleted has no author (AC-12.8, DEC-40)", async () => {
    const { author, other, approved } = await world();
    await db.user.delete({ where: { id: author.id } });
    expect((await getFlashcard(other, approved.id))?.author).toBeNull();
  });

  it("a hide that has ended reads as Do powtórki, count zero, no hide (DEC-04)", async () => {
    const { other, approved } = await world();
    await createProgress(other.id, approved.id, {
      mark: "KNOW",
      knowCount: 5,
      hiddenUntil: new Date(Date.now() - DAY),
      firstKnownAt: new Date(Date.now() - 9 * DAY),
    });
    expect(await getFlashcard(other, approved.id)).toMatchObject({ mark: "REPEAT", knowCount: 0, hiddenUntil: null });
  });

  it("Wróć do listy carries the library filters, and drops what is not one (AC-12.7, DEC-51)", async () => {
    const { other, approved } = await world();
    signInAs(other);
    const carried = await open(approved.id, { query: "php", category: "3", mark: "know", limit: "40", sort: "oldest" });
    expect(carried.props.backHref).toBe("/fiszki?query=php&category=3&mark=know&sort=oldest&limit=40");
    const junk = await open(approved.id, { category: "abc", mark: "x", limit: "-5", evil: "1" });
    expect(junk.props.backHref).toBe("/fiszki");
  });
});

describe("SCR-09 — marking without a session (API-12, AQ-001)", () => {
  it("saves the marking, writes a Review Event with a null sessionId and creates no session (AC-12.4, AC-12.11)", async () => {
    const { other, approved } = await world();
    signInAs(other);
    expect(await markCardAction({ flashcardId: approved.id, mark: "REPEAT" })).toEqual({ status: "ok", knowCount: 0 });
    const events = await db.reviewEvent.findMany({ where: { userId: other.id } });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ flashcardId: approved.id, mark: "REPEAT", sessionId: null });
    expect(await db.studySession.count()).toBe(0);
    expect(await getFlashcard(other, approved.id)).toMatchObject({ mark: "REPEAT", knowCount: 0 });
  });

  it("the fifth Umiem sets the hide and a Nie umiem clears it at once (AC-12.5, DEC-05, DEC-11)", async () => {
    const { other, approved } = await world();
    signInAs(other);
    for (let time = 1; time <= 4; time += 1) {
      await markCardAction({ flashcardId: approved.id, mark: "KNOW" });
      expect(await getFlashcard(other, approved.id)).toMatchObject({ knowCount: time, hiddenUntil: null });
    }
    await markCardAction({ flashcardId: approved.id, mark: "KNOW" });
    const hidden = await getFlashcard(other, approved.id);
    expect(hidden?.knowCount).toBe(5);
    expect(hidden?.hiddenUntil?.getTime()).toBeGreaterThan(Date.now() + 6 * DAY);
    expect((await open(approved.id)).props.detail.hiddenUntil).toEqual(hidden?.hiddenUntil);

    await markCardAction({ flashcardId: approved.id, mark: "UNKNOWN" });
    expect(await getFlashcard(other, approved.id)).toMatchObject({ mark: "UNKNOWN", knowCount: 0, hiddenUntil: null });
  });

  it("a marking given here moves the counters SCR-05 reports (AC-12.6)", async () => {
    const { other, approved } = await world();
    signInAs(other);
    expect((await getHomeSummary(other.id, other.nickname, false)).counts.know).toBe(0);
    await markCardAction({ flashcardId: approved.id, mark: "KNOW" });
    expect((await getHomeSummary(other.id, other.nickname, false)).counts.know).toBe(1);
  });

  it("an author may mark their own pending card; an Administrator any card", async () => {
    const { author, admin, pending } = await world();
    signInAs(author);
    expect((await markCardAction({ flashcardId: pending.id, mark: "KNOW" })).status).toBe("ok");
    signInAs(admin);
    expect((await markCardAction({ flashcardId: pending.id, mark: "REPEAT" })).status).toBe("ok");
  });
});
