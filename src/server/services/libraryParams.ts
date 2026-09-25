import { z } from "zod";

export const LIBRARY_PAGE_SIZE = 20;
export const LIBRARY_MAX_LIMIT = 200;

export const LIBRARY_MARKS = ["know", "repeat", "unknown", "new"] as const;
export const LIBRARY_SORTS = ["newest", "oldest", "category", "mark"] as const;

export type LibraryParams = {
  query?: string;
  category?: number;
  mark?: (typeof LIBRARY_MARKS)[number];
  sort: (typeof LIBRARY_SORTS)[number];
  limit: number;
};

/** An unknown value never fails the request: every field falls back to its default (DEC-51). */
// A NUL byte cannot be stored or compared in PostgreSQL text, so it is dropped before the search.
const query = z
  .string()
  .transform((text) => text.replaceAll("\0", ""))
  .pipe(z.string().trim().max(100).min(1))
  .optional()
  .catch(undefined);
const category = z.coerce.number().int().min(1).max(2_147_483_647).optional().catch(undefined);
const mark = z.enum(LIBRARY_MARKS).optional().catch(undefined);
const sort = z.enum(LIBRARY_SORTS).catch("newest");
const limit = z.coerce
  .number()
  .int()
  .catch(LIBRARY_PAGE_SIZE)
  .transform(normaliseLimit);

/** Above the ceiling: capped. Not a positive multiple of 20: the default page. */
function normaliseLimit(value: number): number {
  if (value > LIBRARY_MAX_LIMIT) return LIBRARY_MAX_LIMIT;
  return value >= LIBRARY_PAGE_SIZE && value % LIBRARY_PAGE_SIZE === 0 ? value : LIBRARY_PAGE_SIZE;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(raw: RawParams, name: string): string | undefined {
  const value = raw[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The URL search parameters of SCR-08 / API-06, validated (DEC-51, NFR-04): `limit` is a multiple
 * of 20 and at most 200 — above that it is capped, anything else unusable becomes 20; an empty or
 * unknown value of any other parameter is simply absent (or the default sort).
 */
export function parseLibraryParams(raw: RawParams): LibraryParams {
  const parsedCategory = category.parse(first(raw, "category") || undefined);
  return {
    query: query.parse(first(raw, "query")),
    category: parsedCategory,
    mark: mark.parse(first(raw, "mark")),
    sort: sort.parse(first(raw, "sort")),
    limit: limit.parse(first(raw, "limit") ?? LIBRARY_PAGE_SIZE),
  };
}

/** The clean query string of a parameter set: defaults and empty values are left out. */
export function libraryQuery(params: Partial<LibraryParams>): string {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.category) search.set("category", String(params.category));
  if (params.mark) search.set("mark", params.mark);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  if (params.limit && params.limit !== LIBRARY_PAGE_SIZE) search.set("limit", String(params.limit));
  const text = search.toString();
  return text ? `?${text}` : "";
}
