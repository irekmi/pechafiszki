import { z } from "zod";
import { ADMIN_CARDS_PATH } from "./adminCardsPath";
import { LIBRARY_PAGE_SIZE, categorySchema, limitSchema, querySchema } from "./libraryParams";

export { LIBRARY_MAX_LIMIT as ADMIN_CARDS_MAX_LIMIT, LIBRARY_PAGE_SIZE as ADMIN_CARDS_PAGE_SIZE } from "./libraryParams";

export const ADMIN_CARD_STATUSES = ["pending", "approved", "rejected"] as const;
export const ADMIN_CARD_SORTS = ["newest", "oldest", "category", "author"] as const;

export type AdminCardsParams = {
  query?: string;
  status?: (typeof ADMIN_CARD_STATUSES)[number];
  category?: number;
  sort: (typeof ADMIN_CARD_SORTS)[number];
  limit: number;
};

const status = z.enum(ADMIN_CARD_STATUSES).optional().catch(undefined);
const sort = z.enum(ADMIN_CARD_SORTS).catch("newest");

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * API-24's URL parameters (DEC-51, DEC-48, NFR-04). Nothing here throws: an unknown or empty value is
 * absent (or the default sort), `limit` above 200 is capped and anything that is not a positive
 * multiple of 20 becomes 20 — the same shape as `parseLibraryParams`, so a hand-made address never
 * reaches an error page.
 */
export function parseAdminCardsParams(raw: RawParams): AdminCardsParams {
  return {
    query: querySchema.parse(first(raw.query)),
    status: status.parse(first(raw.status) || undefined),
    category: categorySchema.parse(first(raw.category) || undefined),
    sort: sort.parse(first(raw.sort)),
    limit: limitSchema.parse(first(raw.limit) ?? LIBRARY_PAGE_SIZE),
  };
}

/** The clean query string of a parameter set: defaults and empty values are left out. */
export function adminCardsQuery(params: Partial<AdminCardsParams>): string {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.status) search.set("status", params.status);
  if (params.category) search.set("category", String(params.category));
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  if (params.limit && params.limit !== LIBRARY_PAGE_SIZE) search.set("limit", String(params.limit));
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** SCR-18's address carrying a parameter set. */
export const adminCardsHref = (params: Partial<AdminCardsParams>): string =>
  `${ADMIN_CARDS_PATH}${adminCardsQuery(params)}`;
