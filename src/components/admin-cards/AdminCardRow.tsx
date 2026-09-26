import { authorName } from "@/components/card-detail/detailFormat";
import { formatDate } from "@/components/study/formatDate";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Td, Tr } from "@/components/ui/TableWrapper";
import { TableQuestion, TableSub } from "@/components/ui/TableCells";
import type { AdminCardRow as Row } from "@/server/services/adminListFlashcards";
import { RowActions } from "./RowActions";
import { rowHref } from "./rowHref";

/**
 * One `<tr>` of SCR-18. The question is plain text (DEV-03) and so is the rejection reason — React
 * escapes both; a deleted author reads "Usunięty użytkownik" (DEC-40).
 */
export function AdminCardRow({ row }: { row: Row }) {
  return (
    <Tr>
      <Td>
        <Badge tone="category">{row.category}</Badge>
      </Td>
      <Td>
        <TableQuestion href={rowHref(row.id, row.status)}>{row.question}</TableQuestion>
        <TableSub>{row.reason ? `Powód odrzucenia: ${row.reason}` : row.excerpt}</TableSub>
      </Td>
      <Td>
        <StatusBadge status={row.status} />
      </Td>
      <Td>{authorName(row.author)}</Td>
      <Td className="whitespace-nowrap">{formatDate(row.submittedAt)}</Td>
      <Td>
        <RowActions id={row.id} />
      </Td>
    </Tr>
  );
}
