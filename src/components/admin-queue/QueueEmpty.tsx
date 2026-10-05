import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AllReviewedArt } from "@/components/ui/EmptyArt";

/** `16-administracja-fiszki-oczekujace-pusty.html`. **Wróć do przeglądu** → SCR-15 (ST-20). */
const OVERVIEW_HREF = "/administracja";

export function QueueEmpty() {
  return (
    <EmptyState
      art={<AllReviewedArt />}
      title="Nic nie czeka na zatwierdzenie"
      text="Cała kolejka jest przejrzana. Nowe zgłoszenia pojawią się tutaj, gdy ktoś doda fiszkę."
      actions={
        <>
          <ButtonLink href={OVERVIEW_HREF} variant="primary">
            Wróć do przeglądu
          </ButtonLink>
          <ButtonLink href="/administracja/fiszki">Zobacz wszystkie fiszki</ButtonLink>
        </>
      }
    />
  );
}
