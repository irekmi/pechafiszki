import { db } from "@/server/db";

/**
 * The approved cards among `ids`, with the caller's own progress row, keyed by id. A card that was
 * deleted — or is no longer approved — is simply absent, which is how API-11 notices it (DEC-59).
 */
export async function loadQueueCards(userId: number, ids: number[]) {
  const rows = await db.flashcard.findMany({
    where: { id: { in: ids }, status: "APPROVED" },
    select: {
      id: true,
      question: true,
      answer: true,
      codeExample: true,
      category: { select: { id: true, name: true } },
      progress: {
        where: { userId },
        select: { mark: true, knowCount: true, hiddenUntil: true, firstKnownAt: true, lastSeenAt: true },
      },
    },
  });
  return new Map(rows.map((row) => [row.id, row]));
}
