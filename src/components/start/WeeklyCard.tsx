import { Card, CardFoot, CardHead } from "@/components/ui/Card";
import { Hint } from "@/components/ui/Typography";
import { Progress, ProgressMeta } from "@/components/ui/Progress";
import type { HomeSummary } from "@/server/services/getHomeSummary";
import { formatWeekHint } from "./weekHint";

/** SCR-05 element 8 — `ENT-08 WeeklySummary`, derived on request (DEC-54), never stored. */
export function WeeklyCard({ summary }: { summary: HomeSummary }) {
  return (
    <Card>
      <CardHead>
        <h2 className="font-display font-bold text-16 leading-title">Zapamiętane w tym tygodniu</h2>
      </CardHead>
      <p className="font-display font-bold text-40 leading-none text-ink">{summary.memorisedThisWeek}</p>
      <Hint>{formatWeekHint(summary.weekStart, summary.weekEnd)}</Hint>
      <CardFoot>
        <ProgressMeta
          label="Fiszki, które umiesz, na tle wszystkich"
          value={`${summary.counts.know} / ${summary.poolTotal}`}
        />
        <Progress percent={summary.shares.know} tone="know" />
      </CardFoot>
    </Card>
  );
}
