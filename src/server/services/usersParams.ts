import { z } from "zod";
import { LIBRARY_PAGE_SIZE, limitSchema, querySchema } from "./libraryParams";

export { LIBRARY_MAX_LIMIT as USERS_MAX_LIMIT, LIBRARY_PAGE_SIZE as USERS_PAGE_SIZE } from "./libraryParams";

/** SCR-19 — the administration list of accounts; also where deleting an account from SCR-20 lands. */
export const ADMIN_USERS_PATH = "/administracja/uzytkownicy";

export const USER_ROLE_FILTERS = ["user", "admin"] as const;
export const USER_SORTS = ["newest", "oldest", "nickname"] as const;

export type UsersParams = {
  query?: string;
  role?: (typeof USER_ROLE_FILTERS)[number];
  sort: (typeof USER_SORTS)[number];
  limit: number;
};

const role = z.enum(USER_ROLE_FILTERS).optional().catch(undefined);
const sort = z.enum(USER_SORTS).catch("newest");

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

/**
 * API-31's URL parameters (DEC-48, NFR-04). Nothing here throws: an unknown value is absent (or the
 * default sort) and `limit` is a positive multiple of 20 up to 200, so a hand-made address never reaches
 * an error page. The search phrase is bounded to 100 characters and stripped of NUL bytes.
 */
export function parseUsersParams(raw: RawParams): UsersParams {
  return {
    query: querySchema.parse(first(raw.query)),
    role: role.parse(first(raw.role) || undefined),
    sort: sort.parse(first(raw.sort)),
    limit: limitSchema.parse(first(raw.limit) ?? LIBRARY_PAGE_SIZE),
  };
}

/** The clean query string of a parameter set: defaults and empty values are left out. */
export function usersQuery(params: Partial<UsersParams>): string {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.role) search.set("role", params.role);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  if (params.limit && params.limit !== LIBRARY_PAGE_SIZE) search.set("limit", String(params.limit));
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const usersHref = (params: Partial<UsersParams>): string => `${ADMIN_USERS_PATH}${usersQuery(params)}`;

/** SCR-20's address for an account. */
export const userHref = (id: number): string => `${ADMIN_USERS_PATH}/${id}`;
