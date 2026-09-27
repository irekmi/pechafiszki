import { z } from "zod";

/** Not a `"use server"` module. The bodies of API-28, API-29 and API-30 — nothing beyond these fields. */
const id = z.number().int().min(1).max(2_147_483_647);
const renameBody = z.object({ id, category_name: z.string() });
const idBody = z.object({ id });
const reorderBody = z.object({ id, direction: z.enum(["up", "down"]) });

/** API-28's body `{ id, category_name }`; `null` for anything else. */
export function renameRequestOfBody(raw: unknown): z.infer<typeof renameBody> | null {
  const parsed = renameBody.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** API-29's body `{ id }`; `null` for anything else. */
export function idRequestOfBody(raw: unknown): z.infer<typeof idBody> | null {
  const parsed = idBody.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** API-30's body `{ id, direction }`; `null` for anything else. */
export function reorderRequestOfBody(raw: unknown): z.infer<typeof reorderBody> | null {
  const parsed = reorderBody.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
