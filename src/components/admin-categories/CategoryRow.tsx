"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TABLE_NUM_CLASS, TableActions } from "@/components/ui/TableCells";
import { Td, Tr } from "@/components/ui/TableWrapper";
import { useToastBoard } from "@/components/ui/ToastBoard";
import { reorderCategoryAction } from "@/server/actions/reorderCategory";
import type { CategoryRow as Row } from "@/server/services/listCategories";
import { CategoryNameCell } from "./CategoryNameCell";
import { DeleteCategory } from "./DeleteCategory";

type Props = { row: Row; isFirst: boolean; isLast: boolean };

/**
 * One `<tr>` of SCR-21: `Kolejność`, the name cell (`CategoryNameCell`), the card count and the four
 * row actions. Every button is disabled while a rename is open or a request is in flight, matching
 * the "loading" state ("that row's buttons disabled").
 */
export function CategoryRow({ row, isFirst, isLast }: Props) {
  const [name, setName] = useState(row.name);
  useEffect(() => setName(row.name), [row.name]);
  const [editing, setEditing] = useState(false);
  const [busy, startTransition] = useTransition();
  const notify = useToastBoard();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await reorderCategoryAction({ id: row.id, direction });
      if (result.moved) notify("Kolejność zmieniona");
    });
  }

  return (
    <Tr>
      <Td className={TABLE_NUM_CLASS}>{row.position}</Td>
      <Td>
        <CategoryNameCell
          id={row.id}
          name={name}
          editing={editing}
          onSaved={(saved) => {
            setName(saved);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </Td>
      <Td className={TABLE_NUM_CLASS}>{row.flashcardCount ?? 0}</Td>
      <Td>
        <TableActions>
          <Button size="sm" disabled={busy || editing} onClick={() => setEditing(true)}>
            Zmień nazwę
          </Button>
          <Button size="sm" disabled={busy || editing || isFirst} onClick={() => move("up")}>
            W górę
          </Button>
          <Button size="sm" disabled={busy || editing || isLast} onClick={() => move("down")}>
            W dół
          </Button>
          <DeleteCategory id={row.id} deletable={row.deletable ?? false} onDeleted={() => notify("Kategoria usunięta")} />
        </TableActions>
      </Td>
    </Tr>
  );
}
