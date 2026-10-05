import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory as createCategoryFixture, createFlashcard, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInWithRow } from "./setup/mockSession";

/**
 * SCR-21 / API-26..30 from the table (CLAUDE.md §9.2, §8, NFR-01). The page and all four actions are
 * exercised as Guest, User and Administrator, asserting the refusal and that nothing was written
 * (AC-19.9); the duplicate name (AC-19.2), the length bounds (AC-19.3), renaming leaving flashcards
 * alone (AC-19.4), reordering and its no-op at the ends (AC-19.5, AC-19.6), the non-empty delete
 * refusal in any status (AC-19.7) and the gap it closes when empty (AC-19.8, AC-19.1).
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
  headers: vi.fn(async () => new Headers({ "x-pathname": "/administracja/kategorie" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { default: CategoriesPage } = await import("@/app/(admin)/administracja/kategorie/page");
const { createCategoryAction } = await import("@/server/actions/createCategory");
const { renameCategoryAction } = await import("@/server/actions/renameCategory");
const { deleteCategoryAction } = await import("@/server/actions/deleteCategory");
const { reorderCategoryAction } = await import("@/server/actions/reorderCategory");
const { createCategory } = await import("@/server/services/createCategory");
const { renameCategory } = await import("@/server/services/renameCategory");
const { deleteCategory } = await import("@/server/services/deleteCategory");
const { reorderCategory } = await import("@/server/services/reorderCategory");
const authMock = asSessionMock(auth);

type Row = { id: number; name: string; position: number; flashcardCount?: number; deletable?: boolean };
const open = () => CategoriesPage();
const rowsOf = async () => ((await open()) as unknown as { props: { rows: Row[] } }).props.rows;

let php: number;
let react: number;

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  php = (await createCategoryFixture("PHP", 1)).id;
  react = (await createCategoryFixture("React", 2)).id;
});

describe("SCR-21 — an administration address (NFR-01, DEC-57)", () => {
  it("a Guest is redirected, a User gets the 403, an Administrator gets the table", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(open)).kind).toBe("redirect");
    await signedInWithRow(authMock, "USER");
    expect((await refusalFrom(open)).kind).toBe("forbidden");
    await signedInWithRow(authMock, "ADMIN");
    expect(await rowsOf()).toMatchObject([
      { name: "PHP", position: 1, flashcardCount: 0, deletable: true },
      { name: "React", position: 2, flashcardCount: 0, deletable: true },
    ]);
  });
});

describe("The four actions are the Administrator's alone (AC-19.9)", () => {
  it.each([
    ["a Guest", () => authMock.mockResolvedValue(null), "redirect"],
    ["a User", () => signedInWithRow(authMock, "USER"), "forbidden"],
  ])("%s is refused on every action; nothing is written", async (_who, sign, kind) => {
    await sign();
    expect((await refusalFrom(() => createCategoryAction({ name: "" }, new FormData()))).kind).toBe(kind);
    expect((await refusalFrom(() => renameCategoryAction({ id: php, category_name: "Nowa" }))).kind).toBe(kind);
    expect((await refusalFrom(() => deleteCategoryAction({ id: react }))).kind).toBe(kind);
    expect((await refusalFrom(() => reorderCategoryAction({ id: php, direction: "down" }))).kind).toBe(kind);
    expect(await db.category.count()).toBe(2);
    expect(await db.category.findUnique({ where: { id: php } })).toMatchObject({ name: "PHP", position: 1 });
  });

  it("a malformed body is SCR-22's 404 and writes nothing", async () => {
    await signedInWithRow(authMock, "ADMIN");
    for (const body of [{ id: "1" }, { id: 0 }, null, "x", {}]) {
      expect((await refusalFrom(() => renameCategoryAction(body))).kind).toBe("notFound");
      expect((await refusalFrom(() => deleteCategoryAction(body))).kind).toBe("notFound");
    }
    expect((await refusalFrom(() => reorderCategoryAction({ id: php, direction: "sideways" }))).kind).toBe("notFound");
    expect(await db.category.count()).toBe(2);
  });
});

describe("API-27 createCategory (AC-19.1, AC-19.2, AC-19.3)", () => {
  it("appends at position = max + 1, in the browser and by direct call", async () => {
    await signedInWithRow(authMock, "ADMIN");
    const formData = new FormData();
    formData.set("new_category", "Systemy rozproszone");
    const state = await createCategoryAction({ name: "" }, formData);
    expect(state).toMatchObject({ name: "", addedId: expect.any(Number) });
    expect(await db.category.findUnique({ where: { id: state.addedId } })).toMatchObject({ position: 3 });

    const direct = await createCategory("Kubernetes");
    expect(direct).toMatchObject({ ok: true, category: { position: 4 } });
  });

  it("refuses a case-insensitive duplicate with the exact message, in the browser and by direct call", async () => {
    await signedInWithRow(authMock, "ADMIN");
    const formData = new FormData();
    formData.set("new_category", "php");
    expect(await createCategoryAction({ name: "" }, formData)).toEqual({
      name: "php",
      error: "Kategoria o tej nazwie już istnieje",
    });
    expect(await createCategory("PHP")).toEqual({ ok: false, message: "Kategoria o tej nazwie już istnieje" });
    expect(await db.category.count()).toBe(2);
  });

  it("refuses a blank (after trim) or 41-character name server-side", async () => {
    await signedInWithRow(authMock, "ADMIN");
    const blank = new FormData();
    blank.set("new_category", "   ");
    expect(await createCategoryAction({ name: "" }, blank)).toMatchObject({ error: "Nazwa jest wymagana" });
    const long = new FormData();
    long.set("new_category", "a".repeat(41));
    expect(await createCategoryAction({ name: "" }, long)).toMatchObject({
      error: "Nazwa może mieć maksymalnie 40 znaków",
    });
    expect(await db.category.count()).toBe(2);
  });
});

describe("API-28 renameCategory (AC-19.2, AC-19.4)", () => {
  it("renames in place and leaves every flashcard in it (DEC-23)", async () => {
    const card = await createFlashcard(php, null, "APPROVED");
    await signedInWithRow(authMock, "ADMIN");
    expect(await renameCategoryAction({ id: php, category_name: "PHP 8" })).toEqual({ ok: true });
    expect(await db.category.findUnique({ where: { id: php } })).toMatchObject({ name: "PHP 8" });
    expect(await db.flashcard.findUnique({ where: { id: card.id } })).toMatchObject({ categoryId: php });
  });

  it("refuses a case-insensitive duplicate of another row, but not of itself", async () => {
    await signedInWithRow(authMock, "ADMIN");
    expect(await renameCategoryAction({ id: php, category_name: "react" })).toEqual({
      ok: false,
      fieldError: "Kategoria o tej nazwie już istnieje",
    });
    expect(await renameCategoryAction({ id: php, category_name: "PHP" })).toEqual({ ok: true });
    const direct = await renameCategory(react, "react");
    expect(direct).toMatchObject({ ok: true });
  });

  it("a vanished id is SCR-22's 404", async () => {
    await signedInWithRow(authMock, "ADMIN");
    expect((await refusalFrom(() => renameCategoryAction({ id: 999_999, category_name: "X" }))).kind).toBe("notFound");
  });
});

describe("API-29 deleteCategory (AC-19.7, AC-19.8)", () => {
  it("refuses a category holding even one pending flashcard, in the browser and by direct call", async () => {
    await createFlashcard(php, null, "PENDING");
    await signedInWithRow(authMock, "ADMIN");
    expect(await deleteCategoryAction({ id: php })).toEqual({
      ok: false,
      note: "Ta kategoria zawiera fiszki i nie można jej usunąć",
    });
    expect(await deleteCategory(php)).toEqual({ ok: false, message: "Ta kategoria zawiera fiszki i nie można jej usunąć" });
    expect(await db.category.count()).toBe(2);
  });

  it("deletes an empty category and closes the position gap; a second call is a no-op", async () => {
    const third = (await createCategoryFixture("Testy", 3)).id;
    await signedInWithRow(authMock, "ADMIN");
    expect(await deleteCategoryAction({ id: react })).toEqual({ ok: true });
    expect(await db.category.findUnique({ where: { id: third } })).toMatchObject({ position: 2 });
    expect(await db.category.count()).toBe(2);
    expect(await deleteCategoryAction({ id: react })).toEqual({ ok: true });
    expect(await deleteCategory(999_999)).toEqual({ ok: true });
  });
});

describe("API-30 reorderCategory (AC-19.5, AC-19.6)", () => {
  it("swaps the neighbour both ways, changing nothing else", async () => {
    await signedInWithRow(authMock, "ADMIN");
    expect(await reorderCategoryAction({ id: react, direction: "up" })).toEqual({ ok: true, moved: true });
    expect(await db.category.findUnique({ where: { id: react } })).toMatchObject({ position: 1 });
    expect(await db.category.findUnique({ where: { id: php } })).toMatchObject({ position: 2 });
    expect(await reorderCategoryAction({ id: react, direction: "down" })).toEqual({ ok: true, moved: true });
    expect(await db.category.findUnique({ where: { id: php } })).toMatchObject({ position: 1 });
  });

  it("does nothing and raises no error at either end", async () => {
    expect(await reorderCategory(php, "up")).toEqual({ ok: true, moved: false });
    expect(await reorderCategory(react, "down")).toEqual({ ok: true, moved: false });
    expect(await db.category.findMany({ orderBy: { position: "asc" } })).toMatchObject([
      { id: php, position: 1 },
      { id: react, position: 2 },
    ]);
  });

  it("two concurrent creates never collide on position (the advisory lock)", async () => {
    const [first, second] = await Promise.all([createCategory("Alpha"), createCategory("Beta")]);
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(new Set([first.category.position, second.category.position]).size).toBe(2);
    }
    expect(await db.category.count()).toBe(4);
  });
});
