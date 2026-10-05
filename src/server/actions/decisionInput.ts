import { z } from "zod";

/** Not a `"use server"` module (those may export only async functions): the inputs of API-20 / API-21. */
const id = z.number().int().min(1).max(2_147_483_647);

/** API-20's body: the card, and optionally the category it enters the pool under. */
export const approveInput = z.object({ id, category: id.optional() });

/** API-21's body; `rejection_reason` is the field name, and a value that is not text counts as no reason. */
export const rejectInput = z.object({ id, rejection_reason: z.string().catch("") });
