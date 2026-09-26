import { db } from "@/server/db";

export type AuthorRecord = { authorId: number; nickname: string; approved: number; rejected: number };

/**
 * DEC-36 — how many of the author's own cards were approved and rejected, for the submission card of
 * SCR-17. Keyed by the card under review; `null` once the author's account is gone (DEC-40). Counts
 * only cards with that `authorId` — pending ones are neither. The caller has passed `requireAdmin`.
 */
export async function getAuthorRecord(flashcardId: number): Promise<AuthorRecord | null> {
  const card = await db.flashcard.findUnique({
    where: { id: flashcardId },
    select: { author: { select: { id: true, nickname: true } } },
  });
  if (!card?.author) return null;
  const groups = await db.flashcard.groupBy({
    by: ["status"],
    where: { authorId: card.author.id, status: { in: ["APPROVED", "REJECTED"] } },
    _count: { _all: true },
  });
  const count = (status: "APPROVED" | "REJECTED") => groups.find((group) => group.status === status)?._count._all ?? 0;
  return { authorId: card.author.id, nickname: card.author.nickname, approved: count("APPROVED"), rejected: count("REJECTED") };
}
