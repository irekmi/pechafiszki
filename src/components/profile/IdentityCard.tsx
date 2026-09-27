import { roleLabel } from "@/components/admin-users/RoleBadge";
import { formatDate } from "@/components/study/formatDate";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { Row, Stack } from "@/components/ui/Page";
import { Hint } from "@/components/ui/Typography";
import type { ProfileSummary } from "@/server/services/getProfileSummary";

/** SCR-14 element 4/5 — avatar, nickname, e-mail, the admin-only badge, and the read-only datalist. */
export function IdentityCard({ profile }: { profile: ProfileSummary }) {
  return (
    <Card>
      <CardHead>
        <Row>
          <Avatar name={profile.nickname} size="lg" />
          <Stack size="sm">
            <CardTitle>{profile.nickname}</CardTitle>
            <Hint>{profile.email}</Hint>
          </Stack>
        </Row>
        {profile.role === "ADMIN" ? <Badge tone="admin">Administrator</Badge> : null}
      </CardHead>
      <Datalist>
        <DatalistRow label="E-mail" value={profile.email} />
        <DatalistRow label="Rola" value={roleLabel(profile.role)} />
        <DatalistRow label="Konto utworzone" value={formatDate(profile.createdAt)} />
        <DatalistRow label="Zgłoszone fiszki" value={profile.submittedCount} />
      </Datalist>
    </Card>
  );
}
