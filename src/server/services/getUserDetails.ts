import type { FlashcardStatus, Role } from "@prisma/client";
import { db } from "@/server/db";
import { accountBlock, BLOCK_NOTE } from "./accountBlocks";
import { countMarks } from "./countMarks";

export const USER_SUBMISSIONS_SHOWN = 10;

export type UserSubmission = { id: number; category: string; question: string; status: FlashcardStatus; submittedAt: Date };

/**
 * API-32. Everything the screen shows and nothing else: the account without its password hash,
 * aggregate figures only (`progress` is three totals, never a per-card row — ENT-05), and the block
 * flags. `lastSessionAt` is the start of the most recent session, `null` for "Brak" (DEC-56).
 */
export type UserDetails = {
  user: { id: number; nickname: string; email: string; role: Role; createdAt: Date };
  lastSessionAt: Date | null;
  submissions: { pending: number; approved: number; rejected: number };
  progress: { know: number; repeat: number; unknown: number };
  rows: UserSubmission[];
  shown: number;
  total: number;
  isSelf: boolean;
  canDelete: boolean;
  canChangeRole: boolean;
  blockReason: string | null;
};

/** `null` when the account does not exist. The caller (the page) has passed `requireAdmin`. */
export async function getUserDetails(callerId: number, id: number): Promise<UserDetails | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, nickname: true, email: true, role: true, createdAt: true },
  });
  if (!user) return null;
  const [sessions, groups, cards, progress, admins] = await Promise.all([
    db.studySession.aggregate({ where: { userId: id }, _max: { startedAt: true } }),
    db.flashcard.groupBy({ by: ["status"], where: { authorId: id }, _count: { _all: true } }),
    db.flashcard.findMany({
      where: { authorId: id },
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      take: USER_SUBMISSIONS_SHOWN,
      select: { id: true, question: true, status: true, submittedAt: true, category: { select: { name: true } } },
    }),
    countMarks(id),
    db.user.count({ where: { role: "ADMIN" } }),
  ]);
  const count = (status: FlashcardStatus) => groups.find((group) => group.status === status)?._count._all ?? 0;
  const submissions = { pending: count("PENDING"), approved: count("APPROVED"), rejected: count("REJECTED") };
  const block = accountBlock(user, callerId, admins);
  return {
    user,
    lastSessionAt: sessions._max.startedAt,
    submissions,
    progress,
    rows: cards.map(({ category, ...card }) => ({ ...card, category: category.name })),
    shown: cards.length,
    total: submissions.pending + submissions.approved + submissions.rejected,
    isSelf: user.id === callerId,
    canDelete: block === null,
    canChangeRole: block === null,
    blockReason: block && BLOCK_NOTE[block],
  };
}
