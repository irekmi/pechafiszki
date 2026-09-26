import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type AlreadyDecidedProps = { onBack: () => void } | { href: string };

/**
 * DEC-33 — the second administrator's answer. Nothing was overwritten. On SCR-16 **Wróć do kolejki**
 * dismisses the panel; on SCR-17 it is the way back to SCR-16.
 */
export function AlreadyDecided(props: AlreadyDecidedProps) {
  return (
    <EmptyState
      inline
      title="Ta fiszka została już oceniona"
      actions={
        "href" in props ? (
          <ButtonLink variant="primary" href={props.href}>
            Wróć do kolejki
          </ButtonLink>
        ) : (
          <Button variant="primary" onClick={props.onBack}>
            Wróć do kolejki
          </Button>
        )
      }
    />
  );
}
