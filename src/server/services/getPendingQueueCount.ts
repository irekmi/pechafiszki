import { db } from "@/server/db";

/**
 * The size of the approval queue — the top-bar **Administracja** badge (SCR-05 … every screen) and
 * SCR-05's own administration card. One query, called from both, so the figure is never counted
 * twice in two places.
 */
export async function getPendingQueueCount(): Promise<number> {
  return db.flashcard.count({ where: { status: "PENDING" } });
}
