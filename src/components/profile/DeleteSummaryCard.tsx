import { pluralPl } from "@/components/summary/pluralPl";
import { AlertIcon } from "@/components/ui/icons";
import { Card, CardFoot } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { Notice } from "@/components/ui/Notice";
import { SectionTitle } from "@/components/ui/Typography";
import type { SessionUser } from "@/server/permissions";
import type { HomeSummary } from "@/server/services/getHomeSummary";

const marking = (n: number) => `${n} ${pluralPl(n, "ocena", "oceny", "ocen")}`;
const session = (n: number) => `${n} ${pluralPl(n, "sesja", "sesje", "sesji")}`;
const card = (n: number) => pluralPl(n, "zatwierdzona fiszka", "zatwierdzone fiszki", "zatwierdzonych fiszek");

/**
 * SCR-23 elements 3–4 — what is lost, in the caller's own counts (never read from a param). The
 * flashcards notice omits itself only for an account that submitted nothing at all (states table's
 * "empty"); `DEV-05`'s sentence is appended whenever it renders, since pending/rejected cards go with
 * the account regardless of how many the person currently has.
 */
export function DeleteSummaryCard({ user, summary }: { user: SessionUser; summary: HomeSummary }) {
  const { own } = summary;
  const markings = summary.counts.know + summary.counts.repeat + summary.counts.unknown;
  const submitted = own.pending + own.approved + own.rejected;

  return (
    <Card>
      <SectionTitle>Co zostanie usunięte</SectionTitle>
      <Datalist>
        <DatalistRow label="Twoje konto" value={`${user.nickname} · ${user.email}`} />
        <DatalistRow label="Twoje oceny fiszek" value={marking(markings)} />
        <DatalistRow label="Twoje statystyki" value="wszystkie tygodnie" />
        <DatalistRow label="Historia sesji" value={session(summary.sessionsCount)} />
      </Datalist>
      {submitted > 0 ? (
        <CardFoot>
          <Notice tone="warning" icon={<AlertIcon />}>
            Twoje fiszki: {own.approved} {card(own.approved)} zostaje we wspólnej puli, a jako autor
            będzie widoczne „Usunięty użytkownik”. Twoje oczekujące i odrzucone zgłoszenia zostaną
            usunięte razem z kontem.
          </Notice>
        </CardFoot>
      ) : null}
    </Card>
  );
}
