import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createUser, resetDatabase } from "./setup/fixtures";

// DEC-39 / DEC-40 — deleting an account leaves its approved cards in the pool with a null author,
// rendered "Usunięty użytkownik"; no placeholder account is created. Everything else the person
// owns goes with them.

describe("ENT-01 account deletion", () => {
  beforeEach(resetDatabase);

  it("nulls the author of a flashcard instead of deleting it (DEC-40)", async () => {
    const author = await createUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, author.id);

    await db.user.delete({ where: { id: author.id } });

    const survivor = await db.flashcard.findUnique({ where: { id: card.id } });
    expect(survivor?.authorId).toBeNull();
    expect(survivor?.status).toBe("APPROVED");
    expect(await db.user.count()).toBe(0);
  });

  it("cascades to progress, review events, sessions and reset tokens", async () => {
    const user = await createUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, user.id);
    const session = await db.studySession.create({ data: { userId: user.id, queue: [card.id] } });
    await db.cardProgress.create({ data: { userId: user.id, flashcardId: card.id, mark: "KNOW" } });
    await db.reviewEvent.create({
      data: { userId: user.id, flashcardId: card.id, sessionId: session.id, mark: "KNOW" },
    });
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: "hash-of-a-token", expiresAt: new Date() },
    });

    await db.user.delete({ where: { id: user.id } });

    expect(await db.cardProgress.count()).toBe(0);
    expect(await db.reviewEvent.count()).toBe(0);
    expect(await db.studySession.count()).toBe(0);
    expect(await db.passwordResetToken.count()).toBe(0);
    expect(await db.flashcard.count()).toBe(1);
  });

  it("nulls the deciding administrator of a moderation decision, keeping the record (ENT-04)", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, null);
    await db.moderationDecision.create({
      data: { flashcardId: card.id, decision: "REJECTED", reason: "Za ogólne", decidedById: admin.id },
    });

    await db.user.delete({ where: { id: admin.id } });

    const decisions = await db.moderationDecision.findMany();
    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.decidedById).toBeNull();
    expect(decisions[0]?.reason).toBe("Za ogólne");
  });
});
