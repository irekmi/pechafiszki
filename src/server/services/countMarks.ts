import { countsAndShares } from "@/domain/counts";
import { expireHide } from "@/domain/hide";
import { db } from "@/server/db";

/**
 * The counts on the marking chips of SCR-06, within one category or the whole pool. Read through
 * `expireHide` (DEC-04) so a chip's number equals what pressing it would queue.
 */
export async function countMarks(
  userId: number,
  categoryId?: number,
): Promise<{ know: number; repeat: number; unknown: number }> {
  const now = new Date();
  const cards = await db.flashcard.findMany({
    where: { status: "APPROVED", ...(categoryId ? { categoryId } : {}) },
    select: {
      progress: {
        where: { userId },
        select: { mark: true, knowCount: true, hiddenUntil: true, firstKnownAt: true },
      },
    },
  });
  const { know, repeat, unknown } = countsAndShares(
    cards.map((card) => {
      const row = card.progress[0];
      return { mark: row ? expireHide(row, now).mark : null };
    }),
  );
  return { know, repeat, unknown };
}
