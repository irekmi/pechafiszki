import type { Metadata } from "next";
import { UserScreen } from "@/components/admin-user/UserScreen";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { parseCardId } from "@/server/services/cardId";
import { getUserDetails } from "@/server/services/getUserDetails";

export const metadata: Metadata = {
  title: "Administracja — użytkownik — Fiszki na rozmowy rekrutacyjne",
};

/**
 * SCR-20 — one account (API-32). Administrator only, re-checked here as well as in the layout (CLAUDE.md
 * §8). A malformed and a missing id both end in SCR-22's 404 variant. The response carries aggregates,
 * never another person's per-card rows, and never the password hash.
 */
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const id = parseCardId((await params).id);
  if (id === null) refuseNotFound();
  const details = await getUserDetails(admin.id, id);
  if (!details) refuseNotFound();
  return <UserScreen details={details} />;
}
