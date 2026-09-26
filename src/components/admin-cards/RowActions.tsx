"use client";

import { DeleteCard } from "@/components/edit-card/DeleteCard";
import { ButtonLink } from "@/components/ui/Button";
import { TableActions } from "@/components/ui/TableCells";
import { useNotifyDeleted } from "./AdminCardsBoard";

/** SCR-18 element 11: **Edytuj** (SCR-12, any status) and **Usuń** (the modal → API-23, then the toast). */
export function RowActions({ id }: { id: number }) {
  const notifyDeleted = useNotifyDeleted();
  return (
    <TableActions>
      <ButtonLink href={`/edytuj/${id}`} size="sm">
        Edytuj
      </ButtonLink>
      <DeleteCard id={id} asAdmin size="sm" label="Usuń" onDeleted={notifyDeleted} />
    </TableActions>
  );
}
