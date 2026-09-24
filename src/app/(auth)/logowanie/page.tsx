import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthBrand, AuthLinks, AuthShell } from "@/components/auth/AuthShell";
import { SignInAside } from "@/components/auth/SignInAside";
import { SignInForm } from "@/components/auth/SignInForm";
import { Stack } from "@/components/ui/Page";
import { TextLink } from "@/components/ui/TextLink";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { currentUser } from "@/server/permissions";
import { safeReturnPath } from "@/server/routeAccess";

export const metadata: Metadata = { title: "Zaloguj się — Fiszki na rozmowy rekrutacyjne" };

/**
 * SCR-01 — the screen every protected address sends a Guest to. A person who is already signed in
 * does not see it: SCR-01's Access table sends them on to SCR-05.
 */
export default async function LogowaniePage({
  searchParams,
}: {
  searchParams: Promise<{ powrot?: string | string[] }>;
}) {
  const requested = (await searchParams).powrot;
  const returnTo = safeReturnPath(Array.isArray(requested) ? requested[0] : requested);

  if (await currentUser()) redirect(returnTo);

  return (
    <AuthShell aside={<SignInAside />}>
      <AuthBrand />
      <Stack size="sm">
        <PageTitle>Zaloguj się</PageTitle>
        <Muted>Fiszki na rozmowy rekrutacyjne dla programistów</Muted>
      </Stack>
      <SignInForm returnTo={returnTo} />
      <AuthLinks>
        <TextLink href="/reset-hasla">Nie pamiętasz hasła?</TextLink>
        <TextLink href="/rejestracja">Utwórz konto</TextLink>
      </AuthLinks>
    </AuthShell>
  );
}
