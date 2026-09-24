import { ButtonLink } from "@/components/ui/Button";
import { EmptyActions } from "@/components/ui/EmptyState";
import { Page } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";

/** `/` has no screen of its own in the specification — see SQ-01.1. */
export default function Home() {
  return (
    <Page narrow>
      <PageTitle>Fiszki na rozmowy rekrutacyjne</PageTitle>
      <Muted className="mt-4">
        Ucz się odpowiedzi na pytania z rozmów rekrutacyjnych. Zaloguj się, aby zacząć naukę.
      </Muted>
      <EmptyActions className="justify-start">
        <ButtonLink href="/logowanie" variant="primary" size="lg">
          Zaloguj się
        </ButtonLink>
        <ButtonLink href="/rejestracja" size="lg">
          Załóż konto
        </ButtonLink>
      </EmptyActions>
    </Page>
  );
}
