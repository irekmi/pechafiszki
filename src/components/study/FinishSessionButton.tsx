import { Button } from "@/components/ui/Button";
import { finishSessionAction } from "@/server/actions/finishSession";

/**
 * **Zakończ sesję** — a form, so it works without script and is one component for the top bar and
 * the navigation card. The action closes the session (API-13) and opens SCR-07.
 */
export function FinishSessionButton({ sessionId }: { sessionId: number }) {
  return (
    <form action={finishSessionAction}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button type="submit" size="sm">
        Zakończ sesję
      </Button>
    </form>
  );
}
