"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { shuffleSessionAction } from "@/server/actions/shuffleSession";
import { FinishSessionButton } from "./FinishSessionButton";
import { ResetFiltersButton } from "./ResetFiltersButton";
import { useStudy } from "./StudyShell";

/**
 * The foot of the navigation card: **Przetasuj** (API-14, DEC-16), **Zacznij od nowa** and
 * **Zakończ sesję** (API-13, opens SCR-07).
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
      <FinishSessionButton sessionId={sessionId} />
    </>
  );
}
