"use client";

import type { ReactNode } from "react";
import { List } from "@/components/ui/ListItem";
import { Toast } from "@/components/ui/Toast";
import type { QueueRow as Row } from "@/server/services/listPendingFlashcards";
import { AlreadyDecided } from "./AlreadyDecided";
import { QueueRow } from "./QueueRow";
import { RejectModal } from "./RejectModal";
import { useQueueDecisions } from "./useQueueDecisions";

type QueueBoardProps = {
  rows: Row[];
  decidable: boolean;
  /** The empty state, drawn by the server; shown in place of the list, so the toast outlives the last row. */
  empty?: ReactNode;
};

/**
 * SCR-16's list with everything that reacts to a decision: the toast, the reject modal, DEC-33's
 * panel. It stays mounted when the last row leaves, which is why the empty state comes in as a prop.
 */
export function QueueBoard({ rows, decidable, empty }: QueueBoardProps) {
  const state = useQueueDecisions();
  return (
    <>
      {state.alreadyDecided ? (
        <AlreadyDecided onBack={state.dismissAlreadyDecided} />
      ) : (
        (empty ?? (
          <List>
            {rows.map((row) => (
              <QueueRow
                key={row.id}
                row={row}
                decidable={decidable}
                busy={state.busyId === row.id}
                onApprove={state.approve}
                onReject={state.openReject}
              />
            ))}
          </List>
        ))
      )}
      {state.rejecting !== null ? (
        <RejectModal
          key={state.rejecting}
          busy={state.busyId !== null}
          error={state.reasonError}
          onCancel={state.closeReject}
          onSubmit={state.submitReject}
          onEdit={state.clearReasonError}
        />
      ) : null}
      <Toast message={state.toast} onHide={state.hideToast} />
    </>
  );
}
