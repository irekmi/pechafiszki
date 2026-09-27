import { PagingFooter } from "@/components/ui/PagingFooter";
import { USERS_MAX_LIMIT, USERS_PAGE_SIZE, usersHref, type UsersParams } from "@/server/services/usersParams";

const NOUN = { singular: "użytkownika", plural: "użytkowników" };

/** SCR-19 elements 9: **Pokaż więcej** raises `limit` by 20, up to 200 (DEC-48), and "Pokazano N z M użytkowników". */
export function UsersFooter({ params, shown, total }: { params: UsersParams; shown: number; total: number }) {
  const more = shown < total && params.limit < USERS_MAX_LIMIT;
  const next = { ...params, limit: params.limit + USERS_PAGE_SIZE };
  return <PagingFooter shown={shown} total={total} noun={NOUN} moreHref={more ? usersHref(next) : null} />;
}
