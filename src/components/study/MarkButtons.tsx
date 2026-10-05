"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ButtonGroup, MarkButton } from "@/components/ui/MarkButton";
import { markCardAction } from "@/server/actions/markCard";
import { useStudy } from "./StudyShell";

type Mark = "KNOW" | "REPEAT" | "UNKNOWN";

type MarkButtonsProps = {
  flashcardId: number;
  /** Absent on SCR-09: a marking given outside a session (AQ-001). */
  sessionId?: number;
  /** The caller's current marking, drawn pressed (SCR-09); SCR-06 draws none. */
  selected?: Mark | null;
};

/**
 * **Umiem** / **Do powtórki** / **Nie umiem** (API-12), on SCR-06 and — without a session — SCR-09.
 * The buttons are disabled while the action is in flight; the toast appears only once the marking is
 * saved, and a failed marking shows nothing and leaves the queue where it was.
 */
export function MarkButtons({ flashcardId, sessionId, selected }: MarkButtonsProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { notify } = useStudy();
  const pressed = (value: Mark) => (selected === undefined ? undefined : selected === value);

  function mark(value: Mark) {
    startTransition(async () => {
      try {
        const input = { flashcardId, mark: value, ...(sessionId === undefined ? {} : { sessionId }) };
        const result = await markCardAction(input);
        if (result.status === "ok") notify("Zapisano ocenę");
        router.refresh();
      } catch {
        // A refused or failed marking: no toast, and the queue does not advance.
      }
    });
  }

  return (
    <ButtonGroup>
      <MarkButton tone="know" selected={pressed("KNOW")} disabled={pending} onClick={() => mark("KNOW")}>
        Umiem
      </MarkButton>
      <MarkButton tone="repeat" selected={pressed("REPEAT")} disabled={pending} onClick={() => mark("REPEAT")}>
        Do powtórki
      </MarkButton>
      <MarkButton tone="unknown" selected={pressed("UNKNOWN")} disabled={pending} onClick={() => mark("UNKNOWN")}>
        Nie umiem
      </MarkButton>
    </ButtonGroup>
  );
}
