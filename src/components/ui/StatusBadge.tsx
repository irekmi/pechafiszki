import type { FlashcardStatus } from "@prisma/client";
import { Badge, type BadgeTone } from "./Badge";

const STATUS: Record<FlashcardStatus, { tone: BadgeTone; label: string }> = {
  APPROVED: { tone: "know", label: "Zatwierdzona" },
  PENDING: { tone: "repeat", label: "Oczekuje" },
  REJECTED: { tone: "unknown", label: "Odrzucona" },
};

/** `.badge--approved` / `--pending` / `--rejected` — the moderation status of a flashcard. */
export function StatusBadge({ status }: { status: FlashcardStatus }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>;
}
