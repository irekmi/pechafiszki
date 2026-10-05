import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { countSession, loadSessionEvents } from "./countSession";
import { freezeFigures } from "./frozenSummary";

export type FrozenSession = { id: number; frozenSummary: Prisma.InputJsonObject };

/**
 * The SCR-07 counters of every **finished** session that marked this card and has none stored yet
 * (DEC-37), for the deleting transaction to write. Computed before the delete, because afterwards the
 * cascade has taken the events; a session still open is not summarised yet and simply never counts the
 * card.
 */
export async function freezeSessionFigures(flashcardId: number): Promise<FrozenSession[]> {
  const sessions = await db.studySession.findMany({
    where: { endedAt: { not: null }, frozenSummary: { equals: Prisma.DbNull }, reviewEvents: { some: { flashcardId } } },
    select: { id: true, userId: true },
  });
  const frozen: FrozenSession[] = [];
  for (const session of sessions) {
    const figures = await countSession(session, await loadSessionEvents(session.id));
    frozen.push({ id: session.id, frozenSummary: freezeFigures(figures) });
  }
  return frozen;
}
