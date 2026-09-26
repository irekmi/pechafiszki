import { formatDate } from "@/components/study/formatDate";
import { Badge } from "@/components/ui/Badge";
import { ListItem } from "@/components/ui/ListItem";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { MyCardRow as Row } from "@/server/services/listMyFlashcards";

/** Where a row leads: an approved card to SCR-09, a pending or rejected one to its edit form (SCR-12). */
export function rowHref(row: Pick<Row, "id" | "status">): string {
  return row.status === "APPROVED" ? `/fiszki/${row.id}` : `/edytuj/${row.id}`;
}

/**
 * One row of SCR-11 (elements 6–8). The question is plain text (DEV-03); a rejected row carries the
 * administrator's reason verbatim.
 */
export function MyCardRow({ row }: { row: Row }) {
  return (
    <ListItem
      href={rowHref(row)}
      leading={<Badge tone="category" block>{row.category}</Badge>}
      title={row.question}
      meta={
        <>
          <span>Zgłoszona {formatDate(row.submittedAt)}</span>
          {row.decidedAt ? (
            <span>
              {row.status === "APPROVED" ? "Zatwierdzona" : "Decyzja"} {formatDate(row.decidedAt)}
            </span>
          ) : null}
        </>
      }
      side={<StatusBadge status={row.status} />}
      note={row.rejectionReason ? `Powód odrzucenia: ${row.rejectionReason}` : undefined}
    />
  );
}
