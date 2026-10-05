import { Stack } from "@/components/ui/Page";
import type { AdminOverview } from "@/server/services/getAdminOverview";
import { CategoriesTile } from "./CategoriesTile";
import { DecisionsCard } from "./DecisionsCard";
import { NewAccountsCard } from "./NewAccountsCard";

/** SCR-15's right-hand column: the categories tile, this week's decisions, the newest accounts. */
export function SidePanel({ overview }: { overview: AdminOverview }) {
  return (
    <Stack>
      <CategoriesTile categories={overview.categories} />
      <DecisionsCard weekDecisions={overview.weekDecisions} />
      <NewAccountsCard newUsers={overview.newUsers} />
    </Stack>
  );
}
