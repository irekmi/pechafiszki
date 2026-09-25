import { Badge } from "@/components/ui/Badge";
import { List, ListItem } from "@/components/ui/ListItem";
import { SectionTitle } from "@/components/ui/Typography";
import type { UnknownCard } from "@/server/services/loadUnknownCards";

/** SCR-07 element 5 — the cards still not known, each with its DEC-20 note; a row opens SCR-09. */
export function UnknownList({ cards }: { cards: UnknownCard[] }) {
  return (
    <section>
      <SectionTitle>Oceniłeś „Nie umiem”</SectionTitle>
      <List>
        {cards.map((card) => (
          <ListItem
            key={card.id}
            href={`/fiszki/${card.id}`}
            leading={<Badge tone="category" block>{card.category}</Badge>}
            title={card.question}
            meta={<span>{card.note}</span>}
            side={<Badge tone="unknown">Nie umiem</Badge>}
          />
        ))}
      </List>
    </section>
  );
}
