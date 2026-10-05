import type { Prisma } from "@prisma/client";

/**
 * Whether a **Umiem** for this card already raised the counter in this session — the input
 * `applyMark` needs for DEC-14. It looks only at rows carrying this session's id, so a Review Event
 * with a null `sessionId` (a marking from SCR-09) can never match (`stages/audit-questions.md#aq-001`).
 */
export async function wasKnowCounted(
  client: Pick<Prisma.TransactionClient, "reviewEvent">,
  userId: number,
  flashcardId: number,
  sessionId: number,
): Promise<boolean> {
  const count = await client.reviewEvent.count({
    where: { userId, flashcardId, sessionId, mark: "KNOW", countedTowardsKnow: true },
  });
  return count > 0;
}
