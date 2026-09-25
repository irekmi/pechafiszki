import type { Role } from "@prisma/client";
import { applyMark } from "@/domain/applyMark";
import { expireHide, isHidden } from "@/domain/hide";
import type { Mark, ProgressRecord } from "@/domain/types";
import { db } from "@/server/db";
import { findOpenSession } from "./openSession";
import { wasKnowCounted } from "./wasKnowCounted";

export type MarkResult =
  | { status: "ok"; mark: Mark; knowCount: number; hiddenUntil: Date | null; hiddenNow: boolean }
  | { status: "skipped" | "forbidden" };

export type MarkInput = { flashcardId: number; mark: Mark; sessionId?: number };

/** A card nobody has marked yet: `applyMark` only reads `knowCount`, `hiddenUntil`, `firstKnownAt`. */
const NEVER_MARKED: ProgressRecord = { mark: "UNKNOWN", knowCount: 0, hiddenUntil: null, firstKnownAt: null };

/**
 * API-12 — records a marking and applies every study rule to it, through `applyMark` (DEC-03,
 * DEC-05, DEC-14). From SCR-06 (`sessionId` given) the card must be in the caller's own open queue,
 * otherwise `forbidden`; a card deleted meanwhile is `skipped` with nothing written (DEC-59). Without
 * a session (SCR-09, ST-12) the card must be readable by the caller — approved, their own, or the
 * caller is an administrator — and the Review Event is written with a null `sessionId` (AQ-001).
 */
export async function markCard(
  user: { id: number; role: Role },
  input: MarkInput,
): Promise<MarkResult> {
  const now = new Date();
  return db.$transaction(async (tx) => {
    const session = input.sessionId === undefined ? null : await findOpenSession(user.id, tx);
    if (input.sessionId !== undefined && session?.id !== input.sessionId) return { status: "forbidden" };
    const index = session?.queue.findIndex((entry) => entry.flashcardId === input.flashcardId) ?? -1;
    if (session && index < 0) return { status: "forbidden" };

    const card = await tx.flashcard.findUnique({
      where: { id: input.flashcardId },
      select: {
        status: true,
        authorId: true,
        progress: {
          where: { userId: user.id },
          select: { mark: true, knowCount: true, hiddenUntil: true, firstKnownAt: true },
        },
      },
    });
    if (session && card?.status !== "APPROVED") return { status: "skipped" };
    const readable = card && (card.status === "APPROVED" || card.authorId === user.id || user.role === "ADMIN");
    if (!card || !readable) return { status: "forbidden" };

    const row = card.progress[0];
    const current = row ? expireHide(row, now) : NEVER_MARKED;
    const counted = session ? await wasKnowCounted(tx, user.id, input.flashcardId, session.id) : false;
    const outcome = applyMark(current, input.mark, now, counted);

    const fields = {
      mark: outcome.mark,
      knowCount: outcome.knowCount,
      hiddenUntil: outcome.hiddenUntil,
      firstKnownAt: outcome.firstKnownAt,
      lastSeenAt: now,
    };
    await tx.cardProgress.upsert({
      where: { userId_flashcardId: { userId: user.id, flashcardId: input.flashcardId } },
      create: { userId: user.id, flashcardId: input.flashcardId, ...fields },
      update: fields,
    });
    await tx.reviewEvent.create({
      data: {
        userId: user.id,
        flashcardId: input.flashcardId,
        sessionId: session?.id ?? null,
        mark: input.mark,
        wasReinforcement: session?.queue[index]?.isReinforcement ?? false,
        countedTowardsKnow: outcome.countedTowardsKnow,
        resetFrom: outcome.resetFrom,
        createdAt: now,
      },
    });
    if (session) await tx.studySession.update({ where: { id: session.id }, data: { cursor: index + 1 } });

    return {
      status: "ok",
      mark: outcome.mark,
      knowCount: outcome.knowCount,
      hiddenUntil: outcome.hiddenUntil,
      hiddenNow: isHidden(outcome, now),
    };
  });
}
