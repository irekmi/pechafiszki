import { db } from "@/server/db";

export type CategoryRow = {
  id: number;
  name: string;
  position: number;
  flashcardCount?: number;
  deletable?: boolean;
};

/**
 * API-26 — the categories in display order. With `withCounts`, each row carries its approved-card
 * count and `deletable`, false while the category holds any flashcard of any status (computed here,
 * server-side, so a disabled **Usuń** cannot be bypassed). The caller decides who may ask.
 */
export async function listCategories(withCounts = false): Promise<{ rows: CategoryRow[] }> {
  const categories = await db.category.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true, position: true },
  });
  if (!withCounts) return { rows: categories };

  const groups = await db.flashcard.groupBy({ by: ["categoryId", "status"], _count: { _all: true } });
  return {
    rows: categories.map((category) => {
      const own = groups.filter((group) => group.categoryId === category.id);
      const total = own.reduce((sum, group) => sum + group._count._all, 0);
      const approved = own.find((group) => group.status === "APPROVED")?._count._all ?? 0;
      return { ...category, flashcardCount: approved, deletable: total === 0 };
    }),
  };
}
