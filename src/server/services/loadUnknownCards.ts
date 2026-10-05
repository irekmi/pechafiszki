import { unknownCardIds, type SessionEvent } from "@/domain/summariseSession";
import { unknownCardNote } from "@/domain/unknownCardNote";
import type { Mark } from "@/domain/types";
import { db } from "@/server/db";

export type UnknownCard = { id: number; category: string; question: string; note: string };

type LoadedEvent = SessionEvent & { id: number; mark: Mark; resetFrom: number | null };

/** The "Nie umiem" rows with their DEC-20 note; one query for the cards, one for the history. */
export async function loadUnknownCards(userId: number, events: LoadedEvent[]): Promise<UnknownCard[]> {
  const ids = unknownCardIds(events);
  if (ids.length === 0) return [];
  const cards = await db.flashcard.findMany({
    where: { id: { in: ids } },
    select: { id: true, question: true, category: { select: { name: true } } },
  });
  const history = await db.reviewEvent.findMany({
    where: { userId, flashcardId: { in: ids }, mark: "UNKNOWN", id: { lte: Math.max(...events.map((event) => event.id)) } },
    select: { id: true, flashcardId: true },
  });
  return ids.flatMap((id) => {
    const card = cards.find((row) => row.id === id);
    if (!card) return [];
    const unknownIds = history.filter((row) => row.flashcardId === id).map((row) => row.id);
    const note = unknownCardNote(events.filter((event) => event.flashcardId === id), unknownIds);
    return [{ id, category: card.category.name, question: card.question, note }];
  });
}
