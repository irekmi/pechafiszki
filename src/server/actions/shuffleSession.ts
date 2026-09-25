"use server";

import { z } from "zod";
import { refuseNotFound, requireUser } from "@/server/permissions";
import { shuffleSession } from "@/server/services/shuffleSession";

const inputSchema = z.object({ sessionId: z.number().int().positive() });

/** API-14 — **Przetasuj**. Someone else's session, or none, ends at SCR-22. */
export async function shuffleSessionAction(input: unknown): Promise<{ status: "ok" }> {
  const user = await requireUser();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) refuseNotFound();

  const result = await shuffleSession(user.id, parsed.data.sessionId);
  if (result.status !== "ok") refuseNotFound();
  return { status: "ok" };
}
