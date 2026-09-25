"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/permissions";
import { SIGNED_IN_HOME } from "@/server/routeAccess";
import { sessionFiltersSchema } from "@/server/services/sessionFilters";
import { startSession } from "@/server/services/startSession";

/** A form field as text, or `undefined` when absent or empty. */
function field(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * API-10 — the form action behind **Zacznij naukę** and every **Ucz się** (SCR-05, later SCR-08/09/13).
 * The session is re-checked here, on the server, before anything is written (CLAUDE.md §8); the
 * request carries only the three documented filters, validated with Zod, and the caller's id comes
 * from the session, never from the form. It ends in a redirect to SCR-06, which is where the queue
 * (or its empty state) is drawn.
 */
export async function startSessionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const category = field(formData, "category");
  const parsed = sessionFiltersSchema.safeParse({
    category: category === undefined ? undefined : Number(category),
    mark: field(formData, "mark"),
    query: field(formData, "query"),
  });
  if (!parsed.success) redirect(SIGNED_IN_HOME);

  await startSession(user.id, parsed.data);
  redirect("/nauka");
}
