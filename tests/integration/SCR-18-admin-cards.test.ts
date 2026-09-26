import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createProgress, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * SCR-18 / API-24 and API-23 from the table (CLAUDE.md §9.2, §8). The page and the delete action are
 * exercised as Guest, User and Administrator, asserting the refusal and that nothing was deleted
 * (AC-17.8); the row cap, the three status counts, the folded search, the four sorts and the latest
 * rejection reason are read straight off the screen's props (AC-17.1, 17.4–17.7, DEC-48, DEC-49).
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/administracja/fiszki" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { default: AdminCardsPage } = await import("@/app/(admin)/administracja/fiszki/page");
const { deleteFlashcardAction } = await import("@/server/actions/deleteFlashcard");
const authMock = asSessionMock(auth);

type Person = { id: number; role: "USER" | "ADMIN"; nickname: string };
type Status = "PENDING" | "APPROVED" | "REJECTED";
type Row = { id: number; question: string; excerpt: string; reason: string | null; author: string | null; status: Status; category: string };
type Screen = { props: { page: { rows: Row[]; shown: number; total: number; counts: { approved: number; pending: number; rejected: number } } } };

function signInAs(user: Person): void {
  authMock.mockResolvedValue({
    user: { id: String(user.id), email: `${user.nickname}@example.test`, nickname: user.nickname, role: user.role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session);
}

let php: number;
let react: number;
let learner: Person;
let admin: Person;
const open = (search: Record<string, string> = {}) => AdminCardsPage({ searchParams: Promise.resolve(search) });
const load = async (search: Record<string, string> = {}) => ((await open(search)) as unknown as Screen).props.page;
const card = (data: { question: string; answer?: string; status?: Status; categoryId?: number; authorId?: number | null; submittedAt?: Date }) =>
  db.flashcard.create({
    data: { categoryId: php, authorId: learner.id, answer: "Odpowiedź.", status: "APPROVED", ...data },
  });

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  php = (await createCategory("PHP", 2)).id;
  react = (await createCategory("React", 1)).id;
  learner = await createUser();
  admin = await createUser({ role: "ADMIN" });
});

describe("SCR-18 — an administration address (NFR-01, DEC-57, AC-17.8)", () => {
  it("a Guest is redirected, a User gets the 403, an Administrator gets the table", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => open())).kind).toBe("redirect");
    signInAs(learner);
    expect((await refusalFrom(() => open())).kind).toBe("forbidden");
    signInAs(admin);
    expect(await load()).toMatchObject({ total: 0, shown: 0 });
  });

  it("a forged role in the address does not open it for a User", async () => {
    signInAs(learner);
    expect((await refusalFrom(() => open({ role: "ADMIN", admin: "1" }))).kind).toBe("forbidden");
  });
});

describe("API-23 from SCR-18 — Usuń is the Administrator's alone (AC-17.3, AC-17.8)", () => {
  it.each([
    ["a Guest", () => authMock.mockResolvedValue(null), "redirect"],
    ["a User", () => signInAs(learner), "forbidden"],
  ])("%s is refused, even with stay and a forged role; the card, progress and events stay", async (_who, sign, kind) => {
    const target = await createFlashcard(php, learner.id, "APPROVED");
    await createProgress(learner.id, target.id);
    sign();
    expect((await refusalFrom(() => deleteFlashcardAction({ id: target.id, stay: true, role: "ADMIN" }))).kind).toBe(kind);
    expect(await db.flashcard.count({ where: { id: target.id } })).toBe(1);
    expect(await db.cardProgress.count({ where: { flashcardId: target.id } })).toBe(1);
  });

  it("an Administrator deletes in place: both learners' progress and events cascade, a second call is SCR-22", async () => {
    const other = await createUser();
    const target = await card({ question: "Do usunięcia?" });
    for (const person of [learner, other]) {
      await createProgress(person.id, target.id);
      await db.reviewEvent.create({ data: { userId: person.id, flashcardId: target.id, mark: "KNOW" } });
    }
    signInAs(admin);
    expect(await deleteFlashcardAction({ id: target.id, stay: true })).toEqual({ ok: true });
    expect(await db.flashcard.count({ where: { id: target.id } })).toBe(0);
    expect(await db.cardProgress.count()).toBe(0);
    expect(await db.reviewEvent.count()).toBe(0);
    expect((await refusalFrom(() => deleteFlashcardAction({ id: target.id, stay: true }))).kind).toBe("notFound");
    expect((await load()).total).toBe(0);
  });

  it("a malformed body is SCR-22's 404 and deletes nothing", async () => {
    const target = await card({ question: "Zostaje?" });
    signInAs(admin);
    for (const body of [{ id: "1" }, { id: 0 }, { id: 1.5 }, { id: target.id, stay: "yes" }, null, "x"]) {
      expect((await refusalFrom(() => deleteFlashcardAction(body))).kind).toBe("notFound");
    }
    expect(await db.flashcard.count()).toBe(1);
  });
});

