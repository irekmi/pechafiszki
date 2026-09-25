import { beforeEach, describe, expect, it, vi } from "vitest";
import { expireHide } from "@/domain/hide";
import { foldText } from "@/domain/matchesQuery";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createProgress, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInSession } from "./setup/mockSession";

/**
 * SCR-08 / API-06 — the flashcard library: the row cap and parameter validation (NFR-04), that no
 * unapproved card is ever listed (REQ-01, CLAUDE.md §8), the diacritic-insensitive search (DEC-49),
 * the DEC-50 sort, the hide date (DEC-11) and the Guest refusal (NFR-01). Real database.
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-pathname": "/fiszki" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const FiszkiPage = (await import("@/app/(app)/fiszki/page")).default;
const { listFlashcards } = await import("@/server/services/listFlashcards");
const { parseLibraryParams } = await import("@/server/services/libraryParams");
const authMock = asSessionMock(auth);

const list = (userId: number, raw: Record<string, string> = {}) => listFlashcards(userId, parseLibraryParams(raw));
const questions = async (userId: number, raw: Record<string, string> = {}) =>
  (await list(userId, raw)).rows.map((row) => row.question);

let userId: number;
let categoryId: number;

async function card(question: string, extra: { answer?: string; codeExample?: string; status?: "PENDING" | "APPROVED" | "REJECTED"; categoryId?: number; submittedAt?: Date } = {}) {
  return db.flashcard.create({
    data: {
      categoryId: extra.categoryId ?? categoryId,
      question,
      answer: extra.answer ?? "Odpowiedź.",
      codeExample: extra.codeExample ?? null,
      status: extra.status ?? "APPROVED",
      authorId: userId,
      ...(extra.submittedAt ? { submittedAt: extra.submittedAt } : {}),
    },
  });
}

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  categoryId = (await createCategory("PHP", 1)).id;
  userId = (await createUser()).id;
});

describe("SCR-08 — access (NFR-01)", () => {
  it("redirects a Guest to SCR-01, carrying the address", async () => {
    authMock.mockResolvedValue(null);
    const refusal = await refusalFrom(() => FiszkiPage({ searchParams: Promise.resolve({}) }));
    expect(refusal.kind).toBe("redirect");
    expect(refusal.target).toContain("/logowanie");
  });

  it("renders for a User and for an Administrator, with a hand-made URL too", async () => {
    await createUser({ role: "ADMIN" });
    for (const role of ["USER", "ADMIN"] as const) {
      authMock.mockResolvedValue({ ...signedInSession(role), user: { ...signedInSession(role).user, id: String(userId) } });
      await expect(
        FiszkiPage({ searchParams: Promise.resolve({ limit: "100000", mark: "nonsense", category: "abc" }) }),
      ).resolves.toBeTruthy();
    }
  });
});

describe("SCR-08 — only approved cards (REQ-01, AC-11.1)", () => {
  it("never lists a pending or rejected card, not even the caller's own", async () => {
    await card("Zatwierdzona?");
    await card("Oczekująca?", { status: "PENDING" });
    await card("Odrzucona?", { status: "REJECTED" });
    const page = await list(userId);
    expect(page.rows.map((row) => row.question)).toEqual(["Zatwierdzona?"]);
    expect(page.total).toBe(1);
    expect((await list((await createUser({ role: "ADMIN" })).id)).total).toBe(1);
    expect(await questions(userId, { mark: "new" })).toEqual(["Zatwierdzona?"]);
    expect(await questions(userId, { query: "Oczekuj" })).toEqual([]);
  });
});

describe("SCR-08 — the row cap and paging (NFR-04, AC-11.2, AC-11.9)", () => {
  beforeEach(async () => {
    await db.flashcard.createMany({
      data: Array.from({ length: 230 }, (_, i) => ({
        categoryId,
        question: `Pytanie ${i}?`,
        answer: "Odp.",
        status: "APPROVED" as const,
        authorId: userId,
      })),
    });
  });

  it("returns 20 rows by default, with shown and total", async () => {
    const page = await list(userId);
    expect(page.rows).toHaveLength(20);
    expect(page.shown).toBe(20);
    expect(page.total).toBe(230);
  });

  it("raises the cap 20 at a time and never past 200", async () => {
    expect((await list(userId, { limit: "60" })).rows).toHaveLength(60);
    expect((await list(userId, { limit: "100000" })).rows).toHaveLength(200);
    expect((await list(userId, { limit: "100000" })).total).toBe(230);
  });

  it("falls back to the default page for an unusable limit and mark", async () => {
    const page = await list(userId, { limit: "abc", mark: "nonsense", sort: "random" });
    expect(page.rows).toHaveLength(20);
    expect(page.total).toBe(230);
  });

  it("pages stably: the second page continues where the first stopped", async () => {
    const first = await questions(userId, { limit: "20" });
    const both = await questions(userId, { limit: "40" });
    expect(both.slice(0, 20)).toEqual(first);
    expect(new Set(both).size).toBe(40);
  });
});

describe("SCR-08 — filters", () => {
  it("filters by category; an unknown id is an empty result, not an error", async () => {
    const other = await createCategory("React", 2);
    await card("W PHP?");
    await card("W React?", { categoryId: other.id });
    expect(await questions(userId, { category: String(other.id) })).toEqual(["W React?"]);
    expect(await list(userId, { category: "9999" })).toMatchObject({ rows: [], total: 0 });
  });

  it("filters by the caller's own marking, and 'new' means no CardProgress row", async () => {
    const [a, b, c, d] = [await card("A?"), await card("B?"), await card("C?"), await card("D?")];
    await createProgress(userId, a.id, { mark: "KNOW" });
    await createProgress(userId, b.id, { mark: "REPEAT" });
    await createProgress(userId, c.id, { mark: "UNKNOWN" });
    const stranger = await createUser();
    await createProgress(stranger.id, d.id, { mark: "KNOW" });
    expect(await questions(userId, { mark: "know" })).toEqual(["A?"]);
    expect(await questions(userId, { mark: "repeat" })).toEqual(["B?"]);
    expect(await questions(userId, { mark: "unknown" })).toEqual(["C?"]);
    expect(await questions(userId, { mark: "new" })).toEqual(["D?"]);
    expect((await list(userId, { mark: "know" })).total).toBe(1);
  });
});

describe("SCR-08 — search (DEC-49, AC-11.4)", () => {
  it("finds 'domknięcie' from 'domkniecie', in either case, in question or answer", async () => {
    await card("Czym jest domknięcie?");
    await card("Inne pytanie?", { answer: "To jest DOMKNIĘCIE w praktyce." });
    await card("Zupełnie coś innego?");
    expect((await questions(userId, { query: "domkniecie" })).sort()).toEqual(["Czym jest domknięcie?", "Inne pytanie?"]);
    expect(await questions(userId, { query: "ŁÓDŹ" })).toEqual([]);
  });

  it("folds ł, ó, ż and the rest of the Polish alphabet the way the domain function does", async () => {
    const letters = "ąćęłńóśźżĄĆĘŁŃÓŚŹŻ";
    const rows = await db.$queryRaw<{ folded: string }[]>`SELECT fold_text(${letters}) AS "folded"`;
    expect(rows[0]?.folded).toBe(foldText(letters));
  });

  it("does not search the code example", async () => {
    await card("Pytanie?", { codeExample: "const unikalnyKod = 1;" });
    expect(await questions(userId, { query: "unikalnyKod" })).toEqual([]);
  });

  it("treats % and _ as text, not as wildcards", async () => {
    await card("Rabat 50% na wszystko?");
    await card("Pytanie bez procentu?");
    expect(await questions(userId, { query: "50%" })).toEqual(["Rabat 50% na wszystko?"]);
    expect(await questions(userId, { query: "%" })).toEqual(["Rabat 50% na wszystko?"]);
    expect(await questions(userId, { query: "_" })).toEqual([]);
  });

  it("is backed by the trigram expression index", async () => {
    const plan = await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL enable_seqscan = off");
      return tx.$queryRawUnsafe<{ "QUERY PLAN": string }[]>(
        `EXPLAIN SELECT id FROM "Flashcard" WHERE fold_text("question") LIKE '%domkn%'`,
      );
    });
    expect(plan.map((row) => row["QUERY PLAN"]).join("\n")).toContain("Flashcard_question_fold_idx");
  });
});

describe("SCR-08 — sorting (DEC-50)", () => {
  it("orders newest, oldest and by category", async () => {
    const react = await createCategory("React", 2);
    await card("Stara?", { submittedAt: new Date("2026-01-01T10:00:00Z") });
    await card("Nowa?", { submittedAt: new Date("2026-03-01T10:00:00Z"), categoryId: react.id });
    await card("Środkowa?", { submittedAt: new Date("2026-02-01T10:00:00Z") });
    expect(await questions(userId)).toEqual(["Nowa?", "Środkowa?", "Stara?"]);
    expect(await questions(userId, { sort: "oldest" })).toEqual(["Stara?", "Środkowa?", "Nowa?"]);
    expect(await questions(userId, { sort: "category" })).toEqual(["Środkowa?", "Stara?", "Nowa?"]);
  });

  it("puts Nie umiem, Do powtórki, Umiem, then Nie zaczęte, newest first inside each group", async () => {
    const day = (n: number) => new Date(`2026-02-0${n}T10:00:00Z`);
    const know = await card("Umiem 1?", { submittedAt: day(1) });
    const know2 = await card("Umiem 2?", { submittedAt: day(2) });
    const repeat = await card("Powtórka?", { submittedAt: day(3) });
    const unknown = await card("Nie umiem?", { submittedAt: day(4) });
    await card("Nowa?", { submittedAt: day(5) });
    await createProgress(userId, know.id, { mark: "KNOW" });
    await createProgress(userId, know2.id, { mark: "KNOW" });
    await createProgress(userId, repeat.id, { mark: "REPEAT" });
    await createProgress(userId, unknown.id, { mark: "UNKNOWN" });
    expect(await questions(userId, { sort: "mark" })).toEqual([
      "Nie umiem?",
      "Powtórka?",
      "Umiem 2?",
      "Umiem 1?",
      "Nowa?",
    ]);
  });
});

describe("SCR-08 — hidden cards (DEC-11, DEC-04, AC-11.6)", () => {
  const week = 7 * 24 * 3600 * 1000;

  it("lists a hidden card with its return date", async () => {
    const hidden = await card("Ukryta?");
    const until = new Date(Date.now() + week);
    await createProgress(userId, hidden.id, { mark: "KNOW", knowCount: 5, hiddenUntil: until });
    const [row] = (await list(userId)).rows;
    expect(row).toMatchObject({ question: "Ukryta?", mark: "know" });
    expect(row?.hiddenUntil?.getTime()).toBe(until.getTime());
  });

  it("reads a card whose week has ended as Do powtórki, exactly as expireHide does", async () => {
    const expired = await card("Wygasła?");
    const until = new Date(Date.now() - 1000);
    const record = await createProgress(userId, expired.id, { mark: "KNOW", knowCount: 5, hiddenUntil: until });
    const [row] = (await list(userId)).rows;
    expect(row).toMatchObject({ mark: "repeat", hiddenUntil: null });
    expect(row?.mark).toBe(expireHide(record, new Date()).mark.toLowerCase());
    expect(await questions(userId, { mark: "repeat" })).toEqual(["Wygasła?"]);
    expect(await questions(userId, { mark: "know" })).toEqual([]);
  });
});

describe("SCR-08 — the row", () => {
  it("carries category, author, date, and a deleted author is null", async () => {
    const authored = await card("Autorska?");
    await db.flashcard.update({ where: { id: authored.id }, data: { authorId: null } });
    const [row] = (await list(userId)).rows;
    expect(row).toMatchObject({ category: "PHP", author: null, mark: "new", hiddenUntil: null });
    expect(row?.submittedAt).toBeInstanceOf(Date);
    await createFlashcard(categoryId, userId);
    expect((await list(userId)).total).toBe(2);
  });
});
