"use server";

import { signOut } from "@/server/auth";
import { requireUser } from "@/server/permissions";
import { deleteOwnAccount, ONLY_ADMIN_NOTE } from "@/server/services/deleteOwnAccount";
import type { DeleteAccountState } from "./profileState";

/**
 * API-37, as SCR-23's `useActionState` action. On success the deletion (ST-18's `deleteAccount`,
 * DEC-41) has already happened, so `signOut` here only clears the now-stale cookie and lands on
 * SCR-01 with the farewell notice — it never returns, the same way `signUpAction`'s sign-in does not.
 */

function field(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function deleteOwnAccountAction(
  _previous: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const user = await requireUser();
  const password = field(formData.get("password"));
  const result = await deleteOwnAccount(user.id, password);
  if (!result.ok) {
    return { error: result.error === "last-admin" ? ONLY_ADMIN_NOTE : "Hasło jest nieprawidłowe" };
  }
  await signOut({ redirectTo: "/logowanie?zmiana=konto-usuniete" });
  return {};
}
