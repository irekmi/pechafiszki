import { Grid, Page, Stack } from "@/components/ui/Page";
import type { AdminOverview } from "@/server/services/getAdminOverview";
import { LatestSubmissions } from "./LatestSubmissions";
import { OverviewHead } from "./OverviewHead";
import { OverviewTiles } from "./OverviewTiles";
import { SidePanel } from "./SidePanel";

/** SCR-15 (`15-administracja-przeglad.html`, DEV-01) — the administration area's entry screen. */
export function OverviewScreen({ overview }: { overview: AdminOverview }) {
  return (
    <Page>
      <OverviewHead pending={overview.pending} />
      <Stack size="lg">
        <OverviewTiles overview={overview} />
        <Grid cols={2}>
          <LatestSubmissions rows={overview.latest} />
          <SidePanel overview={overview} />
        </Grid>
      </Stack>
    </Page>
  );
}
