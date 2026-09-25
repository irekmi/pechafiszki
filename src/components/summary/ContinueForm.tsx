import { Button, type ButtonVariant } from "@/components/ui/Button";
import { startSessionAction } from "@/server/actions/startSession";
import type { SessionFilters } from "@/server/services/sessionFilters";

/**
 * **Ucz się dalej** — API-10 with the stored filters of the session that just ended (SCR-07
 * behaviour 2). The action re-checks the session and validates the three filters again.
 */
export function ContinueForm({ filters, variant }: { filters: SessionFilters; variant?: ButtonVariant }) {
  return (
    <form action={startSessionAction}>
      {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
      {filters.mark ? <input type="hidden" name="mark" value={filters.mark} /> : null}
      {filters.query ? <input type="hidden" name="query" value={filters.query} /> : null}
      <Button type="submit" variant={variant}>
        Ucz się dalej
      </Button>
    </form>
  );
}
