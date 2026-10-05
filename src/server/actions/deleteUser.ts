"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { deleteUser } from "@/server/services/deleteUser";
import { ADMIN_USERS_PATH } from "@/server/services/usersParams";
import { userDeleteRequestOfBody } from "./userActionInput";
import { toActionResult, type UserActionResult } from "./userActionResult";

/**
 * API-34 — an administrator removes another account through the one deletion service of DEC-41. Never
 * oneself, never the last administrator: both are refused in the service and returned as the block
 * note. From SCR-19's row (`stay`) the list refreshes in place; from SCR-20 the caller lands on SCR-19.
 */
export async function deleteUserAction(raw: unknown): Promise<UserActionResult> {
  const caller = await requireAdmin();
  const request = userDeleteRequestOfBody(raw);
  if (request === null) refuseNotFound();
  const result = toActionResult(await deleteUser(caller.id, request.id));
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  if (request.stay) return result;
  redirect(ADMIN_USERS_PATH);
}
