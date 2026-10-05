import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Grid, Page, Stack } from "@/components/ui/Page";
import type { UserDetails } from "@/server/services/getUserDetails";
import { ADMIN_USERS_PATH } from "@/server/services/usersParams";
import { CountsCard } from "./CountsCard";
import { IdentityCard } from "./IdentityCard";
import { RoleCard } from "./RoleCard";
import { Submissions } from "./Submissions";
import { UserHead } from "./UserHead";

/**
 * SCR-20 (`20-administracja-szczegoly-uzytkownika.html`, DEV-01). The role card's hint is the
 * block note while a block applies (SQ-18.2); both buttons are inactive then, and the actions refuse regardless.
 */
export function UserScreen({ details }: { details: UserDetails }) {
  const blocked = !details.canChangeRole || !details.canDelete;
  return (
    <Page>
      <Breadcrumb items={[{ label: "Użytkownicy", href: ADMIN_USERS_PATH }, { label: details.user.nickname }]} />
      <UserHead details={details} />
      <Grid cols={2}>
        <Stack>
          <Submissions details={details} />
        </Stack>
        <Stack>
          <IdentityCard details={details} />
          <CountsCard details={details} />
          <RoleCard
            id={details.user.id}
            role={details.user.role}
            canChangeRole={details.canChangeRole}
            blockNote={blocked ? details.blockReason : null}
          />
        </Stack>
      </Grid>
    </Page>
  );
}
