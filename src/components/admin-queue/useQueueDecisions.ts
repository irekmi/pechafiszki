"use client";

import { useState, useTransition } from "react";
import { approveFlashcardAction } from "@/server/actions/approveFlashcard";
import { rejectFlashcardAction } from "@/server/actions/rejectFlashcard";
import type { DecisionResult } from "@/server/services/recordDecision";
import { REASON_REQUIRED } from "@/server/services/rejectReason";

type Decide = {
  approve: (id: number) => Promise<DecisionResult>;
  reject: (id: number, reason: string) => Promise<DecisionResult>;
  /** SCR-17 moves on to the next submission once a decision was recorded. */
  onDone?: (result: DecisionResult) => void;
};

const QUEUE_ACTIONS: Decide = {
  approve: (id) => approveFlashcardAction({ id }),
  reject: (id, reason) => rejectFlashcardAction({ id, rejection_reason: reason }),
};

/**
 * The state of a decision screen — SCR-16's rows, and SCR-17 with its own actions: which card is in
 * flight (its buttons are disabled), the toast, the card being rejected and the modal's message, and
 * DEC-33's "already reviewed" panel. The decisions themselves are the server's; this only shows what
 * came back.
 */
export function useQueueDecisions({ approve, reject, onDone }: Decide = QUEUE_ACTIONS) {
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [alreadyDecided, setAlreadyDecided] = useState(false);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [finished, setFinished] = useState(false);

  function run(id: number, call: () => Promise<DecisionResult>, done: string) {
    setBusyId(id);
    startTransition(async () => {
      try {
        const result = await call();
        if (result.ok) {
          setToast(done);
          setRejecting(null);
          setFinished(true);
          onDone?.(result);
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
    /** A decision was recorded; SCR-17 keeps its buttons off while it navigates away. */
    finished,
    toast,
    alreadyDecided,
    rejecting,
    reasonError,
    approve: (id: number) => run(id, () => approve(id), "Fiszka zatwierdzona"),
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
      run(id, () => reject(id, reason), "Fiszka odrzucona");
    },
    hideToast: () => setToast(null),
    dismissAlreadyDecided: () => setAlreadyDecided(false),
  };
}
