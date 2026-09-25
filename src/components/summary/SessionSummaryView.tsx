import { EmptyState } from "@/components/ui/EmptyState";
import { Page, PageActions, PageHead, PageTitleGroup, Stack } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { SessionSummary } from "@/server/services/buildSessionSummary";
import { formatStart } from "./formatStart";
import { HiddenNotice } from "./HiddenNotice";
import { pluralPl } from "./pluralPl";
import { SummaryActions } from "./SummaryActions";
import { SummaryTiles } from "./SummaryTiles";
import { UnknownList } from "./UnknownList";
import { WhatNext } from "./WhatNext";

/** SCR-07 — the session summary, ported from `07-podsumowanie-sesji.html` (DEV-01, DEC-18–20). */
export function SessionSummaryView({ summary }: { summary: SessionSummary }) {
  const minutes = summary.durationMinutes;
  const minutesText = `${minutes} ${pluralPl(minutes, "minuta", "minuty", "minut")}`;
  return (
    <Page narrow>
      <PageHead>
        <PageTitleGroup>
          <PageTitle>Podsumowanie sesji</PageTitle>
          <Muted>
            {summary.categoryName ?? "Wszystkie"} · {minutesText} · {formatStart(summary.startedAt)}
          </Muted>
        </PageTitleGroup>
        <PageActions>
          <SummaryActions filters={summary.filters} primary="start" />
        </PageActions>
      </PageHead>
      <Stack size="lg">
        {summary.reviewed === 0 ? (
          <EmptyState inline title="Nie oceniłeś żadnej fiszki w tej sesji" />
        ) : (
          <section>
            <SummaryTiles summary={summary} />
          </section>
        )}
        {summary.hiddenThisSession > 0 ? (
          <HiddenNotice count={summary.hiddenThisSession} returnDate={summary.returnDate} />
        ) : null}
        {summary.unknownCards.length > 0 ? <UnknownList cards={summary.unknownCards} /> : null}
        <WhatNext filters={summary.filters} />
      </Stack>
    </Page>
  );
}
