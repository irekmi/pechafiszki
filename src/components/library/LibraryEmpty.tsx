"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyPoolArt, NoResultsArt } from "@/components/ui/EmptyArt";
import { EmptyState } from "@/components/ui/EmptyState";

/** `08-biblioteka-fiszek-pusty.html` — no approved flashcard exists at all. */
export function EmptyPool() {
  return (
    <EmptyState
      art={<EmptyPoolArt />}
      title="Nie ma jeszcze żadnych fiszek"
      text="Wspólna pula jest pusta. Dodaj pierwszą fiszkę — po zatwierdzeniu przez administratora pojawi się tutaj i w sesji nauki."
      actions={
        <>
          <ButtonLink href="/dodaj" variant="primary" size="lg">
            Dodaj fiszkę
          </ButtonLink>
          <ButtonLink href="/">Wróć na start</ButtonLink>
        </>
      }
    />
  );
}

/** The filters match nothing; **Wyczyść filtry** drops every parameter (SCR-08 by default, SCR-18 with its own address). */
export function NoMatch({ clearHref = "/fiszki" }: { clearHref?: string }) {
  const router = useRouter();
  return (
    <EmptyState
      art={<NoResultsArt />}
      title="Żadna fiszka nie spełnia Twoich filtrów"
      actions={
        <Button variant="primary" onClick={() => router.push(clearHref, { scroll: false })}>
          Wyczyść filtry
        </Button>
      }
    />
  );
}
