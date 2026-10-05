import { z } from "zod";
import { parseCardId } from "@/server/services/cardId";
import { formField } from "./flashcardForm";

/** Not a `"use server"` module. The card an SCR-12 form or modal names; `null` for anything else. */
export const cardIdOfForm = (formData: FormData): number | null => parseCardId(formField(formData, "id"));

const id = z.number().int().min(1).max(2_147_483_647);
const bodySchema = z.object({ id });
const deleteSchema = z.object({ id, stay: z.boolean().optional() });

/** The delete actions' body `{ id }`; `null` when it is not exactly a positive 32-bit integer id. */
export function cardIdOfBody(raw: unknown): number | null {
  const parsed = bodySchema.safeParse(raw);
  return parsed.success ? parsed.data.id : null;
}

/**
 * API-23's body: `{ id }`, plus `stay` when the call comes from SCR-18's row (the page refreshes in place
 * and toasts instead of redirecting). `null` when it is not exactly that. Nothing here carries a role.
 */
export function deleteRequestOfBody(raw: unknown): { id: number; stay: boolean } | null {
  const parsed = deleteSchema.safeParse(raw);
  return parsed.success ? { id: parsed.data.id, stay: parsed.data.stay === true } : null;
}
