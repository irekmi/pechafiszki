"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ButtonGroup, MarkButton } from "@/components/ui/MarkButton";
import { markCardAction } from "@/server/actions/markCard";
import { useStudy } from "./StudyShell";

type Mark = "KNOW" | "REPEAT" | "UNKNOWN";

/**
 * **Umiem** / **Do powtórki** / **Nie umiem** (API-12). The buttons are disabled while the action is
 * in flight; the toast appears only once the marking is saved, and a failed marking shows nothing
 * and leaves the queue where it was.
 */
export function MarkButtons({ flashcardId, sessionId }: { flashcardId: number; sessionId: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { notify } = useStudy();

  function mark(value: Mark) {
    startTransition(async () => {
      try {
        const result = await markCardAction({ flashcardId, mark: value, sessionId });
        if (result.status === "ok") notify("Zapisano ocenę");
        router.refresh();
      } catch {
        // A refused or failed marking: no toast, and the queue does not advance.
      }
    });
  }

  return (
    <ButtonGroup>
      <MarkButton tone="know" disabled={pending} onClick={() => mark("KNOW")}>
        Umiem
      </MarkButton>
      <MarkButton tone="repeat" disabled={pending} onClick={() => mark("REPEAT")}>
        Do powtórki
      </MarkButton>
      <MarkButton tone="unknown" disabled={pending} onClick={() => mark("UNKNOWN")}>
        Nie umiem
      </MarkButton>
    </ButtonGroup>
  );
}
