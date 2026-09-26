import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** DEC-33 — the second administrator's answer. Nothing was overwritten; **Wróć do kolejki** dismisses it. */
export function AlreadyDecided({ onBack }: { onBack: () => void }) {
  return (
    <EmptyState
      inline
      title="Ta fiszka została już oceniona"
      actions={
        <Button variant="primary" onClick={onBack}>
          Wróć do kolejki
        </Button>
      }
    />
  );
}
