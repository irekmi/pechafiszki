import { pluralPl } from "@/components/summary/pluralPl";
import { formatDate } from "@/components/study/formatDate";
import { Grid } from "@/components/ui/Page";
import { Tile } from "@/components/ui/Tile";
import { adminCardsHref } from "@/server/services/adminCardsParams";
import { QUEUE_PATH } from "@/server/services/adminQueueParams";
import type { AdminOverview } from "@/server/services/getAdminOverview";
import { ADMIN_USERS_PATH } from "@/server/services/usersParams";

/** SCR-15 element 5 — the four top tiles, each carrying its own filter into its destination. */
export function OverviewTiles({ overview }: { overview: AdminOverview }) {
  const { pending, approved, rejected, rejectedWithReason, users, categories } = overview;
  return (
    <section>
      <Grid cols={4}>
        <Tile
          tone="repeat"
          label="Oczekujące na zatwierdzenie"
          value={pending.count}
          meta={pending.oldestAt ? `najstarsza ${formatDate(pending.oldestAt)}` : undefined}
          href={QUEUE_PATH}
        />
        <Tile
          tone="know"
          label="Zatwierdzone fiszki"
          value={approved}
          meta={`w ${categories.count} ${pluralPl(categories.count, "kategorii", "kategoriach", "kategoriach")}`}
          href={adminCardsHref({ status: "approved" })}
        />
        <Tile
          tone="unknown"
          label="Odrzucone fiszki"
          value={rejected}
          meta={`${rejectedWithReason} z podanym powodem`}
          href={adminCardsHref({ status: "rejected" })}
        />
        <Tile
          label="Zarejestrowani użytkownicy"
          value={users.total}
          meta={`${users.admins} ${pluralPl(users.admins, "administrator", "administratorzy", "administratorów")}`}
          href={ADMIN_USERS_PATH}
        />
      </Grid>
    </section>
  );
}
