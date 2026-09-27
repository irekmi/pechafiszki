import { EmptyState } from "@/components/ui/EmptyState";
import { TextLink } from "@/components/ui/TextLink";
import { Table, TableWrapper, Th } from "@/components/ui/TableWrapper";
import { Hint, SectionTitle } from "@/components/ui/Typography";
import type { UserDetails } from "@/server/services/getUserDetails";
import { adminCardsHref } from "@/server/services/adminCardsParams";
import { SubmissionRow } from "./SubmissionRow";

/**
 * SCR-20 elements 5: the ten latest submissions (DEC-48) and "Pokazano N z M zgłoszeń", with a link to
 * SCR-18 filtered by this author when there are more. Nothing submitted draws the empty state instead of the table.
 */
export function Submissions({ details }: { details: UserDetails }) {
  const { rows, shown, total } = details;
  return (
    <section>
      <SectionTitle>Zgłoszone fiszki</SectionTitle>
      {total === 0 ? (
        <EmptyState inline title="Ten użytkownik nie dodał żadnej fiszki" />
      ) : (
        <>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Kategoria</Th>
                  <Th>Pytanie</Th>
                  <Th>Status</Th>
                  <Th>Zgłoszona</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <SubmissionRow key={row.id} row={row} />
                ))}
              </tbody>
            </Table>
          </TableWrapper>
          <Hint className="mt-3">
            {`Pokazano ${shown} z ${total} ${total === 1 ? "zgłoszenia" : "zgłoszeń"}`}
            {shown < total ? (
              <>
                {". "}
                <TextLink href={adminCardsHref({ author: details.user.id })}>
                  Zobacz wszystkie zgłoszenia tej osoby
                </TextLink>
              </>
            ) : null}
          </Hint>
        </>
      )}
    </section>
  );
}
