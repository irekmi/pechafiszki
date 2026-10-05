import { z } from "zod";

/** SCR-16's address and the three parameters of API-19; a hand-made address never reaches an error page. */
export const QUEUE_PATH = "/administracja/oczekujace";

export const QUEUE_TABS = ["pending", "approved", "rejected"] as const;
export const QUEUE_SORTS = ["oldest", "newest"] as const;
export type QueueTab = (typeof QUEUE_TABS)[number];
export type QueueSort = (typeof QUEUE_SORTS)[number];
export type QueueParams = { tab: QueueTab; category?: number; sort: QueueSort };

type RawParams = Record<string, string | string[] | undefined>;

const schema = z.object({
  tab: z.enum(QUEUE_TABS).catch("pending"),
  sort: z.enum(QUEUE_SORTS).catch("oldest"),
  category: z
    .string()
    .regex(/^\d{1,9}$/)
    .transform(Number)
    .refine((id) => id >= 1)
    .optional()
    .catch(undefined),
});

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/** API-19's `tab` (default `pending`), `category` (an id, else all) and `sort` (default `oldest`). */
export function parseQueueParams(raw: RawParams): QueueParams {
  const parsed = schema.parse({ tab: first(raw.tab), sort: first(raw.sort), category: first(raw.category) });
  return parsed.category === undefined
    ? { tab: parsed.tab, sort: parsed.sort }
    : { tab: parsed.tab, sort: parsed.sort, category: parsed.category };
}

/** The clean query string of a parameter set: defaults left out, `""` when nothing is left. */
export function queueQuery(params: QueueParams): string {
  const query = new URLSearchParams();
  if (params.tab !== "pending") query.set("tab", params.tab);
  if (params.category !== undefined) query.set("category", String(params.category));
  if (params.sort !== "oldest") query.set("sort", params.sort);
  const text = query.toString();
  return text ? `?${text}` : "";
}
