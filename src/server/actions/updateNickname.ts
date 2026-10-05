"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/permissions";
import { updateNickname } from "@/server/services/updateNickname";
import type { NicknameState } from "./profileState";

/**
 * API-35, as SCR-14's `useActionState` action. The account is always the session user's own — no id
 * is read from the form (NFR-01). `revalidatePath` refreshes the top-bar chip everywhere it appears,
 * the same call `deleteUserAction` makes for the roster.
 */

function field(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function updateNicknameAction(
  _previous: NicknameState,
  formData: FormData,
): Promise<NicknameState> {
  const user = await requireUser();
  const nickname = field(formData.get("nickname")).trim();
  const result = await updateNickname(user.id, nickname);
  if (!result.ok) return { nickname, error: result.error };
  revalidatePath("/", "layout");
  return { nickname: result.nickname };
}
