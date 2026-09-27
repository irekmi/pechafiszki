import { averageDecisionDays } from "@/domain/decisionTurnaround";
import type { WeekBounds } from "@/domain/types";
import { db } from "@/server/db";

/** The oldest pending submission's date — SCR-15's sub-line and the pending tile's "najstarsza". */
export async function oldestPendingSubmittedAt(): Promise<Date | null> {
  const row = await db.flashcard.findFirst({
    where: { status: "PENDING" },
    orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    select: { submittedAt: true },
  });
  return row?.submittedAt ?? null;
}

/**
 * Rejected cards whose latest decision carries a reason — the tile's "N z podanym powodem". A
 * LATERAL join for the *latest* decision per card, the same shape `adminListFlashcards` already
 * uses for its rejection-reason column, so a card is counted once even after several rejections.
 */
export async function rejectedWithReasonCount(): Promise<number> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    SELECT count(*)::int AS "count"
    FROM "Flashcard" f
    JOIN LATERAL (
      SELECT m."reason" FROM "ModerationDecision" m
      WHERE m."flashcardId" = f."id" AND m."decision" = 'REJECTED'::"Decision"
      ORDER BY m."decidedAt" DESC, m."id" DESC LIMIT 1
    ) d ON TRUE
    WHERE f."status" = 'REJECTED'::"FlashcardStatus" AND d."reason" IS NOT NULL`;
  return rows[0]?.count ?? 0;
}

export type WeekDecisions = { approved: number; rejected: number; averageDays: number | null };

/** This week's decisions (DEC-55): the two counts and the mean turnaround, over `weekBounds`. */
export async function weekDecisionStats({ start, end }: WeekBounds): Promise<WeekDecisions> {
  const decisions = await db.moderationDecision.findMany({
    where: { decidedAt: { gte: start, lte: end } },
    select: { decision: true, decidedAt: true, flashcard: { select: { submittedAt: true } } },
  });
  return {
    approved: decisions.filter((decision) => decision.decision === "APPROVED").length,
    rejected: decisions.filter((decision) => decision.decision === "REJECTED").length,
    averageDays: averageDecisionDays(
      decisions.map((decision) => ({ submittedAt: decision.flashcard.submittedAt, decidedAt: decision.decidedAt })),
    ),
  };
}
