import { z } from "zod";
import { parseCardId } from "@/server/services/cardId";
import { formField } from "./flashcardForm";

/** Not a `"use server"` module. The card an SCR-12 form or modal names; `null` for anything else. */
export const cardIdOfForm = (formData: FormData): number | null => parseCardId(formField(formData, "id"));

const bodySchema = z.object({ id: z.number().int().min(1).max(2_147_483_647) });

/** The delete actions' body `{ id }`; `null` when it is not exactly a positive 32-bit integer id. */
export function cardIdOfBody(raw: unknown): number | null {
  const parsed = bodySchema.safeParse(raw);
  return parsed.success ? parsed.data.id : null;
}
