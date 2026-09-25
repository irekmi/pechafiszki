import { db } from "@/server/db";
import { buildSessionQueue } from "./buildSessionQueue";
import { findOpenSession } from "./openSession";
import { filtersToJson, normaliseFilters, queueToJson, type SessionFilters } from "./sessionFilters";

/**
 * A chip changed, or **Zacznij od nowa** / **Wyczyść** was pressed — DEC-15, DEC-17. The queue is
 * rebuilt for the new filters *inside the same session*: the row keeps its id and its start time,
 * the Review Events already written stay, and the cursor returns to the first card. Returns `false`
 * when the caller has no open session.
 */
export async function rebuildSessionQueue(userId: number, filters: SessionFilters): Promise<boolean> {
  const session = await findOpenSession(userId);
  if (!session) return false;
  const clean = normaliseFilters(filters);
  const { queue } = await buildSessionQueue(userId, clean);
  await db.studySession.update({
    where: { id: session.id },
    data: { filters: filtersToJson(clean), queue: queueToJson(queue), cursor: 0 },
  });
  return true;
}
