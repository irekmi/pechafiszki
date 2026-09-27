import type { Metadata } from "next";
import { CategoriesScreen } from "@/components/admin-categories/CategoriesScreen";
import { requireAdmin } from "@/server/permissions";
import { listCategories } from "@/server/services/listCategories";

export const metadata: Metadata = {
  title: "Administracja — kategorie — Fiszki na rozmowy rekrutacyjne",
};

/**
 * SCR-21 — categories, in display order, with their card count and `deletable` flag (API-26).
 * Administrator only, re-checked here too (CLAUDE.md §8): a Guest is redirected, a User gets SCR-22's
 * 403 variant, both already enforced by the `(admin)` layout.
 */
export default async function AdminCategoriesPage() {
  await requireAdmin();
  const { rows } = await listCategories(true);
  return <CategoriesScreen rows={rows} />;
}
