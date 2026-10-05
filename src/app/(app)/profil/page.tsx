import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { Page } from "@/components/ui/Page";
import { refuseNotFound, requireUser } from "@/server/permissions";
import { getProfileSummary } from "@/server/services/getProfileSummary";

export const metadata: Metadata = { title: "Mój profil — Fiszki na rozmowy rekrutacyjne" };

/**
 * SCR-14 — the session is re-checked here (CLAUDE.md §8) even though the `(app)` layout already
 * redirects a Guest; the account read is always the caller's own id, never one from a query or a
 * param (NFR-01).
 */
export default async function ProfilPage() {
  const user = await requireUser();
  const profile = await getProfileSummary(user.id);
  if (!profile) refuseNotFound();
  return (
    <Page narrow>
      <ProfileScreen profile={profile} />
    </Page>
  );
}
