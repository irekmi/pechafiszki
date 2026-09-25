import { AdminCard } from "@/components/start/AdminCard";
import { CategoryList } from "@/components/start/CategoryList";
import { CounterTiles } from "@/components/start/CounterTiles";
import { SubmissionsCard } from "@/components/start/SubmissionsCard";
import { WeeklyCard } from "@/components/start/WeeklyCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Grid, Page, PageActions, PageHead, PageTitleGroup, Stack } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { requireUser } from "@/server/permissions";
import { getHomeSummary } from "@/server/services/getHomeSummary";

/**
 * SCR-05 — the landing screen after signing in (API-08). **Zacznij naukę**, a category's **Ucz się**
 * and the counter tiles all point at their real addresses already; only the screens behind those
 * addresses (SCR-06, SCR-08, …) are built in later stages (see the stage file's "Explicitly NOT in
 * this stage" table) — this page wires and composes, it does not shape any of API-08's figures.
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
          <ButtonLink href="/nauka" variant="primary" size="lg">
            Zacznij naukę
          </ButtonLink>
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
