import { Grid } from "@/components/ui/Page";
import { Tile } from "@/components/ui/Tile";
import type { SessionSummary } from "@/server/services/buildSessionSummary";
import { pluralPl } from "./pluralPl";

/** SCR-07 element 3 — the four counter tiles (DEC-19); they are not links. */
export function SummaryTiles({ summary }: { summary: SessionSummary }) {
  const { reviewed, queued, know, knowReinforcements, repeat, unknown } = summary;
  return (
    <Grid cols={4}>
      <Tile label="Przejrzane fiszki" value={reviewed} meta={`z ${queued} w kolejce`} />
      <Tile
        tone="know"
        label="Umiem"
        value={know}
        meta={`w tym ${knowReinforcements} ${pluralPl(knowReinforcements, "powtórka", "powtórki", "powtórek")}`}
      />
      <Tile tone="repeat" label="Do powtórki" value={repeat} meta="wrócą w następnej sesji" />
      <Tile tone="unknown" label="Nie umiem" value={unknown} meta="licznik wyzerowany" />
    </Grid>
  );
}
