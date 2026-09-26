import { formatDate } from "@/components/study/formatDate";
import { Badge } from "@/components/ui/Badge";
import { ListItem } from "@/components/ui/ListItem";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { MyCardRow as Row } from "@/server/services/listMyFlashcards";

/**
 * Where a row leads: an approved card to SCR-09. A pending or rejected one belongs to SCR-12, which
 * ST-16 builds — until then it opens the read-only detail, which its author may read (SCR-11 note
 * in stage-13). ST-16 changes this one function.
 */
export function rowHref(row: Pick<Row, "id" | "status">): string {
  return `/fiszki/${row.id}`;
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
