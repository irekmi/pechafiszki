import { StatsEmpty } from "@/components/stats/StatsEmpty";
import { StatsScreen } from "@/components/stats/StatsScreen";
import { requireUser } from "@/server/permissions";
import { getStatistics } from "@/server/services/getStatistics";
import { parseWeekParam } from "./searchParams";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * SCR-13 — API-09, own data only (NFR-01). The session is re-checked here (CLAUDE.md §8); `userId`
 * comes from the session alone, never from a query parameter, so nobody's figures ever include
 * another person's markings.
 */
export default async function StatystykiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const week = parseWeekParam(await searchParams);
  const stats = await getStatistics(user.id, week);
  return stats.hasProgress ? <StatsScreen stats={stats} /> : <StatsEmpty poolTotal={stats.poolTotal} />;
}
