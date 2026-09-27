import { formatDate } from "@/components/study/formatDate";
import { Badge } from "@/components/ui/Badge";
import { TABLE_NUM_CLASS, TableQuestion } from "@/components/ui/TableCells";
import { Td, Tr } from "@/components/ui/TableWrapper";
import type { UserRow as Row } from "@/server/services/listUsers";
import { userHref } from "@/server/services/usersParams";
import { RoleBadge } from "./RoleBadge";
import { RowActions } from "./RowActions";

/**
 * One `<tr>` of SCR-19. Nickname and e-mail are personal data, shown to an administrator only (the page
 * guards it) and rendered as text — React escapes them.
 */
export function UserRow({ row }: { row: Row }) {
  return (
    <Tr>
      <Td>
        <TableQuestion href={userHref(row.id)}>{row.nickname}</TableQuestion>
        {row.isSelf ? (
          <>
            {" "}
            <Badge tone="you">To Ty</Badge>
          </>
        ) : null}
      </Td>
      <Td>{row.email}</Td>
      <Td>
        <RoleBadge role={row.role} />
      </Td>
      <Td className="whitespace-nowrap">{formatDate(row.createdAt)}</Td>
      <Td className={TABLE_NUM_CLASS}>{row.submissionCount}</Td>
      <Td>
        <RowActions id={row.id} blockReason={row.blockReason} />
      </Td>
    </Tr>
  );
}
