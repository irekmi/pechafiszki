"use client";

import { TableActions } from "@/components/ui/TableCells";
import { useToastBoard } from "@/components/ui/ToastBoard";
import { DeleteUser } from "./DeleteUser";

/** SCR-19 element 8: the row's **Usuń użytkownika**, then the toast "Użytkownik usunięty" (behaviour 3). */
export function RowActions({ id, blockReason }: { id: number; blockReason: string | null }) {
  const notifyDeleted = useToastBoard();
  return (
    <TableActions>
      <DeleteUser id={id} blockReason={blockReason} size="sm" onDeleted={notifyDeleted} />
    </TableActions>
  );
}
