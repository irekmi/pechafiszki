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
          <ButtonLink href="/start">Wróć na start</ButtonLink>
        </>
      }
    />
  );
}

/** The pool is not empty, the filters match nothing; **Wyczyść filtry** drops every parameter. */
export function NoMatch() {
  const router = useRouter();
  return (
    <EmptyState
      art={<NoResultsArt />}
      title="Żadna fiszka nie spełnia Twoich filtrów"
      actions={
        <Button variant="primary" onClick={() => router.push("/fiszki", { scroll: false })}>
          Wyczyść filtry
        </Button>
      }
    />
  );
}
