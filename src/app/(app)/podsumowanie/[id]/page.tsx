import { z } from "zod";
import { SessionSummaryView } from "@/components/summary/SessionSummaryView";
import { refuseNotFound, requireUser } from "@/server/permissions";
import { finishSession } from "@/server/services/finishSession";

const idSchema = z.coerce.number().int().positive();

/**
 * SCR-07 — the session summary (API-13). Arriving here closes the caller's own session, once, and
 * draws what its Review Events say; a reload draws the same numbers. Another person's session id,
 * a malformed id and an id that does not exist all end at SCR-22's 404 variant (DEC-57).
 */
export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) refuseNotFound();

  const summary = await finishSession(user.id, id.data);
  if (!summary) refuseNotFound();
  return <SessionSummaryView summary={summary} />;
}
