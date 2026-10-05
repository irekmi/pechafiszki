import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { LibraryMark } from "@/server/services/listFlashcards";

const MARK: Record<LibraryMark, { tone: BadgeTone; label: string }> = {
  know: { tone: "know", label: "Umiem" },
  repeat: { tone: "repeat", label: "Do powtórki" },
  unknown: { tone: "unknown", label: "Nie umiem" },
  new: { tone: "neutral", label: "Nie zaczęte" },
};

/** The learner's marking on a row of SCR-08 (element 11). */
export function MarkBadge({ mark }: { mark: LibraryMark }) {
  return <Badge tone={MARK[mark].tone}>{MARK[mark].label}</Badge>;
}
