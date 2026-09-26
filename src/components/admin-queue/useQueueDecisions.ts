"use client";

import { useState, useTransition } from "react";
import { approveFlashcardAction } from "@/server/actions/approveFlashcard";
import { rejectFlashcardAction } from "@/server/actions/rejectFlashcard";
import type { DecisionResult } from "@/server/services/recordDecision";
import { REASON_REQUIRED } from "@/server/services/rejectReason";

/**
 * The state of SCR-16's decisions: which row is in flight (its buttons are disabled), the toast, the
 * row being rejected and the modal's message, and DEC-33's "already reviewed" panel. The decisions
 * themselves are the server's; this only shows what came back.
 */
export function useQueueDecisions() {
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [alreadyDecided, setAlreadyDecided] = useState(false);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reasonError, setReasonError] = useState<string | undefined>();

  function run(id: number, call: () => Promise<DecisionResult>, done: string) {
    setBusyId(id);
    startTransition(async () => {
      try {
        const result = await call();
        if (result.ok) {
          setToast(done);
          setRejecting(null);
        } else if (result.reason === "already-decided") {
          setAlreadyDecided(true);
          setRejecting(null);
        } else {
          setReasonError(result.message);
        }
      } finally {
        setBusyId(null);
      }
    });
  }

  return {
    busyId,
    toast,
    alreadyDecided,
    rejecting,
    reasonError,
    approve: (id: number) => run(id, () => approveFlashcardAction({ id }), "Fiszka zatwierdzona"),
    openReject: (id: number) => {
      setReasonError(undefined);
      setRejecting(id);
    },
    closeReject: () => setRejecting(null),
    clearReasonError: () => setReasonError(undefined),
    submitReject: (reason: string) => {
      if (rejecting === null) return;
      if (reason.trim() === "") return setReasonError(REASON_REQUIRED);
      const id = rejecting;
      run(id, () => rejectFlashcardAction({ id, rejection_reason: reason }), "Fiszka odrzucona");
    },
    hideToast: () => setToast(null),
    dismissAlreadyDecided: () => setAlreadyDecided(false),
  };
}
