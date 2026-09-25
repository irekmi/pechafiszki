import { redirect } from "next/navigation";
import { z } from "zod";
import { StudyEmpty } from "@/components/study/StudyEmpty";
import { StudyScreen } from "@/components/study/StudyScreen";
import { StudyShell } from "@/components/study/StudyShell";
import { requireUser } from "@/server/permissions";
import { SIGNED_IN_HOME } from "@/server/routeAccess";
import { countMarks } from "@/server/services/countMarks";
import { getSessionQueue } from "@/server/services/getSessionQueue";
import { listCategories } from "@/server/services/listCategories";

const cursorSchema = z.coerce.number().int().min(0);

/**
 * SCR-06 — the study session (API-11). The page loads the caller's own open session, and draws
 * either the card at its cursor or one of the two empty states. With no open session the address
 * leads back to SCR-05. `?cursor=` (Poprzednia / Następna / swipe) is persisted by the loader and
 * the page then redirects to the clean address, so a later refresh never replays a stale cursor.
 * A session whose cursor has passed the last card goes to SCR-05 until ST-09 builds SCR-07.
 */
export default async function NaukaPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const user = await requireUser();
  const { cursor: rawCursor } = await searchParams;
  const cursor = cursorSchema.safeParse(Array.isArray(rawCursor) ? rawCursor[0] : rawCursor);

  const queue = await getSessionQueue(user.id, cursor.success ? cursor.data : undefined);
  if (queue.status === "none" || queue.status === "finished") redirect(SIGNED_IN_HOME);
  if (rawCursor !== undefined) redirect("/nauka");

  const { rows } = await listCategories(true);
  const marks = await countMarks(user.id, queue.filters.category);
  return (
    <StudyShell cardKey={queue.status === "ok" ? `${queue.sessionId}:${queue.position}:${queue.card.id}` : "empty"}>
      {queue.status === "ok" ? (
        <StudyScreen queue={queue} categories={rows} marks={marks} />
      ) : (
        <StudyEmpty result={queue} categories={rows} marks={marks} />
      )}
    </StudyShell>
  );
}
