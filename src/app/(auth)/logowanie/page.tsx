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
import { resolveLogowanieNotice } from "./notices";

export const metadata: Metadata = { title: "Zaloguj się — Fiszki na rozmowy rekrutacyjne" };

/**
 * SCR-01 — the screen every protected address sends a Guest to. A person who is already signed in
 * does not see it: SCR-01's Access table sends them on to SCR-05. `?zmiana=` carries a fixed notice
 * code (`notices.ts`) — first used by SCR-04's post-reset redirect (behaviour row 3).
 */
export default async function LogowaniePage({
  searchParams,
}: {
  searchParams: Promise<{ powrot?: string | string[]; zmiana?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = params.powrot;
  const returnTo = safeReturnPath(Array.isArray(requested) ? requested[0] : requested);
  const zmiana = params.zmiana;
  const notice = resolveLogowanieNotice(Array.isArray(zmiana) ? zmiana[0] : zmiana);

  if (await currentUser()) redirect(returnTo);

  return (
    <AuthShell aside={<SignInAside />}>
      <AuthBrand />
      <Stack size="sm">
        <PageTitle>Zaloguj się</PageTitle>
        <Muted>Fiszki na rozmowy rekrutacyjne dla programistów</Muted>
      </Stack>
      <SignInForm returnTo={returnTo} initialNotice={notice} />
      <AuthLinks>
        <TextLink href="/reset-hasla">Nie pamiętasz hasła?</TextLink>
        <TextLink href="/rejestracja">Utwórz konto</TextLink>
      </AuthLinks>
    </AuthShell>
  );
}
