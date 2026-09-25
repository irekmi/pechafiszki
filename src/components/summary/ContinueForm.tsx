import { Button, type ButtonVariant } from "@/components/ui/Button";
import { startSessionAction } from "@/server/actions/startSession";
import type { SessionFilters } from "@/server/services/sessionFilters";

type ContinueFormProps = { filters: SessionFilters; variant?: ButtonVariant; label?: string; block?: boolean };

/**
 * **Ucz się dalej** — API-10 with the stored filters of the session that just ended (SCR-07
 * behaviour 2), and — with `label` — **Ucz się z tych fiszek** on SCR-08 (API-10 with the library's
 * filters), or **Ucz się z tej kategorii** on SCR-09. The action re-checks the session and validates
 * the three filters again.
 */
export function ContinueForm({ filters, variant, label = "Ucz się dalej", block }: ContinueFormProps) {
  return (
    <form action={startSessionAction}>
      {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
      {filters.mark ? <input type="hidden" name="mark" value={filters.mark} /> : null}
      {filters.query ? <input type="hidden" name="query" value={filters.query} /> : null}
      <Button type="submit" variant={variant} block={block}>
        {label}
      </Button>
    </form>
  );
}
