import { Table, TableWrapper, Th } from "@/components/ui/TableWrapper";
import type { UserRow as Row } from "@/server/services/listUsers";
import { UserRow } from "./UserRow";

/** SCR-19 element 6: the six columns of `19-administracja-uzytkownicy.html`. */
export function UsersTable({ rows }: { rows: Row[] }) {
  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Pseudonim</Th>
            <Th>E-mail</Th>
            <Th>Rola</Th>
            <Th>Rejestracja</Th>
            <Th>Zgłoszone fiszki</Th>
            <Th>
              <span className="sr-only">Akcje</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <UserRow key={row.id} row={row} />
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
