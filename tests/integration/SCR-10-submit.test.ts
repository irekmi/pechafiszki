import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * SCR-10 / API-16 submitFlashcard — the card is PENDING and authored by the caller whatever the form
 * posts (AC-13.3, NFR-01), the DEC-27 limits hold at the server (AC-13.4), the messages sit under
 * their field (AC-13.5), no category means no card (AC-13.7), and a Guest is refused at the action
 * and at the page (CLAUDE.md §9.2). A pending card reaches neither the library nor a session (AC-13.2).
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-pathname": "/dodaj" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { submitFlashcardAction } = await import("@/server/actions/submitFlashcard");
const { emptySubmitState } = await import("@/server/actions/submitFlashcardState");
const { default: DodajPage } = await import("@/app/(app)/dodaj/page");
const { listFlashcards } = await import("@/server/services/listFlashcards");
const { parseLibraryParams } = await import("@/server/services/libraryParams");
const { buildSessionQueue } = await import("@/server/services/buildSessionQueue");
const authMock = asSessionMock(auth);

const SUCCESS = "/moje-fiszki?zmiana=wyslana";
type Person = { id: number; role: "USER" | "ADMIN"; nickname: string };

function signInAs(user: Person): void {
  authMock.mockResolvedValue({
    user: { id: String(user.id), email: `${user.nickname}@example.test`, nickname: user.nickname, role: user.role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session);
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

let categoryId: number;
const valid = () => ({ category: String(categoryId), question: "Czym jest closure?", answer: "Funkcja z domknięciem." });
const submit = (fields: Record<string, string>) => submitFlashcardAction(emptySubmitState, form(fields));
const cards = () => db.flashcard.findMany({ orderBy: { id: "asc" } });

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  categoryId = (await createCategory("PHP", 1)).id;
});

describe("SCR-10 — access (NFR-01)", () => {
  it("a Guest is sent to SCR-01 by the action and by the page; nothing is written", async () => {
    authMock.mockResolvedValue(null);
    const action = await refusalFrom(() => submit(valid()));
    expect(action).toMatchObject({ kind: "redirect", target: "/logowanie?powrot=%2Fdodaj" });
    const page = await refusalFrom(() => DodajPage());
    expect(page.kind).toBe("redirect");
    expect(await cards()).toHaveLength(0);
  });

  it.each(["USER", "ADMIN"] as const)("a %s submits a card that is PENDING and theirs (AC-13.1)", async (role) => {
    const person = await createUser({ role });
    signInAs(person);
    const refusal = await refusalFrom(() => submit({ ...valid(), code_example: "const a = 1;" }));
    expect(refusal).toMatchObject({ kind: "redirect", target: SUCCESS });
    const [card, ...rest] = await cards();
    expect(rest).toHaveLength(0);
    expect(card).toMatchObject({
      status: "PENDING",
      authorId: person.id,
      categoryId,
      question: "Czym jest closure?",
      answer: "Funkcja z domknięciem.",
      codeExample: "const a = 1;",
      decidedAt: null,
    });
    expect(await db.moderationDecision.count()).toBe(0);
  });

  it("the page lists the categories for a User and for an Administrator", async () => {
    for (const role of ["USER", "ADMIN"] as const) {
      signInAs(await createUser({ role }));
      const screen = (await DodajPage()) as { props: { categories: { name: string }[] } };
      expect(screen.props.categories.map((row) => row.name)).toEqual(["PHP"]);
    }
  });
});

describe("SCR-10 — forged fields (AC-13.3, NFR-01)", () => {
  it("status, authorId, role and decidedAt in the body change nothing", async () => {
    const author = await createUser();
    const victim = await createUser({ role: "ADMIN" });
    signInAs(author);
    await refusalFrom(() =>
      submit({ ...valid(), status: "APPROVED", authorId: String(victim.id), author_id: String(victim.id), role: "ADMIN", decidedAt: "2026-01-01" }),
    );
    const [card] = await cards();
    expect(card).toMatchObject({ status: "PENDING", authorId: author.id, decidedAt: null });
    expect(await db.user.findUniqueOrThrow({ where: { id: author.id } })).toMatchObject({ role: "USER" });
  });

  it("a non-text form part counts as empty and is refused, not thrown", async () => {
    signInAs(await createUser());
    const data = form({ ...valid() });
    data.set("answer", new File(["x"], "x.txt"));
    expect((await submitFlashcardAction(emptySubmitState, data)).errors.answer).toBe("Odpowiedź jest wymagana");
  });
});

describe("SCR-10 — validation is the server's (AC-13.4, AC-13.5, DEC-27, DEC-28)", () => {
  beforeEach(async () => signInAs(await createUser()));

  it("an empty answer and an unchosen category are refused, each under its own field", async () => {
    const state = await submit({ category: "", question: "Pytanie?", answer: "" });
    expect(state.errors).toEqual({ category: "Wybierz kategorię", answer: "Odpowiedź jest wymagana" });
    expect(await cards()).toHaveLength(0);
  });

  it("an empty or blank question is refused", async () => {
    expect((await submit({ ...valid(), question: "   " })).errors.question).toBe("Pytanie jest wymagane");
  });

  it("a 200-character question is accepted and a 201-character one is refused, nothing written", async () => {
    expect((await submit({ ...valid(), question: "q".repeat(201) })).errors.question).toBe(
      "Pytanie może mieć najwyżej 200 znaków",
    );
    expect(await cards()).toHaveLength(0);
    await refusalFrom(() => submit({ ...valid(), question: "q".repeat(200) }));
    expect(await cards()).toHaveLength(1);
  });

  it("a 1201-character answer and a 1201-character code example are refused; 1200 pass", async () => {
    const long = "a".repeat(1201);
    expect((await submit({ ...valid(), answer: long })).errors.answer).toBe("Odpowiedź może mieć najwyżej 1200 znaków");
    expect((await submit({ ...valid(), code_example: long })).errors.codeExample).toBe(
      "Przykład kodu może mieć najwyżej 1200 znaków",
    );
    expect(await cards()).toHaveLength(0);
    await refusalFrom(() => submit({ ...valid(), answer: "a".repeat(1200), code_example: "b".repeat(1200) }));
    expect(await cards()).toHaveLength(1);
  });

  it("a browser's CRLF newlines count as one character, as maxlength counted them", async () => {
    const code = Array.from({ length: 400 }, () => "ab").join("\r\n"); // 1199 characters as typed, 1599 as posted
    await refusalFrom(() => submit({ ...valid(), code_example: code }));
    expect((await cards())[0]?.codeExample).toBe(code.replaceAll("\r\n", "\n"));
  });

  it("the code example is optional; a blank one is stored as none, an indented one keeps its indentation", async () => {
    await refusalFrom(() => submit({ ...valid(), code_example: "  \n " }));
    await refusalFrom(() => submit({ ...valid(), code_example: "if (a) {\n  b();\n}" }));
    expect((await cards()).map((card) => card.codeExample)).toEqual([null, "if (a) {\n  b();\n}"]);
  });

  it("a NUL byte is dropped instead of crashing the insert; the question is trimmed", async () => {
    await refusalFrom(() => submit({ ...valid(), question: "  Pytanie\0?  " }));
    expect((await cards())[0]?.question).toBe("Pytanie?");
  });

  it.each(["9999", "0", "-1", "1.5", "abc", "99999999999"])("category %s that is not a category is refused", async (category) => {
    expect((await submit({ ...valid(), category })).errors.category).toBe("Wybierz kategorię");
    expect(await cards()).toHaveLength(0);
  });
});

describe("SCR-10 — no categories (AC-13.7)", () => {
  it("API-16 reports it and writes nothing", async () => {
    signInAs(await createUser());
    await db.category.deleteMany();
    expect(await submit({ ...valid(), category: "1" })).toEqual({ errors: {}, noCategories: true });
    expect(await cards()).toHaveLength(0);
    const screen = (await DodajPage()) as { props: { categories: unknown[] } };
    expect(screen.props.categories).toEqual([]);
  });
});

describe("SCR-10 — a pending card is in neither the library nor a session (AC-13.2, REQ-01)", () => {
  it("it is listed by no one but its author on SCR-11", async () => {
    const person = await createUser();
    signInAs(person);
    await refusalFrom(() => submit(valid()));
    const approved = await createFlashcard(categoryId, null, "APPROVED");
    const library = await listFlashcards(person.id, parseLibraryParams({}));
    expect(library.rows.map((row) => row.id)).toEqual([approved.id]);
    const { queue } = await buildSessionQueue(person.id, {}, new Date());
    expect(queue.map((entry) => entry.flashcardId)).toEqual([approved.id]);
  });
});
