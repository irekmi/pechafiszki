import { Grid } from "@/components/ui/Page";
import { Tile, type TileTone } from "@/components/ui/Tile";
import { SectionTitle } from "@/components/ui/Typography";
import type { HomeSummary } from "@/server/services/getHomeSummary";

const ROWS: { key: keyof HomeSummary["counts"]; label: string; tone: TileTone; mark: string }[] = [
  { key: "know", label: "Umiem", tone: "know", mark: "know" },
  { key: "repeat", label: "Do powtórki", tone: "repeat", mark: "repeat" },
  { key: "unknown", label: "Nie umiem", tone: "unknown", mark: "unknown" },
  { key: "new", label: "Nie zaczęte", tone: "neutral", mark: "new" },
];

/** SCR-05 element 6 — the four tiles, each linking to SCR-08 filtered by that marking (DEC-52). */
export function CounterTiles({ summary }: { summary: HomeSummary }) {
  return (
    <section>
      <SectionTitle>Twoje oceny</SectionTitle>
      <Grid cols={4}>
        {ROWS.map((row) => (
          <Tile
            key={row.key}
            tone={row.tone}
            label={row.label}
            value={summary.counts[row.key]}
            meta={`${summary.shares[row.key]}% puli`}
            href={`/fiszki?mark=${row.mark}`}
          />
        ))}
      </Grid>
    </section>
  );
}
