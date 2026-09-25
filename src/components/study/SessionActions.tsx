"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { shuffleSessionAction } from "@/server/actions/shuffleSession";
import { ResetFiltersButton } from "./ResetFiltersButton";
import { useStudy } from "./StudyShell";

/**
 * The foot of the navigation card: **Przetasuj** (API-14, DEC-16), **Zacznij od nowa** and
 * **Zakończ sesję**. Until ST-09 builds the summary, **Zakończ sesję** returns to SCR-05.
 */
export function SessionActions({ sessionId }: { sessionId: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { notify } = useStudy();

  function shuffle() {
    startTransition(async () => {
      await shuffleSessionAction({ sessionId });
      notify("Nowa kolejność fiszek");
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" disabled={pending} onClick={shuffle}>
        Przetasuj
      </Button>
      <ResetFiltersButton size="sm" />
      <ButtonLink size="sm" href="/start">
        Zakończ sesję
      </ButtonLink>
    </>
  );
}
