import type { ReactNode } from "react";
import { AdminSubnav } from "@/components/admin-shell/AdminSubnav";
import { AdminTopBar } from "@/components/admin-shell/AdminTopBar";
import { requireAdmin } from "@/server/permissions";
import { getPendingQueueCount } from "@/server/services/getPendingQueueCount";

/**
 * The administration area (SCR-15 … SCR-21). A Guest is redirected to SCR-01; a signed-in User gets
 * SCR-22's 403 variant with HTTP 403, as DEC-57 decides. The guard runs before anything is fetched
 * or drawn; every page and action below re-checks it (CLAUDE.md §8). The area's own top bar and
 * sub-navigation replace the learning navigation (AC-14.9).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const pending = await getPendingQueueCount();
  return (
    <>
      <AdminTopBar user={user} />
      <AdminSubnav pending={pending} />
      {children}
    </>
  );
}
