"use client";

import { authorName } from "@/components/card-detail/detailFormat";
import { formatDate } from "@/components/study/formatDate";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListItem } from "@/components/ui/ListItem";
import type { QueueRow as Row } from "@/server/services/listPendingFlashcards";

type QueueRowProps = {
  row: Row;
  /** Only the pending tab carries **Zatwierdź** / **Odrzuć**; decided cards are read-only (DEC-34). */
  decidable: boolean;
  busy: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
};

/** One row of SCR-16 (elements 5-6): the question links to SCR-17, the buttons sit beside it. */
export function QueueRow({ row, decidable, busy, onApprove, onReject }: QueueRowProps) {
  const author = authorName(row.author);
  return (
    <ListItem
      mainHref={`/administracja/ocena/${row.id}`}
      leading={<Badge tone="category" block>{row.category}</Badge>}
      title={row.question}
      meta={<span>{row.answerExcerpt}</span>}
      secondaryMeta={
        <>
          <Avatar name={author} size="sm" />
          <span>{author}</span>
          <span>{formatDate(row.submittedAt)}</span>
        </>
      }
      side={
        decidable ? (
          <>
            <Button size="sm" variant="primary" disabled={busy} onClick={() => onApprove(row.id)}>
              Zatwierdź
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => onReject(row.id)}>
              Odrzuć
            </Button>
          </>
        ) : undefined
      }
    />
  );
}
