import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { SessionCounts } from "@/domain/summariseSession";

/** The numbers of SCR-07 that come from a session's Review Events (DEC-19, DEC-05). */
export type SessionFigures = SessionCounts & {
  resetCount: number;
  hiddenThisSession: number;
  returnDate: Date | null;
};

const count = z.number().int().min(0);
const frozenSchema = z.object({
  reviewed: count,
  know: count,
  knowReinforcements: count,
  repeat: count,
  unknown: count,
  resetCount: count,
  hiddenThisSession: count,
  returnDate: z.iso.datetime().nullable(),
});

/** The JSON stored in `StudySession.frozenSummary` (DEC-37). */
export function freezeFigures(figures: SessionFigures): Prisma.InputJsonObject {
  return { ...figures, returnDate: figures.returnDate?.toISOString() ?? null };
}

/** The stored figures, or `null` when there are none or they no longer parse — then they are derived. */
export function parseFrozenFigures(json: unknown): SessionFigures | null {
  const parsed = frozenSchema.safeParse(json);
  if (!parsed.success) return null;
  return { ...parsed.data, returnDate: parsed.data.returnDate ? new Date(parsed.data.returnDate) : null };
}
