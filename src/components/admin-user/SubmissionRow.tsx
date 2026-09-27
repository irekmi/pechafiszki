import { rowHref } from "@/components/admin-cards/rowHref";
import { formatDate } from "@/components/study/formatDate";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableQuestion } from "@/components/ui/TableCells";
import { Td, Tr } from "@/components/ui/TableWrapper";
import type { UserSubmission } from "@/server/services/getUserDetails";

/** One submission of SCR-20 (behaviour 5 and 6): the question links to SCR-17, SCR-09 or SCR-12 by status, as SCR-18's does. */
export function SubmissionRow({ row }: { row: UserSubmission }) {
  return (
    <Tr>
      <Td className="py-3.25">
        <Badge tone="category">{row.category}</Badge>
      </Td>
      <Td className="py-3.25">
        <TableQuestion href={rowHref(row.id, row.status)}>{row.question}</TableQuestion>
      </Td>
      <Td className="py-3.25">
        <StatusBadge status={row.status} />
      </Td>
      <Td className="py-3.25 whitespace-nowrap">{formatDate(row.submittedAt)}</Td>
    </Tr>
  );
}
