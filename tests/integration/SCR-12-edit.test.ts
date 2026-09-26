import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createProgress, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * SCR-12 / API-17, API-18, API-22, API-23 — edit and delete a flashcard (CLAUDE.md §9.2, §8). Each of
 * the four actions and the page are exercised as Guest, as a User (the author and somebody else) and as
 * an Administrator, on a Pending, a Rejected and an Approved card, asserting the refusal and that nothing
 * was written (AC-16.3, 16.7, 16.10). The resubmission keeps the earlier decision (DEC-30, DEC-31); an
 * approval that got in first is refused, not merged (DEC-58); deletion cascades (DEC-37).
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/edytuj/1" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { updateOwnFlashcardAction } = await import("@/server/actions/updateOwnFlashcard");
const { adminUpdateFlashcardAction } = await import("@/server/actions/adminUpdateFlashcard");
const { deleteOwnFlashcardAction } = await import("@/server/actions/deleteOwnFlashcard");
const { deleteFlashcardAction } = await import("@/server/actions/deleteFlashcard");
const { default: EditPage } = await import("@/app/(app)/edytuj/[id]/page");
const { getEditCard } = await import("@/server/services/getEditCard");
const { approveFlashcard } = await import("@/server/services/approveFlashcard");
const { rejectFlashcard } = await import("@/server/services/rejectFlashcard");
const authMock = asSessionMock(auth);

type Person = { id: number; role: "USER" | "ADMIN"; nickname: string };
type Status = "PENDING" | "REJECTED" | "APPROVED";
const STATUSES: Status[] = ["PENDING", "REJECTED", "APPROVED"];

function signInAs(user: Person): void {
  authMock.mockResolvedValue({
    user: { id: String(user.id), email: `${user.nickname}@example.test`, nickname: user.nickname, role: user.role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session);
}

let php: number;
let react: number;
let author: Person;
let other: Person;
let admin: Person;
const cardOf = (id: number) => db.flashcard.findUnique({ where: { id } });
const decisions = () => db.moderationDecision.findMany({ orderBy: { id: "asc" } });
const cardIn = (status: Status, authorId: number | null = author.id) => createFlashcard(php, authorId, status);
const page = (id: number | string) => EditPage({ params: Promise.resolve({ id: String(id) }) });

function form(id: number | string, overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields = { id: String(id), category: String(react), question: "Nowe pytanie?", answer: "Nowa odpowiedź.", code_example: "", ...overrides };
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}
const state = { errors: {} };

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  php = (await createCategory("PHP", 1)).id;
  react = (await createCategory("React", 2)).id;
  author = await createUser();
  other = await createUser();
  admin = await createUser({ role: "ADMIN" });
});

describe("SCR-12 — the page (AC-16.3, AC-16.4, DEC-57)", () => {
  it("a Guest is redirected to SCR-01", async () => {
    const card = await cardIn("PENDING");
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => page(card.id))).kind).toBe("redirect");
  });

  it("the author opens their own Pending and Rejected card, never the Approved one", async () => {
    signInAs(author);
    for (const status of ["PENDING", "REJECTED"] as const) {
      const screen = await page((await cardIn(status)).id);
      expect(screen.props.isAdmin).toBe(false);
    }
    const approved = await cardIn("APPROVED");
    expect((await refusalFrom(() => page(approved.id))).kind).toBe("notFound");
  });

  it("another User, on a card in any status, gets exactly the answer of a missing or malformed id", async () => {
    signInAs(other);
    const missing = await refusalFrom(() => page(999_999));
    expect(await refusalFrom(() => page("abc"))).toEqual(missing);
    for (const status of STATUSES) {
      const card = await cardIn(status);
      expect(await refusalFrom(() => page(card.id))).toEqual(missing);
    }
    expect(missing.kind).toBe("notFound");
  });

  it("an Administrator opens any card in any status, and the screen knows the role from the session", async () => {
    signInAs(admin);
    for (const status of STATUSES) {
      const screen = await page((await cardIn(status)).id);
      expect(screen.props.isAdmin).toBe(true);
      expect(screen.props.edit.detail.card.status).toBe(status);
    }
  });

  it("a rejected card carries its latest decision and the deciding administrator", async () => {
    const card = await cardIn("PENDING");
    await rejectFlashcard(admin, card.id, "Popraw drugie zdanie.");
    signInAs(author);
    const { latest } = (await page(card.id)).props.edit;
    expect(latest).toMatchObject({ decision: "REJECTED", reason: "Popraw drugie zdanie.", decidedBy: admin.nickname });
  });
});

