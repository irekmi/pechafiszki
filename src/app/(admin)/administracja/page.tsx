import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/permissions";

/**
 * SCR-15 (the overview) is built in ST-20. Until then the administration entry points —
 * **Przejdź do administracji** on SCR-05, the top-bar item, the brand — land on the approval queue.
 * The guard is re-checked here as well as in the layout (CLAUDE.md §8).
 */
export default async function AdminEntryPage() {
  await requireAdmin();
  redirect("/administracja/oczekujace");
}
