import { signOut } from "@/server/auth";
import { SIGN_IN_PATH } from "@/server/routeAccess";

/**
 * API-38 — ends the session. Idempotent: clearing a cookie that is already absent is not an error,
 * which is what lets SCR-22 offer it to a visitor holding a stale token.
 *
 * It never returns: Auth.js clears the cookie and redirects to SCR-01.
 */
export async function endSession(): Promise<never> {
  await signOut({ redirectTo: SIGN_IN_PATH });
  throw new Error("unreachable: signOut redirects");
}
