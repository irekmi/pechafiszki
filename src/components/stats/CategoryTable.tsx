import { cn } from "@/components/ui/cn";
import { Progress } from "@/components/ui/Progress";
import { TABLE_NUM_CLASS, TableQuestion } from "@/components/ui/TableCells";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/TableWrapper";
import { SectionTitle } from "@/components/ui/Typography";
import type { StatsCategory } from "@/server/services/getStatistics";

/** SCR-13 element 9 — the per-category breakdown, in `ENT-02.position` order (DEV-01: real rows). */
export function CategoryTable({ rows }: { rows: StatsCategory[] }) {
  return (
    <section>
      <SectionTitle>Postęp po kategoriach</SectionTitle>
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Kategoria</Th>
              <Th>Postęp</Th>
              <Th>Umiem</Th>
              <Th>Do powtórki</Th>
              <Th>Nie umiem</Th>
              <Th>Nie zaczęte</Th>
              <Th>Wszystkie</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={row.id}>
                <Td>
                  <TableQuestion href={`/fiszki?category=${row.id}`}>{row.name}</TableQuestion>
                </Td>
                <Td>
                  <div className="flex items-center gap-2.5 min-w-30">
                    <Progress percent={row.percent} tone="know" className="flex-1" />
                    <span className="w-10 text-right font-bold">{row.percent}%</span>
                  </div>
                </Td>
                <Td className={TABLE_NUM_CLASS}>{row.know}</Td>
                <Td className={TABLE_NUM_CLASS}>{row.repeat}</Td>
                <Td className={TABLE_NUM_CLASS}>{row.unknown}</Td>
                <Td className={TABLE_NUM_CLASS}>{row.new}</Td>
                <Td className={cn(TABLE_NUM_CLASS, "font-bold")}>{row.total}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
    </section>
  );
}
