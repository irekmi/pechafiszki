import { SignOutButton } from "@/components/auth/SignOutButton";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot, CardHead, CardTitle } from "@/components/ui/Card";
import { Row } from "@/components/ui/Page";
import { Muted } from "@/components/ui/Typography";

/** SCR-14 element 8 — the way to SCR-23; **Wyloguj się** appears a second time here (element 3). */
export function DeletionCard() {
  return (
    <Card>
      <CardHead>
        <CardTitle>Usunięcie konta</CardTitle>
      </CardHead>
      <Muted>Usunięcie konta jest nieodwracalne. Stracisz oceny fiszek, statystyki i historię sesji.</Muted>
      <CardFoot>
        <Row between>
          <SignOutButton>Wyloguj się</SignOutButton>
          <ButtonLink href="/profil/usun-konto" variant="danger">
            Usuń konto
          </ButtonLink>
        </Row>
      </CardFoot>
    </Card>
  );
}
