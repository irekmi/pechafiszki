import { Card, CardFoot, CardHead, CardTitle } from "@/components/ui/Card";
import { Hint, Muted } from "@/components/ui/Typography";
import type { Statistics } from "@/server/services/getStatistics";
import { WeekChips } from "./WeekChips";
import { formatStatsWeekHint } from "./weekHint";

type SuccessStats = Extract<Statistics, { hasProgress: true }>;

/** SCR-13 elements 7–8 — the accent weekly card, its chips and the hidden-now line. */
export function WeeklyStatsCard({ stats }: { stats: SuccessStats }) {
  return (
    <Card accent>
      <CardHead>
        <CardTitle className="text-gold">Zapamiętane w tygodniu</CardTitle>
        <WeekChips week={stats.week} />
      </CardHead>
      <p className="font-display font-bold leading-none text-60 text-gold">{stats.memorised}</p>
      <Hint className="text-on-brand-muted">
        {formatStatsWeekHint(stats.weekStart, stats.weekEnd, stats.previousWeek)}
      </Hint>
      <CardFoot accent>
        <Muted className="text-on-brand-muted">
          Fiszki ukryte teraz na tydzień: <span className="font-bold text-on-brand">{stats.hiddenNow}</span>
        </Muted>
      </CardFoot>
    </Card>
  );
}
