import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { List, ListItem } from "@/components/ui/ListItem";
import { SectionTitle } from "@/components/ui/Typography";
import type { HomeCategory } from "@/server/services/getHomeSummary";

/** SCR-05 element 7 — in `ENT-02.position` order (DEV-01: the real seeded categories and counts). */
export function CategoryList({ categories }: { categories: HomeCategory[] }) {
  return (
    <section>
      <SectionTitle>Kategorie</SectionTitle>
      <List>
        {categories.map((category) => (
          <ListItem
            key={category.id}
            href={`/nauka?category=${category.id}`}
            leading={<Badge tone="category" block>{category.name}</Badge>}
            title={`${category.total} fiszek`}
            meta={<span>Umiesz {category.know} · do powtórki {category.repeat}</span>}
            side={
              <span className={buttonClass({ size: "sm" })} aria-hidden="true">
                Ucz się
              </span>
            }
          />
        ))}
      </List>
    </section>
  );
}
