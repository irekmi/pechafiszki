import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthBrand, AuthLinks, AuthShell } from "@/components/auth/AuthShell";
import { SignUpAside } from "@/components/auth/SignUpAside";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Stack } from "@/components/ui/Page";
import { TextLink } from "@/components/ui/TextLink";
import { Hint, Muted, PageTitle } from "@/components/ui/Typography";
import { currentUser } from "@/server/permissions";
import { SIGNED_IN_HOME } from "@/server/routeAccess";

export const metadata: Metadata = { title: "Utwórz konto — Fiszki na rozmowy rekrutacyjne" };

/**
 * SCR-02 — open to a Guest only; a signed-in person is sent on to SCR-05, exactly as the screen's
 * own Access table states. Unlike SCR-01 there is no `?powrot=` here: registration has no address
 * that forced it, so a signed-in visitor always lands on `/start`.
 */
export default async function RejestracjaPage() {
  if (await currentUser()) redirect(SIGNED_IN_HOME);

  return (
    <AuthShell aside={<SignUpAside />}>
      <AuthBrand />
      <Stack size="sm">
        <PageTitle>Utwórz konto</PageTitle>
        <Muted>Wystarczy adres e-mail, pseudonim i hasło.</Muted>
      </Stack>
      <SignUpForm />
      <AuthLinks>
        <Hint>Rejestrując się, zgadzasz się na przechowywanie Twoich ocen fiszek.</Hint>
        <TextLink href="/logowanie">Mam już konto</TextLink>
      </AuthLinks>
    </AuthShell>
  );
}
