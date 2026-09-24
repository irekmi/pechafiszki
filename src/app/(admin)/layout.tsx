import type { ReactNode } from "react";
import { requireAdmin } from "@/server/permissions";

/**
 * The administration area (SCR-15 … SCR-21). A Guest is redirected to SCR-01; a signed-in User gets
 * SCR-22's 403 variant with HTTP 403, as DEC-57 decides. ST-14 adds the area's own sub-navigation.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
