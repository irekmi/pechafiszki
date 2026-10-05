import { Card, CardFoot, CardHead, CardTitle } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Page";
import { Progress, ProgressMeta } from "@/components/ui/Progress";
import type { Statistics } from "@/server/services/getStatistics";

type SuccessStats = Extract<Statistics, { hasProgress: true }>;

/** SCR-13 element 6 — the large **Umiem** bar plus the three small bars for the other buckets. */
export function KnownProgressCard({ stats }: { stats: SuccessStats }) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Fiszki, które umiesz, na tle wszystkich</CardTitle>
        <span className="font-bold">
          {stats.counts.know} / {stats.poolTotal}
        </span>
      </CardHead>
      <Progress percent={stats.shares.know} tone="know" large />
      <CardFoot>
        <Stack size="sm">
          <div>
            <ProgressMeta label="Do powtórki" value={stats.counts.repeat} />
            <Progress percent={stats.shares.repeat} />
          </div>
          <div>
            <ProgressMeta label="Nie umiem" value={stats.counts.unknown} />
            <Progress percent={stats.shares.unknown} />
          </div>
          <div>
            <ProgressMeta label="Nie zaczęte" value={stats.counts.new} />
            <Progress percent={stats.shares.new} />
          </div>
        </Stack>
      </CardFoot>
    </Card>
  );
}
