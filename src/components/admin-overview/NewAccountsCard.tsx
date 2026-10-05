import { formatDate } from "@/components/study/formatDate";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot, CardHead, CardTitle } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import type { AdminOverview } from "@/server/services/getAdminOverview";
import { ADMIN_USERS_PATH } from "@/server/services/usersParams";

/** SCR-15 element 9 — the three newest accounts (API-25 `newUsers`); tinted card. */
export function NewAccountsCard({ newUsers }: { newUsers: AdminOverview["newUsers"] }) {
  return (
    <Card tint>
      <CardHead>
        <CardTitle>Nowe konta</CardTitle>
      </CardHead>
      <Datalist>
        {newUsers.map((user) => (
          <DatalistRow key={user.nickname} label={user.nickname} value={formatDate(user.createdAt)} />
        ))}
      </Datalist>
      <CardFoot>
        <ButtonLink href={ADMIN_USERS_PATH} block>
          Zobacz użytkowników
        </ButtonLink>
      </CardFoot>
    </Card>
  );
}
