import { Tile } from "@/components/ui/Tile";
import type { AdminOverview } from "@/server/services/getAdminOverview";

const CATEGORIES_PATH = "/administracja/kategorie";

/** SCR-15 element 7 — `tile--accent`, the count and the largest category (AC-20.7). */
export function CategoriesTile({ categories }: { categories: AdminOverview["categories"] }) {
  const meta = categories.largest
    ? `najliczniejsza: ${categories.largest.name} (${categories.largest.count})`
    : undefined;
  return <Tile tone="accent" label="Kategorie" value={categories.count} meta={meta} href={CATEGORIES_PATH} />;
}
