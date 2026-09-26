import { ButtonLink } from "@/components/ui/Button";
import { NoSubmissionsArt } from "@/components/ui/EmptyArt";
import { EmptyState } from "@/components/ui/EmptyState";

/** `11-moje-fiszki-pusty.html` — the person has submitted nothing. */
export function MyCardsEmpty() {
  return (
    <EmptyState
      art={<NoSubmissionsArt />}
      title="Nie dodałeś jeszcze żadnej fiszki"
      text="Zgłoś pytanie, które usłyszałeś na rozmowie. Po zatwierdzeniu przez administratora będą się z niego uczyć wszyscy."
      actions={
        <>
          <ButtonLink href="/dodaj" variant="primary" size="lg">
            Dodaj fiszkę
          </ButtonLink>
          <ButtonLink href="/fiszki">Zobacz istniejące fiszki</ButtonLink>
        </>
      }
    />
  );
}
