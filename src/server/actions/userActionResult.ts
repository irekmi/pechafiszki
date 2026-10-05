import { BLOCK_NOTE } from "@/server/services/accountBlocks";
import type { UserWriteResult } from "@/server/services/changeUserRole";
import { refuseNotFound } from "@/server/permissions";

/**
 * What API-33 / API-34 answer the browser. A refusal carries the block note (SCR-20 behaviour 1, 2); a
 * missing account is its own reason, so the client can navigate to a missing address (SCR-22) instead of
 * throwing `notFound()` inside a transition (ISS-26).
 */
export type UserActionResult = { ok: true } | { ok: false; reason: "self" | "last-admin" | "not-found"; note: string };

/** `forbidden` (a caller no longer an administrator) ends where any non-administrator does: SCR-22, 404. */
export function toActionResult(result: UserWriteResult): UserActionResult {
  if (result.ok) return { ok: true };
  if (result.reason === "forbidden") refuseNotFound();
  if (result.reason === "not-found") return { ok: false, reason: "not-found", note: "Nie znaleziono użytkownika" };
  return { ok: false, reason: result.reason, note: BLOCK_NOTE[result.reason] };
}
