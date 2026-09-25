import { headers } from "next/headers";
import type { ReactNode } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { requireUser } from "@/server/permissions";
import { getPendingQueueCount } from "@/server/services/getPendingQueueCount";
import { findOpenSession } from "@/server/services/openSession";

/**
 * The guard every signed-in screen sits behind (NFR-01), plus the shared top bar (SCR-05 element 1,
 * drawn on every screen in the mockups). The guard runs on the server for every address in this
 * group, including any a later stage adds, and it runs whether or not `src/middleware.ts` did: a
 * middleware that can be skipped is never the only check (CLAUDE.md §8).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const pendingQueue = user.role === "ADMIN" ? await getPendingQueueCount() : undefined;
  const onStudy = (await headers()).get("x-pathname") === "/nauka";
  const open = onStudy ? await findOpenSession(user.id) : null;
  const studyingSessionId = open && open.queue.length > 0 ? open.id : undefined;
  return (
    <>
      <TopBar user={user} pendingQueue={pendingQueue} studyingSessionId={studyingSessionId} />
      {children}
    </>
  );
}
