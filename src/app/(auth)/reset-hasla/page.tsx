import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthBrand, AuthLinks, AuthShell } from "@/components/auth/AuthShell";
import { ResetHaslaAside } from "@/components/auth/ResetHaslaAside";
import { ResetHaslaForm } from "@/components/auth/ResetHaslaForm";
import { Stack } from "@/components/ui/Page";
import { TextLink } from "@/components/ui/TextLink";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { currentUser } from "@/server/permissions";
import { SIGNED_IN_HOME } from "@/server/routeAccess";

export const metadata: Metadata = { title: "Reset hasła — Fiszki na rozmowy rekrutacyjne" };

/**
 * SCR-03 — Guest-only; a signed-in person changes their password on SCR-14 instead (ST-22 owns
 * that flow, per the stage file's "Explicitly NOT in this stage").
 */
export default async function ResetHaslaPage() {
  if (await currentUser()) redirect(SIGNED_IN_HOME);

  return (
    <AuthShell aside={<ResetHaslaAside />}>
      <AuthBrand />
      <Stack size="sm">
        <PageTitle>Reset hasła</PageTitle>
        <Muted>
          Podaj adres e-mail swojego konta. Wyślemy na niego link do ustawienia nowego hasła.
        </Muted>
      </Stack>
      <ResetHaslaForm />
      <AuthLinks>
        <TextLink href="/logowanie">Wróć do logowania</TextLink>
        <TextLink href="/rejestracja">Utwórz konto</TextLink>
      </AuthLinks>
    </AuthShell>
  );
}