describe("API-24 — every status, counted (AC-17.1)", () => {
  it("lists cards of all three statuses; the three counts sum to the total and ignore the filters", async () => {
    await card({ question: "A?", status: "APPROVED" });
    await card({ question: "B?", status: "APPROVED" });
    await card({ question: "C?", status: "PENDING" });
    await card({ question: "D?", status: "REJECTED" });
    signInAs(admin);
    const all = await load();
    expect(all.rows.map((row) => row.status).sort()).toEqual(["APPROVED", "APPROVED", "PENDING", "REJECTED"]);
    expect(all.counts).toEqual({ approved: 2, pending: 1, rejected: 1 });
    const pending = await load({ status: "pending" });
    expect(pending).toMatchObject({ total: 1, shown: 1, counts: { approved: 2, pending: 1, rejected: 1 } });
    expect(pending.rows[0]?.question).toBe("C?");
  });

  it("filters by category; an unknown category id matches nothing", async () => {
    await card({ question: "PHP?", categoryId: php });
    await card({ question: "React?", categoryId: react });
    signInAs(admin);
    expect((await load({ category: String(react) })).rows.map((row) => row.question)).toEqual(["React?"]);
    expect((await load({ category: "999999" })).total).toBe(0);
  });
});

describe("API-24 — the row cap (AC-17.4, DEC-48, NFR-04)", () => {
  beforeEach(async () => {
    const data = Array.from({ length: 205 }, (_, index) => ({
      categoryId: php,
      authorId: learner.id,
      question: `Pytanie ${index}?`,
      answer: "Odpowiedź.",
      status: "APPROVED" as const,
      submittedAt: new Date(2026, 0, 1, 0, 0, index),
    }));
    await db.flashcard.createMany({ data });
    signInAs(admin);
  });

  it("holds 20 rows by default, 40 for limit=40, and total stays the whole match", async () => {
    expect(await load()).toMatchObject({ shown: 20, total: 205 });
    expect(await load({ limit: "40" })).toMatchObject({ shown: 40, total: 205 });
  });

  it("caps limit at 200 and falls back to 20 for anything that is not a positive multiple of 20", async () => {
    expect((await load({ limit: "5000" })).shown).toBe(200);
    for (const limit of ["25", "0", "-20", "abc", "20.5", ""]) {
      expect((await load({ limit })).shown).toBe(20);
    }
  });

  it("pages stably: the first 40 rows extend the first 20 in the same order", async () => {
    const first = (await load()).rows.map((row) => row.id);
    const more = (await load({ limit: "40" })).rows.map((row) => row.id);
    expect(more.slice(0, 20)).toEqual(first);
  });
});

