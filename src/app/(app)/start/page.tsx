import { SignOutButton } from "@/components/auth/SignOutButton";
import { EmptyActions } from "@/components/ui/EmptyState";
import { Page } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { requireUser } from "@/server/permissions";

/**
 * A minimal signed-in landing route, sanctioned by ST-03: SCR-05 itself is built in ST-07, which
 * replaces this file. It exists so a successful sign-in has somewhere to land and so **Wyloguj się**
 * — SCR-14's button, built in ST-22 — has a home while the session work is being proved.
 */
export default async function StartPlaceholderPage() {
  const user = await requireUser();
  return (
    <Page narrow>
      <PageTitle>Cześć, {user.nickname}</PageTitle>
      <Muted className="mt-4">Ekran startowy powstaje w kolejnym etapie.</Muted>
      <EmptyActions className="justify-start">
        <SignOutButton size="lg">Wyloguj się</SignOutButton>
      </EmptyActions>
    </Page>
  );
}
