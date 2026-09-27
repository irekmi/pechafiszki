import { authorName } from "@/components/card-detail/detailFormat";
import { formatDate } from "@/components/study/formatDate";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { List, ListItem } from "@/components/ui/ListItem";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionTitle } from "@/components/ui/Typography";
import type { LatestSubmission } from "@/server/services/getAdminOverview";

/** SCR-15 element 6 — the five newest pending cards, newest first, each opening SCR-17 (AC-20.4). */
export function LatestSubmissions({ rows }: { rows: LatestSubmission[] }) {
  return (
    <section>
      <SectionTitle>Najnowsze zgłoszenia</SectionTitle>
      {rows.length === 0 ? (
        <EmptyState inline title="Nic nie czeka na zatwierdzenie" />
      ) : (
        <List>
          {rows.map((row) => {
            const author = authorName(row.author);
            return (
              <ListItem
                key={row.id}
                href={`/administracja/ocena/${row.id}`}
                leading={
                  <Badge tone="category" block>
                    {row.category}
                  </Badge>
                }
                title={row.question}
                meta={
                  <>
                    <Avatar name={author} size="sm" />
                    <span>{author}</span>
                    <span>{formatDate(row.submittedAt)}</span>
                  </>
                }
                side={<StatusBadge status="PENDING" />}
              />
            );
          })}
        </List>
      )}
    </section>
  );
}
