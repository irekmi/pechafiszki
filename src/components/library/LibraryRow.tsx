import { Badge } from "@/components/ui/Badge";
import { ListItem } from "@/components/ui/ListItem";
import { formatDate } from "@/components/study/formatDate";
import type { LibraryRow as Row } from "@/server/services/listFlashcards";
import { MarkBadge } from "./MarkBadge";

type LibraryRowProps = { row: Row; href: string };

/**
 * One row of SCR-08 (elements 10 and 11). The question is plain text, so inline markup shows as
 * characters (DEV-03). A card hidden for a week is listed, with its return date (DEC-11); a deleted
 * author reads "Usunięty użytkownik" (DEC-40).
 */
export function LibraryRow({ row, href }: LibraryRowProps) {
  return (
    <ListItem
      href={href}
      leading={<Badge tone="category" block>{row.category}</Badge>}
      title={row.question}
      meta={
        <>
          <span>Dodana {formatDate(row.submittedAt)}</span>
          <span>Autor: {row.author ?? "Usunięty użytkownik"}</span>
        </>
      }
      side={
        <>
          <MarkBadge mark={row.mark} />
          {row.hiddenUntil ? <Badge tone="hidden">Ukryta do {formatDate(row.hiddenUntil)}</Badge> : null}
        </>
      }
    />
  );
}
