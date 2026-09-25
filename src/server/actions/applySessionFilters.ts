"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/permissions";
import { SIGNED_IN_HOME } from "@/server/routeAccess";
import { rebuildSessionQueue } from "@/server/services/rebuildSessionQueue";
import { sessionFiltersSchema } from "@/server/services/sessionFilters";

/**
 * SCR-06 behaviour rows 8 and 9 — a chip changed, **Wyczyść** or **Zacznij od nowa** was pressed.
 * The queue is rebuilt inside the caller's open session (DEC-15, DEC-17); with no open session the
 * caller goes back to SCR-05. An empty object clears every filter.
 */
export async function applySessionFiltersAction(input: unknown): Promise<{ status: "ok" }> {
  const user = await requireUser();
  const parsed = sessionFiltersSchema.safeParse(input);
  if (!parsed.success) redirect("/nauka");

  const rebuilt = await rebuildSessionQueue(user.id, parsed.data);
  if (!rebuilt) redirect(SIGNED_IN_HOME);
  return { status: "ok" };
}
