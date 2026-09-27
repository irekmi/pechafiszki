import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageHead, PageTitleGroup, Stack } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { SessionUser } from "@/server/permissions";
import type { HomeSummary } from "@/server/services/getHomeSummary";
import { DeleteAccountForm } from "./DeleteAccountForm";
import { DeleteSummaryCard } from "./DeleteSummaryCard";
import { OnlyAdminBlock } from "./OnlyAdminBlock";

/**
 * SCR-23 — the form and the block card are mutually exclusive at runtime (the mockup draws both to
 * show each state); the summary card above them renders either way.
 */
export function DeleteAccountScreen({
  user,
  summary,
  blocked,
}: {
  user: SessionUser;
  summary: HomeSummary;
  blocked: boolean;
}) {
  return (
    <>
      <Breadcrumb items={[{ label: "Mój profil", href: "/profil" }, { label: "Usuwanie konta" }]} />
      <PageHead>
        <PageTitleGroup>
          <PageTitle>Usuń konto</PageTitle>
          <Muted>Tego nie można cofnąć.</Muted>
        </PageTitleGroup>
      </PageHead>
      <Stack>
        <DeleteSummaryCard user={user} summary={summary} />
        {blocked ? <OnlyAdminBlock /> : <DeleteAccountForm />}
      </Stack>
    </>
  );
}
