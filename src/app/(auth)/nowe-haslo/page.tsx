import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthBrand, AuthLinks, AuthShell } from "@/components/auth/AuthShell";
import { NoweHasloAside } from "@/components/auth/NoweHasloAside";
import { NoweHasloScreen } from "@/components/auth/NoweHasloScreen";
import { Stack } from "@/components/ui/Page";
import { TextLink } from "@/components/ui/TextLink";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { currentUser } from "@/server/permissions";
import { SIGNED_IN_HOME } from "@/server/routeAccess";
import { validateResetToken } from "@/server/services/validateResetToken";

export const metadata: Metadata = { title: "Ustaw nowe hasło — Fiszki na rozmowy rekrutacyjne" };

/**
 * SCR-04 — Guest-only, reached with `?token=…`. The token is validated once here (API-04) so the
 * client starts in the right one of the two mutually-exclusive states; `NoweHasloScreen`'s own
 * action re-validates it again before writing (API-05, task 7).
 */
export default async function NoweHasloPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  if (await currentUser()) redirect(SIGNED_IN_HOME);

  const requested = (await searchParams).token;
  const token = Array.isArray(requested) ? requested[0] : requested;
  const validation = await validateResetToken(token);

  return (
    <AuthShell aside={<NoweHasloAside />}>
      <AuthBrand />
      <Stack size="sm">
        <PageTitle>Ustaw nowe hasło</PageTitle>
        <Muted>Nowe hasło zacznie działać od razu po zapisaniu.</Muted>
      </Stack>
      <NoweHasloScreen token={token ?? ""} initiallyValid={validation.valid} />
      <AuthLinks>
        <TextLink href="/logowanie">Wróć do logowania</TextLink>
      </AuthLinks>
    </AuthShell>
  );
}
