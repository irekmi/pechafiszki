import { beforeEach, describe, expect, it, vi } from "vitest";
import { weekBounds } from "@/domain/week";
import { db } from "@/server/db";
import type { AdminOverview } from "@/server/services/getAdminOverview";
import { createCategory, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInWithRow } from "./setup/mockSession";

/**
 * SCR-15 / API-25 from the table (CLAUDE.md §9.2, §8, NFR-01). The page is exercised as Guest, User
 * and Administrator, asserting the refusal and not only the success (AC-20.9); every tile figure is
 * reconciled against a known fixture set built with direct `db` writes, so status counts, the
 * rejection-reason count, the categories' largest and the newest-five list are checked against the
 * same rows a hand count would read (AC-20.1, 20.4, 20.7); the weekly decision average is checked
 * against a known set of decisions inside `weekBounds` (AC-20.5, DEC-55), and both empty states
 * (AC-20.5's empty week, AC-20.8's nothing pending).
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/administracja" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { default: OverviewPage } = await import("@/app/(admin)/administracja/page");
const authMock = asSessionMock(auth);

const open = () => OverviewPage();
const overviewOf = async () =>
  ((await open()) as unknown as { props: { overview: AdminOverview } }).props.overview;

let seq = 0;

async function makeUser(nickname: string, role: "USER" | "ADMIN", createdAt: Date) {
  return db.user.create({
    data: { email: `${nickname}@example.test`, nickname, passwordHash: "not-a-real-hash", role, createdAt },
  });
}

type CardOpts = {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  authorId?: number | null;
  submittedAt?: Date;
  question?: string;
};

async function card(categoryId: number, opts: CardOpts = {}) {
  seq += 1;
  return db.flashcard.create({
    data: {
      categoryId,
      authorId: opts.authorId ?? null,
      question: opts.question ?? `Pytanie ${seq}?`,
      answer: `Odpowiedź ${seq}.`,
      status: opts.status ?? "PENDING",
      submittedAt: opts.submittedAt ?? new Date(),
    },
  });
}

async function decide(
  flashcardId: number,
  decision: "APPROVED" | "REJECTED",
  opts: { reason?: string | null; decidedAt?: Date; decidedById?: number } = {},
) {
  return db.moderationDecision.create({
    data: {
      flashcardId,
      decision,
      reason: opts.reason ?? null,
      decidedById: opts.decidedById,
      decidedAt: opts.decidedAt ?? new Date(),
    },
  });
}

let php: number;
let react: number;
let ts: number;

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  php = (await createCategory("PHP", 1)).id;
  react = (await createCategory("React", 2)).id;
  ts = (await createCategory("TypeScript", 3)).id;
});

describe("SCR-15 — an administration address (NFR-01, DEC-57, AC-20.9)", () => {
  it("a Guest is redirected, a User gets the 403, an Administrator gets the dashboard", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(open)).kind).toBe("redirect");
    await signedInWithRow(authMock, "USER");
    expect((await refusalFrom(open)).kind).toBe("forbidden");
    await signedInWithRow(authMock, "ADMIN");
    const overview = await overviewOf();
    expect(overview).toMatchObject({ pending: { count: 0, oldestAt: null } });
  });
});

describe("Figures reconcile against a direct count (AC-20.1, 20.4, 20.7)", () => {
  it("pending, approved, rejected, rejectedWithReason, categories and the newest-five all match", async () => {
    await signedInWithRow(authMock, "ADMIN");
    const author = await makeUser("author1", "USER", new Date("2026-01-02"));
    const day = (n: number) => new Date(Date.UTC(2026, 8, 1 + n));

    for (let i = 0; i < 6; i += 1) {
      await card(php, { status: "PENDING", submittedAt: day(i), authorId: author.id, question: `Pytanie ${i}?` });
    }
    for (let i = 0; i < 4; i += 1) await card(php, { status: "APPROVED" });
    for (let i = 0; i < 2; i += 1) await card(react, { status: "APPROVED" });

    const rejectedWithReason = await card(react, { status: "REJECTED" });
    await decide(rejectedWithReason.id, "REJECTED", { reason: "zła odpowiedź", decidedById: 7 });
    const rejectedNoReason = await card(ts, { status: "REJECTED" });
    await decide(rejectedNoReason.id, "REJECTED", { reason: null, decidedById: 7 });

    const overview = await overviewOf();
    expect(overview.pending).toMatchObject({ count: 6, oldestAt: day(0) });
    expect(overview.approved).toBe(6);
    expect(overview.rejected).toBe(2);
    expect(overview.rejectedWithReason).toBe(1);
    expect(overview.categories).toMatchObject({ count: 3, largest: { name: "PHP", count: 4 } });
    expect(overview.users).toMatchObject({ total: 2, admins: 1 });
    expect(overview.latest.map((row) => row.question)).toEqual([
      "Pytanie 5?",
      "Pytanie 4?",
      "Pytanie 3?",
      "Pytanie 2?",
      "Pytanie 1?",
    ]);
    expect(overview.latest.every((row) => row.author === "author1")).toBe(true);
  });

  it("the three newest accounts, newest first, whoever they are (API-25 newUsers)", async () => {
    await signedInWithRow(authMock, "ADMIN");
    await makeUser("u1", "USER", new Date(Date.now() - 4 * 86_400_000));
    await makeUser("u2", "USER", new Date(Date.now() - 3 * 86_400_000));
    await makeUser("u3", "USER", new Date(Date.now() - 2 * 86_400_000));
    await makeUser("u4", "USER", new Date(Date.now() - 1 * 86_400_000));

    const overview = await overviewOf();
    expect(overview.newUsers.map((row) => row.nickname)).toEqual(["person", "u4", "u3"]);
  });
});

describe("Decisions — the weekly average (AC-20.5, DEC-55)", () => {
  it("is the mean of decision minus submission over this week's decisions, one decimal", async () => {
    await signedInWithRow(authMock, "ADMIN");
    const { start } = weekBounds(new Date());
    const day = (n: number) => new Date(start.getTime() + n * 86_400_000);

    const approvedOne = await card(php, { status: "APPROVED", submittedAt: start });
    await decide(approvedOne.id, "APPROVED", { decidedAt: day(1), decidedById: 7 });
    const rejectedOne = await card(php, { status: "REJECTED", submittedAt: start });
    await decide(rejectedOne.id, "REJECTED", { reason: "zła", decidedAt: day(2), decidedById: 7 });
    const approvedTwo = await card(php, { status: "APPROVED", submittedAt: start });
    await decide(approvedTwo.id, "APPROVED", { decidedAt: day(3), decidedById: 7 });

    const overview = await overviewOf();
    expect(overview.weekDecisions.approved).toBe(2);
    expect(overview.weekDecisions.rejected).toBe(1);
    expect(overview.weekDecisions.averageDays).toBeCloseTo(2, 5);
  });

  it("an empty week reads zero, zero and null — the 'no decision' boundary (AC-20.5)", async () => {
    await signedInWithRow(authMock, "ADMIN");
    const overview = await overviewOf();
    expect(overview.weekDecisions).toEqual({ approved: 0, rejected: 0, averageDays: null });
  });
});

describe("Nothing pending (AC-20.8)", () => {
  it("reads a zero tile and an empty newest-submissions list", async () => {
    await signedInWithRow(authMock, "ADMIN");
    await card(php, { status: "APPROVED" });
    const overview = await overviewOf();
    expect(overview.pending).toEqual({ count: 0, oldestAt: null });
    expect(overview.latest).toEqual([]);
  });
});
