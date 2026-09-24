import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createUser, resetDatabase } from "./setup/fixtures";

// AC-02.5 — DEC-37: deleting a flashcard is real and cascades to ENT-05 and ENT-06; a category
// that holds cards cannot be deleted, and the refusal comes from the database, not the application.

describe("ENT-03 delete rules", () => {
  beforeEach(resetDatabase);

  it("cascades to CardProgress and ReviewEvent when a flashcard is deleted (DEC-37)", async () => {
    const user = await createUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, user.id);
    const other = await createFlashcard(category.id, user.id);

    await db.cardProgress.create({
      data: { userId: user.id, flashcardId: card.id, mark: "KNOW", knowCount: 1 },
    });
    await db.reviewEvent.create({
      data: { userId: user.id, flashcardId: card.id, mark: "KNOW" },
    });
    await db.cardProgress.create({
      data: { userId: user.id, flashcardId: other.id, mark: "REPEAT" },
    });

    await db.flashcard.delete({ where: { id: card.id } });

    expect(await db.cardProgress.count({ where: { flashcardId: card.id } })).toBe(0);
    expect(await db.reviewEvent.count({ where: { flashcardId: card.id } })).toBe(0);
    expect(await db.cardProgress.count({ where: { flashcardId: other.id } })).toBe(1);
    expect(await db.category.count()).toBe(1);
  });

  it("refuses to delete a category that still holds a flashcard", async () => {
    const user = await createUser();
    const category = await createCategory("PHP", 1);
    await createFlashcard(category.id, user.id);

    await expect(db.category.delete({ where: { id: category.id } })).rejects.toThrow();
    expect(await db.category.count({ where: { id: category.id } })).toBe(1);
  });

  it("deletes a category once it holds no flashcard", async () => {
    const category = await createCategory("Testy", 8);
    await db.category.delete({ where: { id: category.id } });
    expect(await db.category.count()).toBe(0);
  });
});
