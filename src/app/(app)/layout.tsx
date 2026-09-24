import type { ReactNode } from "react";
import { requireUser } from "@/server/permissions";

/**
 * The guard every signed-in screen sits behind (NFR-01). It runs on the server for every address in
 * this group, including any a later stage adds, and it runs whether or not `src/middleware.ts` did:
 * a middleware that can be skipped is never the only check (CLAUDE.md §8).
 *
 * ST-07 adds the top bar here; the guard is what this stage owns.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
