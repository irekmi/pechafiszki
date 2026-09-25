import type { Prisma } from "@prisma/client";
import type { QueueEntry } from "@/domain/types";
import { db } from "@/server/db";
import { parseStoredFilters, parseStoredQueue, type SessionFilters } from "./sessionFilters";

export type OpenSession = {
  id: number;
  filters: SessionFilters;
  queue: QueueEntry[];
  cursor: number;
};

/**
 * The caller's open session (`endedAt` null), or `null`. Scoped by `userId`, so a person can only
 * ever reach their own session — the ownership half of REQ-02. A learner has at most one open
 * session (ENT-07); the newest wins if an abandoned one somehow survived.
 */
export async function findOpenSession(
  userId: number,
  client: Pick<Prisma.TransactionClient, "studySession"> = db,
): Promise<OpenSession | null> {
  const row = await client.studySession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!row) return null;
  return {
    id: row.id,
    filters: parseStoredFilters(row.filters),
    queue: parseStoredQueue(row.queue),
    cursor: row.cursor,
  };
}