describe("API-24 — search over question and answer, folded (AC-17.5, DEC-49, ISS-12)", () => {
  beforeEach(async () => {
    await card({ question: "Czym jest domknięcie?", answer: "Funkcja z zakresem." });
    await card({ question: "Co to indeks?", answer: "Struktura przyspieszająca zapytania — ŻÓŁW." });
    await card({ question: "Rabat 100% i a_b", answer: "Literały." });
    signInAs(admin);
  });
  const found = async (query: string) => (await load({ query })).rows.map((row) => row.question);

  it("matches with and without diacritics, in either case, in the question or the answer", async () => {
    for (const query of ["domknięcie", "domkniecie", "DOMKNIĘCIE", "  domknie "]) expect(await found(query)).toEqual(["Czym jest domknięcie?"]);
    expect(await found("zolw")).toEqual(["Co to indeks?"]);
    expect(await found("przyspieszajaca")).toEqual(["Co to indeks?"]);
  });

  it("treats % and _ as characters, not wildcards", async () => {
    expect(await found("100%")).toEqual(["Rabat 100% i a_b"]);
    expect(await found("a_b")).toEqual(["Rabat 100% i a_b"]);
    expect(await found("%")).toEqual(["Rabat 100% i a_b"]);
    expect(await found("d_mknięcie")).toEqual([]);
    expect(await found("'; DROP TABLE \"Flashcard\"; --")).toEqual([]);
    expect(await db.flashcard.count()).toBe(3);
  });

  it("ignores a NUL byte and an over-long phrase instead of failing", async () => {
    expect(await found("dom\0knięcie")).toEqual(["Czym jest domknięcie?"]);
    expect((await load({ query: "x".repeat(101) })).total).toBe(3);
  });
});

describe("API-24 — the four sorts (AC-17.6)", () => {
  it("Autor orders by nickname, case-insensitively, a deleted author last — not by id", async () => {
    const [zed, alpha, bravo] = [
      await createUser({ nickname: "zed" }),
      await createUser({ nickname: "Alpha" }),
      await createUser({ nickname: "bravo" }),
    ];
    await card({ question: "od zed?", authorId: zed.id });
    await card({ question: "od alpha?", authorId: alpha.id });
    await card({ question: "od nikogo?", authorId: null });
    await card({ question: "od bravo?", authorId: bravo.id });
    signInAs(admin);
    expect((await load({ sort: "author" })).rows.map((row) => row.author)).toEqual(["Alpha", "bravo", "zed", null]);
  });

  it("Kategoria follows the administrator's category order; Najstarsze reverses Najnowsze", async () => {
    const old = await card({ question: "stare?", categoryId: php, submittedAt: new Date("2026-01-01") });
    const fresh = await card({ question: "nowe?", categoryId: react, submittedAt: new Date("2026-02-01") });
    signInAs(admin);
    expect((await load({ sort: "category" })).rows.map((row) => row.id)).toEqual([fresh.id, old.id]);
    expect((await load()).rows.map((row) => row.id)).toEqual([fresh.id, old.id]);
    expect((await load({ sort: "oldest" })).rows.map((row) => row.id)).toEqual([old.id, fresh.id]);
    expect((await load({ sort: "nonsense" })).rows.map((row) => row.id)).toEqual([fresh.id, old.id]);
  });
});

describe("API-24 — the sub-line (AC-17.7, ENT-04)", () => {
  it("a rejected row carries its latest rejection reason; the others carry the answer excerpt", async () => {
    const rejected = await card({ question: "Odrzucona?", status: "REJECTED" });
    const pending = await card({ question: "Czeka?", status: "PENDING", answer: "Długa odpowiedź. ".repeat(20) });
    const decide = (reason: string, decidedAt: string) =>
      db.moderationDecision.create({
        data: { flashcardId: rejected.id, decision: "REJECTED", reason, decidedById: admin.id, decidedAt: new Date(decidedAt) },
      });
    await decide("stary powód", "2026-03-01");
    await decide("<b>nowy</b> powód", "2026-03-02");
    signInAs(admin);
    const rows = (await load()).rows;
    expect(rows.find((row) => row.id === rejected.id)).toMatchObject({ reason: "<b>nowy</b> powód" });
    const waiting = rows.find((row) => row.id === pending.id);
    expect(waiting?.reason).toBeNull();
    expect(waiting?.excerpt.length).toBeLessThanOrEqual(81);
    expect(waiting?.excerpt.endsWith("…")).toBe(true);
  });
});