describe("API-17 updateOwnFlashcard (AC-16.1, AC-16.2, AC-16.10, DEC-30, DEC-31, DEC-58)", () => {
  it("a Guest is redirected and nothing is written", async () => {
    const card = await cardIn("REJECTED");
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => updateOwnFlashcardAction(state, form(card.id)))).kind).toBe("redirect");
    expect(await cardOf(card.id)).toEqual(card);
  });

  it.each(STATUSES)("somebody else's %s card is refused as a missing one, for a User and for an Administrator", async (status) => {
    const card = await cardIn(status);
    for (const caller of [other, admin]) {
      signInAs(caller);
      expect((await refusalFrom(() => updateOwnFlashcardAction(state, form(card.id)))).kind).toBe("notFound");
    }
    expect(await cardOf(card.id)).toEqual(card);
  });

  it("the author's save returns a Pending card to Pending, a Rejected one to Pending with decidedAt cleared", async () => {
    signInAs(author);
    for (const status of ["PENDING", "REJECTED"] as const) {
      const card = await cardIn(status);
      if (status === "REJECTED") await db.flashcard.update({ where: { id: card.id }, data: { decidedAt: new Date() } });
      const saved = await refusalFrom(() => updateOwnFlashcardAction(state, form(card.id, { code_example: "echo 1;" })));
      expect(saved).toMatchObject({ kind: "redirect", target: "/moje-fiszki?zmiana=zapisana" });
      expect(await cardOf(card.id)).toMatchObject({
        status: "PENDING", decidedAt: null, categoryId: react, question: "Nowe pytanie?", answer: "Nowa odpowiedź.", codeExample: "echo 1;",
        authorId: author.id,
      });
    }
  });

  it("the earlier rejection is kept, and the card is back in the queue (DEC-31, AC-16.1)", async () => {
    const card = await cardIn("PENDING");
    await rejectFlashcard(admin, card.id, "Za krótko.");
    signInAs(author);
    await refusalFrom(() => updateOwnFlashcardAction(state, form(card.id)));
    expect(await decisions()).toMatchObject([{ decision: "REJECTED", reason: "Za krótko.", decidedById: admin.id }]);
    await approveFlashcard(admin, card.id);
    expect((await decisions()).map((row) => row.decision)).toEqual(["REJECTED", "APPROVED"]);
  });

  it("the author's own Approved card is refused with the DEC-58 conflict and left untouched", async () => {
    const card = await cardIn("APPROVED");
    signInAs(author);
    expect(await updateOwnFlashcardAction(state, form(card.id))).toEqual({ errors: {}, conflict: true });
    expect(await cardOf(card.id)).toEqual(card);
  });

  it("a save racing an approval is refused, not merged (AC-16.6)", async () => {
    const card = await cardIn("PENDING");
    signInAs(author);
    expect(await getEditCard(author, card.id)).not.toBeNull();
    await approveFlashcard(admin, card.id);
    expect(await updateOwnFlashcardAction(state, form(card.id, { question: "Podmienione?" }))).toMatchObject({ conflict: true });
    expect(await cardOf(card.id)).toMatchObject({ status: "APPROVED", question: card.question });
    expect(await getEditCard(author, card.id)).toBeNull();
  });

  it("validation errors are returned per field and write nothing; a forged status or author is ignored", async () => {
    const card = await cardIn("REJECTED");
    signInAs(author);
    const bad = await updateOwnFlashcardAction(state, form(card.id, { question: " ", answer: "x".repeat(1201), category: "0" }));
    expect(Object.keys(bad.errors).sort()).toEqual(["answer", "category", "question"]);
    expect(await cardOf(card.id)).toEqual(card);
    const gone = await updateOwnFlashcardAction(state, form(card.id, { category: "999999" }));
    expect(gone.errors.category).toBeDefined();
    await refusalFrom(() => updateOwnFlashcardAction(state, form(card.id, { status: "APPROVED", authorId: String(other.id), role: "ADMIN" })));
    expect(await cardOf(card.id)).toMatchObject({ status: "PENDING", authorId: author.id });
  });

  it("a missing or malformed id is SCR-22's 404", async () => {
    signInAs(author);
    for (const id of [999_999, "abc", "", "-1"]) {
      expect((await refusalFrom(() => updateOwnFlashcardAction(state, form(id)))).kind).toBe("notFound");
    }
  });
});

