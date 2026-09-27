import { z } from "zod";

/** Not a `"use server"` module. The bodies of API-33 and API-34; nothing here carries anything but the two named fields. */
const id = z.number().int().min(1).max(2_147_483_647);
const roleBody = z.object({ id, role: z.enum(["USER", "ADMIN"]) });
const deleteBody = z.object({ id, stay: z.boolean().optional() });

/** API-33's body `{ id, role }`; `null` for anything else. */
export function roleRequestOfBody(raw: unknown): z.infer<typeof roleBody> | null {
  const parsed = roleBody.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** API-34's body `{ id }`, plus `stay` when SCR-19's row calls it (the list refreshes in place). */
export function userDeleteRequestOfBody(raw: unknown): { id: number; stay: boolean } | null {
  const parsed = deleteBody.safeParse(raw);
  return parsed.success ? { id: parsed.data.id, stay: parsed.data.stay === true } : null;
}
