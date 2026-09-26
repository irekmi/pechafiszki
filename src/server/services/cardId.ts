import { z } from "zod";

const idSchema = z.coerce.number().int().positive().max(2_147_483_647);

/** A card id from an address segment; `null` for anything that is not a positive 32-bit integer. */
export function parseCardId(raw: string): number | null {
  const parsed = idSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
