import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { deleteFlashcard } from "@/server/services/deleteFlashcard";
import { finishSession } from "@/server/services/finishSession";
import { markCard } from "@/server/services/markCard";
import { createCategory, createFlashcard, createSession, createUser, resetDatabase } from "./setup/fixtures";

/**
 * DEC-37 / API-23 (AC-16.8) — deleting a card cascades its Review Events, but a finished session's
 * SCR-07 summary keeps the figures it had: they are stored before the cascade takes the events.
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));

type Mark = "KNOW" | "REPEAT" | "UNKNOWN";

async function finishedSession() {
  const user = await createUser({});
  const category = await createCategory("PHP", 1);
  const cards = [];
  for (let i = 0; i < 3; i++) cards.push(await createFlashcard(category.id, null));
  const session = await createSession(user.id, cards.map((card) => card.id), { reinforcement: [cards[0]!.id] });
  const marks: Mark[] = ["KNOW", "REPEAT", "UNKNOWN"];
  for (const [index, card] of cards.entries()) {
    await markCard(user, { flashcardId: card.id, mark: marks[index]!, sessionId: session.id });
  }
  return { user, cards, session };
}

beforeEach(resetDatabase);

describe("DEC-37 — a finished session's summary survives the deletion of a card it marked", () => {
  it("keeps every counter, and the list of unknown cards loses only the deleted card", async () => {
    const { user, cards, session } = await finishedSession();
    const before = await finishSession(user.id, session.id);
    expect(before).toMatchObject({ reviewed: 3, know: 1, knowReinforcements: 1, repeat: 1, unknown: 1 });

    expect(await deleteFlashcard(cards[0]!.id)).toEqual({ ok: true });
    expect(await db.reviewEvent.count({ where: { flashcardId: cards[0]!.id } })).toBe(0);

    const after = await finishSession(user.id, session.id);
    expect(after).toMatchObject({ reviewed: 3, know: 1, knowReinforcements: 1, repeat: 1, unknown: 1, queued: 3 });
    expect(after!.unknownCards).toHaveLength(1);

    expect(await deleteFlashcard(cards[2]!.id)).toEqual({ ok: true });
    const last = await finishSession(user.id, session.id);
    expect(last).toMatchObject({ reviewed: 3, know: 1, repeat: 1, unknown: 1 });
    expect(last!.unknownCards).toEqual([]);
  });

  it("freezes the figures of an ended session, an abandoned one included, and not those of an open one", async () => {
    const { user, cards, session } = await finishedSession();
    await db.studySession.update({ where: { id: session.id }, data: { endedAt: new Date() } });
    const other = await createSession(user.id, [cards[0]!.id]);
    await markCard(user, { flashcardId: cards[0]!.id, mark: "KNOW", sessionId: other.id });
    await deleteFlashcard(cards[0]!.id);
    expect((await db.studySession.findUniqueOrThrow({ where: { id: session.id } })).frozenSummary).not.toBeNull();
    expect((await db.studySession.findUniqueOrThrow({ where: { id: other.id } })).frozenSummary).toBeNull();
  });

  it("stores nothing for a session that never marked the card, which keeps deriving its figures", async () => {
    const { user, cards, session } = await finishedSession();
    const extra = await createFlashcard(cards[0]!.categoryId, null);
    await deleteFlashcard(extra.id);
    expect((await db.studySession.findUniqueOrThrow({ where: { id: session.id } })).frozenSummary).toBeNull();
    expect(await finishSession(user.id, session.id)).toMatchObject({ reviewed: 3, know: 1, repeat: 1, unknown: 1 });
  });
});
