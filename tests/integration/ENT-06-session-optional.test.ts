import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createUser, resetDatabase } from "./setup/fixtures";

// AC-02.8 — stages/audit-questions.md#aq-001: a marking given from SCR-09 has no session, so
// ENT-06.sessionId is nullable; a row that does carry one still needs that session to exist, and
// every session-scoped count is expected to exclude the null rows.

describe("ENT-06 optional session (AQ-001)", () => {
  beforeEach(resetDatabase);

  it("writes a review event with no session", async () => {
    const user = await createUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, user.id);

    const event = await db.reviewEvent.create({
      data: { userId: user.id, flashcardId: card.id, mark: "UNKNOWN" },
    });

    expect(event.sessionId).toBeNull();
    expect(event.wasReinforcement).toBe(false);
    expect(event.countedTowardsKnow).toBe(false);
    expect(event.resetFrom).toBeNull();
  });

  it("still requires the session to exist when one is given", async () => {
    const user = await createUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, user.id);

    await expect(
      db.reviewEvent.create({
        data: { userId: user.id, flashcardId: card.id, sessionId: 9999, mark: "KNOW" },
      }),
    ).rejects.toThrow();
  });

  it("lets a session-scoped count exclude the session-less rows", async () => {
    const user = await createUser();
    const category = await createCategory("PHP", 1);
    const card = await createFlashcard(category.id, user.id);
    const session = await db.studySession.create({ data: { userId: user.id, queue: [card.id] } });

    await db.reviewEvent.create({
      data: { userId: user.id, flashcardId: card.id, sessionId: session.id, mark: "KNOW" },
    });
    await db.reviewEvent.create({ data: { userId: user.id, flashcardId: card.id, mark: "REPEAT" } });

    expect(await db.reviewEvent.count({ where: { sessionId: session.id } })).toBe(1);
    expect(await db.reviewEvent.count({ where: { userId: user.id } })).toBe(2);

    await db.studySession.delete({ where: { id: session.id } });
    const left = await db.reviewEvent.findMany();
    expect(left).toHaveLength(1);
    expect(left[0]?.sessionId).toBeNull();
  });
});
