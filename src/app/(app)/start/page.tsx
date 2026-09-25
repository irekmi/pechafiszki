import { AdminCard } from "@/components/start/AdminCard";
import { CategoryList } from "@/components/start/CategoryList";
import { CounterTiles } from "@/components/start/CounterTiles";
import { SubmissionsCard } from "@/components/start/SubmissionsCard";
import { WeeklyCard } from "@/components/start/WeeklyCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Grid, Page, PageActions, PageHead, PageTitleGroup, Stack } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { startSessionAction } from "@/server/actions/startSession";
import { requireUser } from "@/server/permissions";
import { getHomeSummary } from "@/server/services/getHomeSummary";

/**
 * SCR-05 — the landing screen after signing in (API-08). **Zacznij naukę** and a category's
 * **Ucz się** post to `startSessionAction` (API-10, ST-08); the counter tiles point at their real
 * addresses, the screens behind which (SCR-08, …) are built in later stages. This page wires and
 * composes, it does not shape any of API-08's figures.
 */
export default async function StartPage() {
  const user = await requireUser();
  const summary = await getHomeSummary(user.id, user.nickname, user.role === "ADMIN");
  const pendingQueue = user.role === "ADMIN" ? summary.pendingQueue : undefined;

  // SQ-07.1 — no mockup state exists for a completely empty pool; the aside cards (weekly result,
  // own submissions, administration) still render, since the screen spec only says the tiles and the
  // category list are replaced, not the whole screen.
  const aside = (
    <Stack>
      <WeeklyCard summary={summary} />
      <SubmissionsCard own={summary.own} />
      {pendingQueue !== undefined ? <AdminCard pendingQueue={pendingQueue} /> : null}
    </Stack>
  );

  return (
    <Page>
      <PageHead>
        <PageTitleGroup>
          <PageTitle>Cześć, {summary.nickname}</PageTitle>
          <Muted>
            Zapamiętane w tym tygodniu: {summary.memorisedThisWeek} fiszek. Do powtórki czeka{" "}
            {summary.repeatCount}.
          </Muted>
        </PageTitleGroup>
        <PageActions>
          <form action={startSessionAction}>
            <Button type="submit" variant="primary" size="lg">
              Zacznij naukę
            </Button>
          </form>
        </PageActions>
      </PageHead>

      {summary.poolTotal === 0 ? (
        <Stack size="lg">
          <EmptyState
            title="Nie ma jeszcze żadnych fiszek"
            actions={
              <ButtonLink href="/dodaj" variant="primary">
                Dodaj fiszkę
              </ButtonLink>
            }
          />
          {aside}
        </Stack>
      ) : (
        <Stack size="lg">
          <CounterTiles summary={summary} />
          <Grid cols={2}>
            <CategoryList categories={summary.categories} />
            {aside}
          </Grid>
        </Stack>
      )}
    </Page>
  );
}
