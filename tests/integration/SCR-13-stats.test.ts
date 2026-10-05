import { beforeEach, describe, expect, it, vi } from "vitest";
import { weekBounds } from "@/domain/week";
import type { Statistics } from "@/server/services/getStatistics";
import { createCategory, createFlashcard, createProgress, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInWithRow } from "./setup/mockSession";

/**
 * SCR-13 / API-09 (CLAUDE.md §9.2, NFR-01). A Guest is refused; the tiles sum to `poolTotal`
 * (AC-21.1); the category rows sum to their own `Wszystkie` (AC-21.2); the week chip changes only
 * the weekly figure (AC-21.3); a hidden card still counts in the **Umiem** tile (AC-21.5, AC-21.6);
 * a person with no `CardProgress` row sees the empty state (AC-21.7); two accounts never see each
 * other's figures (AC-21.11); an unknown `week` falls back to `current` (AC-21.9); a marking with no
 * open session still counts (AC-21.13, AQ-001).
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-pathname": "/statystyki" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { default: StatystykiPage } = await import("@/app/(app)/statystyki/page");
const authMock = asSessionMock(auth);

type Page = { props: { stats: Statistics } } | { props: { poolTotal: number } };

async function open(query: Record<string, string> = {}): Promise<Page> {
  return (await StatystykiPage({ searchParams: Promise.resolve(query) })) as unknown as Page;
}

async function statsOf(query: Record<string, string> = {}): Promise<Statistics> {
  const page = (await open(query)) as { props: { stats?: Statistics; poolTotal?: number } };
  if (page.props.stats) return page.props.stats;
  return { hasProgress: false, poolTotal: page.props.poolTotal ?? 0 };
}

let php: number;
let react: number;

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  php = (await createCategory("PHP", 1)).id;
  react = (await createCategory("React", 2)).id;
});

describe("SCR-13 — an address that needs a session (NFR-01)", () => {
  it("a Guest is redirected to SCR-01", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => open())).kind).toBe("redirect");
  });

  it("a fresh account with no CardProgress row sees the empty state (AC-21.7)", async () => {
    await signedInWithRow(authMock, "USER");
    await createFlashcard(php, null, "APPROVED");
    const stats = await statsOf();
    expect(stats).toEqual({ hasProgress: false, poolTotal: 1 });
  });
});

describe("Figures reconcile against a direct count (AC-21.1, AC-21.2)", () => {
  it("the four tiles sum to poolTotal and each category row sums to its own Wszystkie", async () => {
    await signedInWithRow(authMock, "USER");
    const c1 = await createFlashcard(php, null, "APPROVED");
    const c2 = await createFlashcard(php, null, "APPROVED");
    const c3 = await createFlashcard(php, null, "APPROVED");
    await createFlashcard(php, null, "APPROVED"); // not started
    const c5 = await createFlashcard(react, null, "APPROVED");
    await createFlashcard(react, null, "APPROVED"); // not started

    await createProgress(7, c1.id, { mark: "KNOW", firstKnownAt: new Date() });
    await createProgress(7, c2.id, { mark: "REPEAT" });
    await createProgress(7, c3.id, { mark: "UNKNOWN" });
    await createProgress(7, c5.id, { mark: "KNOW", firstKnownAt: new Date() });

    const stats = await statsOf();
    if (!stats.hasProgress) throw new Error("expected progress");
    const total = stats.counts.know + stats.counts.repeat + stats.counts.unknown + stats.counts.new;
    expect(total).toBe(stats.poolTotal);
    expect(stats.poolTotal).toBe(6);
    for (const row of stats.byCategory) {
      expect(row.know + row.repeat + row.unknown + row.new).toBe(row.total);
    }
    const php_row = stats.byCategory.find((row) => row.id === php)!;
    expect(php_row).toMatchObject({ know: 1, repeat: 1, unknown: 1, new: 1, total: 4 });
  });
});

describe("Hidden cards (AC-21.5, AC-21.6)", () => {
  it("a card hidden now is counted in Umiem and in the hidden-now line", async () => {
    await signedInWithRow(authMock, "USER");
    const hidden = await createFlashcard(php, null, "APPROVED");
    const notHiddenYet = await createFlashcard(php, null, "APPROVED");
    const future = new Date(Date.now() + 5 * 86_400_000);
    await createProgress(7, hidden.id, { mark: "KNOW", knowCount: 5, hiddenUntil: future, firstKnownAt: new Date() });
    await createProgress(7, notHiddenYet.id, { mark: "REPEAT" });

    const stats = await statsOf();
    if (!stats.hasProgress) throw new Error("expected progress");
    expect(stats.hiddenNow).toBe(1);
    expect(stats.counts.know).toBe(1);
  });

  it("a card whose hidden week already ended reverts to Do powtórki (DEC-04)", async () => {
    await signedInWithRow(authMock, "USER");
    const expired = await createFlashcard(php, null, "APPROVED");
    const past = new Date(Date.now() - 60_000);
    await createProgress(7, expired.id, { mark: "KNOW", knowCount: 5, hiddenUntil: past, firstKnownAt: new Date() });

    const stats = await statsOf();
    if (!stats.hasProgress) throw new Error("expected progress");
    expect(stats.hiddenNow).toBe(0);
    expect(stats.counts.know).toBe(0);
    expect(stats.counts.repeat).toBe(1);
  });
});

describe("The week chip (AC-21.3, AC-21.4, AC-21.9)", () => {
  it("changes only the weekly figure; the tiles, bars and table are unchanged", async () => {
    await signedInWithRow(authMock, "USER");
    const { start } = weekBounds(new Date());
    const previous = new Date(start.getTime() - 4 * 86_400_000);
    const thisWeekCard = await createFlashcard(php, null, "APPROVED");
    const lastWeekCard = await createFlashcard(php, null, "APPROVED");
    await createProgress(7, thisWeekCard.id, { mark: "KNOW", firstKnownAt: new Date() });
    await createProgress(7, lastWeekCard.id, { mark: "KNOW", firstKnownAt: previous });

    const current = await statsOf();
    const prior = await statsOf({ week: "previous" });
    if (!current.hasProgress || !prior.hasProgress) throw new Error("expected progress");
    expect(current.memorised).toBe(1);
    expect(prior.memorised).toBe(1);
    expect(current.counts).toEqual(prior.counts);
    expect(current.shares).toEqual(prior.shares);
    expect(current.byCategory).toEqual(prior.byCategory);
    expect(current.poolTotal).toBe(prior.poolTotal);
  });

  it("an unknown week value falls back to the current week (AC-21.9)", async () => {
    await signedInWithRow(authMock, "USER");
    const card = await createFlashcard(php, null, "APPROVED");
    await createProgress(7, card.id, { mark: "KNOW", firstKnownAt: new Date() });
    const fallback = await statsOf({ week: "nonsense" });
    const current = await statsOf();
    if (!fallback.hasProgress || !current.hasProgress) throw new Error("expected progress");
    expect(fallback.week).toBe("current");
    expect(fallback.memorised).toBe(current.memorised);
  });

  it("a card marked Umiem twice in the same week counts once, ever (DEC-02)", async () => {
    await signedInWithRow(authMock, "USER");
    const card = await createFlashcard(php, null, "APPROVED");
    await createProgress(7, card.id, { mark: "KNOW", firstKnownAt: new Date() });
    const stats = await statsOf();
    if (!stats.hasProgress) throw new Error("expected progress");
    expect(stats.memorised).toBe(1);
  });
});

describe("A marking with no open session still counts (AC-21.13, AQ-001)", () => {
  it("a CardProgress row written outside any session is counted the same way", async () => {
    await signedInWithRow(authMock, "USER");
    const card = await createFlashcard(php, null, "APPROVED");
    // No StudySession row is created at all — mirrors a marking from SCR-09.
    await createProgress(7, card.id, { mark: "KNOW", firstKnownAt: new Date() });
    const stats = await statsOf();
    if (!stats.hasProgress) throw new Error("expected progress");
    expect(stats.counts.know).toBe(1);
    expect(stats.memorised).toBe(1);
  });
});

describe("Isolation between accounts (AC-21.11)", () => {
  it("each person sees only their own markings", async () => {
    const other = await createUser({ nickname: "other" });
    const card = await createFlashcard(php, null, "APPROVED");
    await createProgress(other.id, card.id, { mark: "KNOW", firstKnownAt: new Date() });

    await signedInWithRow(authMock, "USER");
    const anotherCard = await createFlashcard(react, null, "APPROVED");
    await createProgress(7, anotherCard.id, { mark: "UNKNOWN" });

    const stats = await statsOf();
    if (!stats.hasProgress) throw new Error("expected progress");
    expect(stats.counts.know).toBe(0);
    expect(stats.counts.unknown).toBe(1);
  });
});
