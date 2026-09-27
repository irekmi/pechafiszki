import { Grid } from "@/components/ui/Page";
import { Tile, type TileTone } from "@/components/ui/Tile";
import type { Statistics } from "@/server/services/getStatistics";

type SuccessStats = Extract<Statistics, { hasProgress: true }>;
type CountKey = keyof SuccessStats["counts"];

const ROWS: { key: CountKey; label: string; tone: TileTone }[] = [
  { key: "know", label: "Umiem", tone: "know" },
  { key: "repeat", label: "Do powtórki", tone: "repeat" },
  { key: "unknown", label: "Nie umiem", tone: "unknown" },
  { key: "new", label: "Nie zaczęte", tone: "neutral" },
];

/** SCR-13 element 5 — the four tiles, each linking to SCR-08 filtered by that marking (DEC-52). */
export function StatsTiles({ stats }: { stats: SuccessStats }) {
  return (
    <section>
      <Grid cols={4}>
        {ROWS.map((row) => (
          <Tile
            key={row.key}
            tone={row.tone}
            label={row.label}
            value={stats.counts[row.key]}
            meta={`${stats.shares[row.key]}% puli`}
            href={`/fiszki?mark=${row.key}`}
          />
        ))}
      </Grid>
    </section>
  );
}
