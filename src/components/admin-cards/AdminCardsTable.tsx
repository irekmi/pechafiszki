import { Table, TableWrapper, Th } from "@/components/ui/TableWrapper";
import type { AdminCardRow as Row } from "@/server/services/adminListFlashcards";
import { AdminCardRow } from "./AdminCardRow";

/** SCR-18 element 9: the six columns of `18-administracja-wszystkie-fiszki.html`. */
export function AdminCardsTable({ rows }: { rows: Row[] }) {
  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Kategoria</Th>
            <Th>Pytanie</Th>
            <Th>Status</Th>
            <Th>Autor</Th>
            <Th>Zgłoszona</Th>
            <Th>
              <span className="sr-only">Akcje</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AdminCardRow key={row.id} row={row} />
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