describe("API-22 adminUpdateFlashcard (AC-16.4, AC-16.5, AC-16.10, DEC-34)", () => {
  it("a Guest is redirected and a User, the author included, is forbidden; nothing is written", async () => {
    const card = await cardIn("PENDING");
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => adminUpdateFlashcardAction(state, form(card.id)))).kind).toBe("redirect");
    for (const user of [author, other]) {
      signInAs(user);
      const refused = await refusalFrom(() => adminUpdateFlashcardAction(state, form(card.id, { intent: "approve" })));
      expect(refused.kind).toBe("forbidden");
    }
    expect(await cardOf(card.id)).toEqual(card);
    expect(await decisions()).toHaveLength(0);
  });

  it.each(STATUSES)("Zapisz zmiany on a %s card saves the text and leaves the status and decisions alone", async (status) => {
    const card = await cardIn(status);
    signInAs(admin);
    const result = await adminUpdateFlashcardAction(state, form(card.id));
    expect(result.saved).toEqual(expect.any(Number));
    expect(await cardOf(card.id)).toMatchObject({ status, decidedAt: card.decidedAt, question: "Nowe pytanie?", categoryId: react });
    expect(await decisions()).toHaveLength(0);
  });

  it.each(["PENDING", "REJECTED"] as const)("Zapisz i zatwierdź on a %s card saves, approves and writes a decision, landing on SCR-16", async (status) => {
    const card = await cardIn(status);
    signInAs(admin);
    const landed = await refusalFrom(() => adminUpdateFlashcardAction(state, form(card.id, { intent: "approve" })));
    expect(landed).toMatchObject({ kind: "redirect", target: "/administracja/oczekujace" });
    const saved = await cardOf(card.id);
    expect(saved).toMatchObject({ status: "APPROVED", question: "Nowe pytanie?", categoryId: react });
    expect(saved?.decidedAt).toBeInstanceOf(Date);
    expect(await decisions()).toMatchObject([{ flashcardId: card.id, decision: "APPROVED", decidedById: admin.id }]);
  });

  it("approving an already Approved card is refused and writes no decision", async () => {
    const card = await cardIn("APPROVED");
    signInAs(admin);
    expect(await adminUpdateFlashcardAction(state, form(card.id, { intent: "approve" }))).toMatchObject({ conflict: true });
    expect(await cardOf(card.id)).toEqual(card);
    expect(await decisions()).toHaveLength(0);
  });

  it("an unknown category, a missing card and invalid text are refused with nothing written", async () => {
    const card = await cardIn("PENDING");
    signInAs(admin);
    expect((await adminUpdateFlashcardAction(state, form(card.id, { category: "999999", intent: "approve" }))).errors.category).toBeDefined();
    expect((await adminUpdateFlashcardAction(state, form(card.id, { question: "" }))).errors.question).toBeDefined();
    expect((await refusalFrom(() => adminUpdateFlashcardAction(state, form(999_999)))).kind).toBe("notFound");
    expect((await refusalFrom(() => adminUpdateFlashcardAction(state, form(999_999, { intent: "approve" })))).kind).toBe("notFound");
    expect(await cardOf(card.id)).toEqual(card);
  });
});

