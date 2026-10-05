import { roleLabel } from "@/components/admin-users/RoleBadge";
import { formatDate } from "@/components/study/formatDate";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { Row, Stack } from "@/components/ui/Page";
import { Hint } from "@/components/ui/Typography";
import type { UserDetails } from "@/server/services/getUserDetails";

/** SCR-20 element 6: avatar, nickname, role; e-mail, role, creation date and **Ostatnia sesja** — the start of the latest session, or "Brak" (DEC-56). */
export function IdentityCard({ details }: { details: UserDetails }) {
  const { user, lastSessionAt } = details;
  return (
    <Card>
      <CardHead>
        <Row>
          <Avatar name={user.nickname} size="lg" />
          <Stack size="sm">
            <CardTitle>{user.nickname}</CardTitle>
            <Hint>{roleLabel(user.role)}</Hint>
          </Stack>
        </Row>
      </CardHead>
      <Datalist>
        <DatalistRow label="E-mail" value={user.email} />
        <DatalistRow label="Rola" value={roleLabel(user.role)} />
        <DatalistRow label="Konto utworzone" value={formatDate(user.createdAt)} />
        <DatalistRow label="Ostatnia sesja" value={lastSessionAt ? formatDate(lastSessionAt) : "Brak"} />
      </Datalist>
    </Card>
  );
}
