import type { Metadata } from "next";
import { DeleteAccountScreen } from "@/components/profile/DeleteAccountScreen";
import { Page } from "@/components/ui/Page";
import { requireUser } from "@/server/permissions";
import { isOnlyAdministrator } from "@/server/services/deleteOwnAccount";
import { getHomeSummary } from "@/server/services/getHomeSummary";

export const metadata: Metadata = { title: "Usuń konto — Fiszki na rozmowy rekrutacyjne" };

/**
 * SCR-23 — the session is re-checked here (CLAUDE.md §8); every count read is the caller's own
 * (NFR-01). `isAdmin: false` skips API-08's pending-queue count, which this screen never shows.
 */
export default async function UsunKontoPage() {
  const user = await requireUser();
  const [summary, blocked] = await Promise.all([
    getHomeSummary(user.id, user.nickname, false),
    isOnlyAdministrator(user.role),
  ]);
  return (
    <Page narrow>
      <DeleteAccountScreen user={user} summary={summary} blocked={blocked} />
    </Page>
  );
}