describe("API-18 deleteOwnFlashcard (AC-16.7, AC-16.10, DEC-38)", () => {
  it("a Guest is redirected; another User and an Administrator who is not the author get the 404", async () => {
    for (const status of STATUSES) {
      const card = await cardIn(status);
      authMock.mockResolvedValue(null);
      expect((await refusalFrom(() => deleteOwnFlashcardAction({ id: card.id }))).kind).toBe("redirect");
      for (const caller of [other, admin]) {
        signInAs(caller);
        expect((await refusalFrom(() => deleteOwnFlashcardAction({ id: card.id }))).kind).toBe("notFound");
      }
      expect(await cardOf(card.id)).toEqual(card);
    }
  });

  it("the author removes their Pending or Rejected card, with its decisions, and lands on SCR-11", async () => {
    signInAs(author);
    for (const status of ["PENDING", "REJECTED"] as const) {
      const card = await cardIn(status);
      await db.moderationDecision.create({ data: { flashcardId: card.id, decision: "REJECTED", reason: "x", decidedById: admin.id } });
      expect(await refusalFrom(() => deleteOwnFlashcardAction({ id: card.id }))).toMatchObject({ kind: "redirect", target: "/moje-fiszki" });
      expect(await cardOf(card.id)).toBeNull();
      expect(await db.moderationDecision.count({ where: { flashcardId: card.id } })).toBe(0);
      expect((await refusalFrom(() => deleteOwnFlashcardAction({ id: card.id }))).kind).toBe("notFound");
    }
  });

  it("the author cannot delete their own Approved card; a malformed body is a 404", async () => {
    const card = await cardIn("APPROVED");
    signInAs(author);
    expect((await refusalFrom(() => deleteOwnFlashcardAction({ id: card.id }))).kind).toBe("notFound");
    expect(await cardOf(card.id)).toEqual(card);
    for (const body of [{}, { id: String(card.id) }, { id: 1.5 }, null, "1"]) {
      expect((await refusalFrom(() => deleteOwnFlashcardAction(body))).kind).toBe("notFound");
    }
  });
});

describe("API-23 deleteFlashcard (AC-16.8, AC-16.10, DEC-37)", () => {
  it("a Guest is redirected and a User, the author included, is forbidden; the card stays", async () => {
    for (const status of STATUSES) {
      const card = await cardIn(status);
      authMock.mockResolvedValue(null);
      expect((await refusalFrom(() => deleteFlashcardAction({ id: card.id }))).kind).toBe("redirect");
      for (const user of [author, other]) {
        signInAs(user);
        expect((await refusalFrom(() => deleteFlashcardAction({ id: card.id }))).kind).toBe("forbidden");
      }
      expect(await cardOf(card.id)).toEqual(card);
    }
  });

  it("an Administrator removes a card in any status, cascading progress, events and decisions, and only that card", async () => {
    const keep = await cardIn("APPROVED");
    await createProgress(author.id, keep.id);
    signInAs(admin);
    for (const status of STATUSES) {
      const card = await cardIn(status);
      const learners = [author, other];
      for (const learner of learners) {
        await createProgress(learner.id, card.id);
        await db.reviewEvent.create({ data: { userId: learner.id, flashcardId: card.id, mark: "KNOW" } });
      }
      await db.moderationDecision.create({ data: { flashcardId: card.id, decision: "APPROVED", decidedById: admin.id } });
      expect(await refusalFrom(() => deleteFlashcardAction({ id: card.id }))).toMatchObject({ kind: "redirect", target: "/administracja/oczekujace" });
      expect(await cardOf(card.id)).toBeNull();
      expect(await db.cardProgress.count({ where: { flashcardId: card.id } })).toBe(0);
      expect(await db.reviewEvent.count({ where: { flashcardId: card.id } })).toBe(0);
      expect(await db.moderationDecision.count({ where: { flashcardId: card.id } })).toBe(0);
      expect((await refusalFrom(() => deleteFlashcardAction({ id: card.id }))).kind).toBe("notFound");
    }
    expect(await db.cardProgress.count({ where: { flashcardId: keep.id } })).toBe(1);
  });
});
