import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { Hint, SectionTitle } from "@/components/ui/Typography";
import type { Mark } from "@/domain/types";
import { formatDate } from "./formatDate";

const MARK_BADGE: Record<Mark, { tone: BadgeTone; label: string }> = {
  KNOW: { tone: "know", label: "Umiem" },
  REPEAT: { tone: "repeat", label: "Do powtórki" },
  UNKNOWN: { tone: "unknown", label: "Nie umiem" },
};

type AboutCardProps = { mark: Mark | null; knowCount: number; lastSeenAt: Date | null };

/** SCR-06 element 12 — the learner's own standing on this card (REQ-02), from API-11. */
export function AboutCard({ mark, knowCount, lastSeenAt }: AboutCardProps) {
  const badge = mark ? MARK_BADGE[mark] : { tone: "neutral" as const, label: "Nie zaczęte" };
  return (
    <Card tint>
      <SectionTitle>O tej fiszce</SectionTitle>
      <Datalist>
        <DatalistRow label="Twoja ocena" value={<Badge tone={badge.tone}>{badge.label}</Badge>} />
        <DatalistRow label="Oceniona „Umiem”" value={`${knowCount} razy z 5`} />
        <DatalistRow label="Ostatnio widziana" value={lastSeenAt ? formatDate(lastSeenAt) : "—"} />
      </Datalist>
      <Hint>Po piątej ocenie „Umiem” fiszka zniknie z sesji na tydzień.</Hint>
    </Card>
  );
}
