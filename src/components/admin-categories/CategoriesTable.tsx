import { Table, TableWrapper, Th } from "@/components/ui/TableWrapper";
import type { CategoryRow as Row } from "@/server/services/listCategories";
import { CategoryRow } from "./CategoryRow";

/** SCR-21 element 3: Kolejność, Nazwa, Fiszki, actions — already in `ENT-02.position` order. */
export function CategoriesTable({ rows }: { rows: Row[] }) {
  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Kolejność</Th>
            <Th>Nazwa</Th>
            <Th>Fiszki</Th>
            <Th>
              <span className="sr-only">Akcje</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <CategoryRow key={row.id} row={row} isFirst={index === 0} isLast={index === rows.length - 1} />
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
