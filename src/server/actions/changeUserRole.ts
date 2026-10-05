"use server";

import { revalidatePath } from "next/cache";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { changeUserRole } from "@/server/services/changeUserRole";
import { roleRequestOfBody } from "./userActionInput";
import { toActionResult, type UserActionResult } from "./userActionResult";

/**
 * API-33 — an administrator promotes or demotes another account. The caller's role comes from the
 * session, the two blocks (self, last administrator) are decided in the service, and the body is exactly
 * `{ id, role }` — nothing else is ever written to the account.
 */
export async function changeUserRoleAction(raw: unknown): Promise<UserActionResult> {
  const caller = await requireAdmin();
  const request = roleRequestOfBody(raw);
  if (request === null) refuseNotFound();
  const result = toActionResult(await changeUserRole(caller.id, request.id, request.role));
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
