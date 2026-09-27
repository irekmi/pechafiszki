import type { Metadata } from "next";
import { UsersScreen } from "@/components/admin-users/UsersScreen";
import { requireAdmin } from "@/server/permissions";
import { listUsers } from "@/server/services/listUsers";
import { parseUsersParams } from "@/server/services/usersParams";

export const metadata: Metadata = {
  title: "Administracja — użytkownicy — Fiszki na rozmowy rekrutacyjne",
};

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * SCR-19 — every account (API-31). Administrator only, re-checked here as well as in the layout
 * (CLAUDE.md §8): a Guest is redirected, a User gets SCR-22's 403 variant. The search parameters are
 * validated by Zod and fall back to their defaults, so a hand-made address never reaches an error page.
 */
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requireAdmin();
  const params = parseUsersParams(await searchParams);
  return <UsersScreen page={await listUsers(admin.id, params)} params={params} />;
}
