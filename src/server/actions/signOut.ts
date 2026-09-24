"use server";

import { endSession } from "@/server/services/signOut";

/**
 * API-38, as a server action. No screen owns it — SCR-14 and SCR-22 both call it — so it lives
 * beside the service rather than inside one route's folder.
 *
 * It is deliberately reachable without a session: its whole effect is clearing a cookie, it reads
 * and writes nothing, and refusing a Guest would leave a stale token in place (SCR-22, API-38).
 */
export async function signOutAction(): Promise<void> {
  await endSession();
}
