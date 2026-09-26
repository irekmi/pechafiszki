import { authorName } from "@/components/card-detail/detailFormat";
import { formatDate } from "@/components/study/formatDate";
import { AlertIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import type { LatestDecision } from "@/server/services/getEditCard";

/**
 * SCR-12 element 5 — the latest rejection, verbatim (a plain text child, so React escapes it). Drawn
 * only while the card is rejected: once it is `PENDING` again the notice is gone (DEC-31).
 */
export function RejectionNotice({ latest }: { latest: LatestDecision }) {
  return (
    <Notice tone="danger" icon={<AlertIcon />}>
      <span className="font-bold">Powód odrzucenia:</span> {latest.reason ?? "brak"} Decyzja:{" "}
      {authorName(latest.decidedBy)}, {formatDate(latest.decidedAt)}.
    </Notice>
  );
}
