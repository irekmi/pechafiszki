import { Badge } from "@/components/ui/Badge";
import { Card, CardFoot, CardHead } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { List, ListItem } from "@/components/ui/ListItem";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/TableWrapper";
import { Hint } from "@/components/ui/Typography";
import { KitSection } from "./KitSection";

export function KitLists() {
  return (
      <KitSection title="Karta, lista, tabela">
        <Card>
          <CardHead>
            <h2 className="font-display font-bold text-16">O tej fiszce</h2>
            <Badge tone="repeat">Do powtórki</Badge>
          </CardHead>
          <Datalist>
            <DatalistRow label="Oceniona „Umiem”" value="2 razy z 5" />
            <DatalistRow label="Ostatnio widziana" value="18.09.2026" />
          </Datalist>
          <CardFoot>
            <Hint>Po piątej ocenie „Umiem” fiszka zniknie z sesji na tydzień.</Hint>
          </CardFoot>
        </Card>
        <List>
          <ListItem
            href="/ui-kit"
            leading={
              <Badge tone="category" block>
                Doctrine/SQL
              </Badge>
            }
            title="Czym jest domknięcie i do czego przydaje się w praktyce?"
            meta={<span>Dodana 19.09.2026</span>}
            side={<Badge tone="know">Umiem</Badge>}
          />
        </List>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Pseudonim</Th>
                <Th>E-mail</Th>
                <Th>Rola</Th>
                <Th>Rejestracja</Th>
                <Th>Zgłoszone fiszki</Th>
              </tr>
            </thead>
            <tbody>
              <Tr>
                <Td>anna_w</Td>
                <Td>anna.wojcik@example.com</Td>
                <Td>
                  <Badge tone="admin">Administrator</Badge>
                </Td>
                <Td>04.03.2026</Td>
                <Td>22</Td>
              </Tr>
            </tbody>
          </Table>
        </TableWrapper>
      </KitSection>
  );
}
