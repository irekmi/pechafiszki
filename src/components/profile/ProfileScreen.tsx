import { SignOutButton } from "@/components/auth/SignOutButton";
import { ToastBoard } from "@/components/ui/ToastBoard";
import { PageActions, PageHead, PageTitleGroup, Stack } from "@/components/ui/Page";
import { TextLink } from "@/components/ui/TextLink";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { ProfileSummary } from "@/server/services/getProfileSummary";
import { DeletionCard } from "./DeletionCard";
import { IdentityCard } from "./IdentityCard";
import { NicknameForm } from "./NicknameForm";
import { PasswordForm } from "./PasswordForm";

/** SCR-14 — wired from `profil/page.tsx`; every write below acts on the session user alone. */
export function ProfileScreen({ profile }: { profile: ProfileSummary }) {
  return (
    <ToastBoard>
      <PageHead>
        <PageTitleGroup>
          <PageTitle>Mój profil</PageTitle>
          <Muted>Dane konta, zmiana hasła i wylogowanie</Muted>
        </PageTitleGroup>
        <PageActions>
          <TextLink href="/moje-fiszki">Moje fiszki</TextLink>
          <SignOutButton>Wyloguj się</SignOutButton>
        </PageActions>
      </PageHead>
      <Stack size="lg">
        <IdentityCard profile={profile} />
        <NicknameForm nickname={profile.nickname} />
        <PasswordForm />
        <DeletionCard />
      </Stack>
    </ToastBoard>
  );
}
