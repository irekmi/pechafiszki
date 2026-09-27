import { Grid, Page, Stack } from "@/components/ui/Page";
import type { Statistics } from "@/server/services/getStatistics";
import { CategoryTable } from "./CategoryTable";
import { KnownProgressCard } from "./KnownProgressCard";
import { StatsHead } from "./StatsHead";
import { StatsTiles } from "./StatsTiles";
import { WeeklyStatsCard } from "./WeeklyStatsCard";

type SuccessStats = Extract<Statistics, { hasProgress: true }>;

/** SCR-13, ported 1:1 from `13-moje-statystyki.html` (DEV-01: the real seeded categories/counts). */
export function StatsScreen({ stats }: { stats: SuccessStats }) {
  return (
    <Page>
      <StatsHead poolTotal={stats.poolTotal} />
      <Stack size="lg">
        <StatsTiles stats={stats} />
        <Grid cols={2}>
          <KnownProgressCard stats={stats} />
          <WeeklyStatsCard stats={stats} />
        </Grid>
        <CategoryTable rows={stats.byCategory} />
      </Stack>
    </Page>
  );
}
