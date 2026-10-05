"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlreadyDecided } from "@/components/admin-queue/AlreadyDecided";
import { RejectModal } from "@/components/admin-queue/RejectModal";
import { useQueueDecisions } from "@/components/admin-queue/useQueueDecisions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Page";
import { Toast } from "@/components/ui/Toast";
import { SectionTitle } from "@/components/ui/Typography";
import { approveAndAdvanceAction, rejectAndAdvanceAction } from "@/server/actions/reviewSubmission";
import { QUEUE_PATH } from "@/server/services/adminQueueParams";
import type { DecisionResult } from "@/server/services/recordDecision";
import { CategoryField } from "./CategoryField";

const REJECT_TEXT = "Powód jest wymagany. Autor zobaczy go w „Moich fiszkach” i będzie mógł poprawić zgłoszenie.";

type DecisionPanelProps = {
  id: number;
  categoryId: number;
  categories: { id: number; name: string }[];
  /** The card is no longer pending: nothing can be decided (DEC-33). */
  decided: boolean;
};

/** After a recorded decision the action names the next address — the next submission, or SCR-16. */
function nextOf(result: DecisionResult): string | null {
  return "next" in result && typeof result.next === "string" ? result.next : null;
}

/** SCR-17 elements 6-9 and 11: the category, **Zatwierdź**, **Odrzuć**, **Edytuj** and the reject modal. */
export function DecisionPanel({ id, categoryId, categories, decided }: DecisionPanelProps) {
  const router = useRouter();
  const [category, setCategory] = useState(String(categoryId));
  const state = useQueueDecisions({
    approve: (cardId) => approveAndAdvanceAction({ id: cardId, category: Number(category) }),
    reject: (cardId, reason) => rejectAndAdvanceAction({ id: cardId, rejection_reason: reason }),
    onDone: (result) => {
      const next = nextOf(result);
      if (next) router.push(next);
    },
  });
  const off = state.busyId !== null || state.finished;

  function submit(event: FormEvent) {
    event.preventDefault();
    state.approve(id);
  }

  return (
    <Card>
      <SectionTitle>Decyzja</SectionTitle>
      {decided || state.alreadyDecided ? (
        <AlreadyDecided href={QUEUE_PATH} />
      ) : (
        <form onSubmit={submit}>
          <Stack size="sm">
            <CategoryField
              categories={categories}
              value={category}
              error={state.rejecting === null ? state.reasonError : undefined}
              onChange={setCategory}
            />
            <CardFoot className="grid gap-3">
              <Button type="submit" variant="primary" block disabled={off}>
                Zatwierdź
              </Button>
              <Button variant="danger" block disabled={off} onClick={() => state.openReject(id)}>
                Odrzuć
              </Button>
              <ButtonLink block href={`/edytuj/${id}`}>
                Edytuj
              </ButtonLink>
            </CardFoot>
          </Stack>
        </form>
      )}
      {state.rejecting !== null ? (
        <RejectModal
          text={REJECT_TEXT}
          busy={off}
          error={state.reasonError}
          onCancel={state.closeReject}
          onSubmit={state.submitReject}
          onEdit={state.clearReasonError}
        />
      ) : null}
      <Toast message={state.toast} onHide={state.hideToast} />
    </Card>
  );
}
