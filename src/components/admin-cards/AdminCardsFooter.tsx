import { PagingFooter } from "@/components/ui/PagingFooter";
import {
  ADMIN_CARDS_MAX_LIMIT,
  ADMIN_CARDS_PAGE_SIZE,
  adminCardsHref,
  type AdminCardsParams,
} from "@/server/services/adminCardsParams";

/** SCR-18 elements 12 and 13: **Pokaż więcej** raises `limit` by 20, up to 200 (DEC-48), and the shown counter. */
export function AdminCardsFooter({ params, shown, total }: { params: AdminCardsParams; shown: number; total: number }) {
  const more = shown < total && params.limit < ADMIN_CARDS_MAX_LIMIT;
  const next = { ...params, limit: params.limit + ADMIN_CARDS_PAGE_SIZE };
  return <PagingFooter shown={shown} total={total} moreHref={more ? adminCardsHref(next) : null} />;
}
