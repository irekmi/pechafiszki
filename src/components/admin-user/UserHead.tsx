import { formatDate } from "@/components/study/formatDate";
import { DeleteUser } from "@/components/admin-users/DeleteUser";
import { ButtonLink } from "@/components/ui/Button";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { UserDetails } from "@/server/services/getUserDetails";
import { ADMIN_USERS_PATH } from "@/server/services/usersParams";

/** SCR-20 elements 2–4: nickname, "<e-mail> · konto utworzone <date>", **Wróć do użytkowników** and **Usuń użytkownika**. */
export function UserHead({ details }: { details: UserDetails }) {
  const { user } = details;
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>{user.nickname}</PageTitle>
        <Muted>{`${user.email} · konto utworzone ${formatDate(user.createdAt)}`}</Muted>
      </PageTitleGroup>
      <PageActions>
        <ButtonLink href={ADMIN_USERS_PATH}>Wróć do użytkowników</ButtonLink>
        <DeleteUser id={user.id} blockReason={details.canDelete ? null : details.blockReason} />
      </PageActions>
    </PageHead>
  );
}
