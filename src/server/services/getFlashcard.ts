import type { FlashcardStatus, Role } from "@prisma/client";
import { expireHide } from "@/domain/hide";
import type { Mark } from "@/domain/types";
import { db } from "@/server/db";
import { canDeleteFlashcard, canEditFlashcard, canReadFlashcard } from "@/server/permissions";

export type FlashcardDetail = {
  card: {
    id: number;
    question: string;
    answer: string;
    codeExample: string | null;
    status: FlashcardStatus;
    category: { id: number; name: string };
    /** When the card entered the pool; `null` until it is approved. */
    publishedAt: Date | null;
    /** When it was submitted (SCR-17's "zgłoszona"). */
    submittedAt: Date;
  };
  /** The author's nickname, or `null` once the account is gone (DEC-40). */
  author: string | null;
  /** The caller's own marking, read through `expireHide` (DEC-04); `null` for a card never marked. */
  mark: Mark | null;
  knowCount: number;
  hiddenUntil: Date | null;
  lastSeenAt: Date | null;
  canEdit: boolean;
  canDelete: boolean;
};

/**
 * API-07 — one flashcard with the caller's own progress on it. Object rule on ENT-03: a card the
 * caller may not read yields `null`, exactly as a missing id does, so the caller of this function
 * cannot tell the two apart and neither can the response (DEC-57, CLAUDE.md §8). Only the caller's
 * own `CardProgress` row is read (ENT-05).
 */
export async function getFlashcard(
  user: { id: number; role: Role },
  id: number,
): Promise<FlashcardDetail | null> {
  const row = await db.flashcard.findUnique({
    where: { id },
    select: {
      id: true,
      question: true,
      answer: true,
      codeExample: true,
      status: true,
      authorId: true,
      submittedAt: true,
      decidedAt: true,
      category: { select: { id: true, name: true } },
      author: { select: { nickname: true } },
      progress: {
        where: { userId: user.id },
        select: { mark: true, knowCount: true, hiddenUntil: true, firstKnownAt: true, lastSeenAt: true },
      },
    },
  });
  if (!row || !canReadFlashcard(user, row)) return null;

  const stored = row.progress[0];
  const progress = stored ? expireHide(stored, new Date()) : null;
  return {
    card: {
      id: row.id,
      question: row.question,
      answer: row.answer,
      codeExample: row.codeExample,
      status: row.status,
      category: row.category,
      publishedAt: row.status === "APPROVED" ? (row.decidedAt ?? row.submittedAt) : null,
      submittedAt: row.submittedAt,
    },
    author: row.author?.nickname ?? null,
    mark: progress?.mark ?? null,
    knowCount: progress?.knowCount ?? 0,
    hiddenUntil: progress?.hiddenUntil ?? null,
    lastSeenAt: stored?.lastSeenAt ?? null,
    canEdit: canEditFlashcard(user, row),
    canDelete: canDeleteFlashcard(user),
  };
}
