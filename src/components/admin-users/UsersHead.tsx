import { pluralPl } from "@/components/summary/pluralPl";
import { PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";

/** SCR-19 element 1: "86 użytkowników, w tym 2 administratorzy" — the whole system, whatever the filters (as SCR-18's heading). */
export function UsersHead({ users, admins }: { users: number; admins: number }) {
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>Użytkownicy</PageTitle>
        <Muted>
          {`${users} ${pluralPl(users, "użytkownik", "użytkownicy", "użytkowników")}, `}
          {`w tym ${admins} ${pluralPl(admins, "administrator", "administratorzy", "administratorów")}`}
        </Muted>
      </PageTitleGroup>
    </PageHead>
  );
}
