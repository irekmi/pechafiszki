import type { Metadata } from "next";
import { OverviewScreen } from "@/components/admin-overview/OverviewScreen";
import { requireAdmin } from "@/server/permissions";
import { getAdminOverview } from "@/server/services/getAdminOverview";

export const metadata: Metadata = {
  title: "Administracja — przegląd — Fiszki na rozmowy rekrutacyjne",
};

/**
 * SCR-15 — the administration area's entry screen (API-25). Administrator only, re-checked here as
 * well as in the layout (CLAUDE.md §8): a Guest is redirected to SCR-01, a signed-in User gets
 * SCR-22's 403 variant (DEC-57), never the 404 one.
 */
export default async function AdminOverviewPage() {
  await requireAdmin();
  return <OverviewScreen overview={await getAdminOverview()} />;
}
