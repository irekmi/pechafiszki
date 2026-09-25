import { Card } from "@/components/ui/Card";
import { Progress, ProgressMeta } from "@/components/ui/Progress";

type ProgressCardProps = { position: number; total: number; percent: number; categoryName: string };

/** SCR-06 element 6 — "Fiszka 7 z 24 w sesji" over the progress bar (API-11). */
export function ProgressCard({ position, total, percent, categoryName }: ProgressCardProps) {
  return (
    <Card flat>
      <ProgressMeta
        label={
          <>
            Fiszka <span className="font-bold text-ink">{position}</span> z {total} w sesji
          </>
        }
        value={`Kategoria: ${categoryName}`}
      />
      <Progress percent={percent} />
    </Card>
  );
}
