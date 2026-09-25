import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot, CardHead, CardTitle } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Typography";

/**
 * SCR-05 element 10 — administrator only. The caller (the page) decides whether to render this at
 * all from the session role (NFR-01); this component carries no permission logic of its own.
 */
export function AdminCard({ pendingQueue }: { pendingQueue: number }) {
  return (
    <Card tint>
      <CardHead>
        <CardTitle>Administracja</CardTitle>
        <Badge tone="admin">Administrator</Badge>
      </CardHead>
      <Muted>
        Fiszki oczekujące na zatwierdzenie: <span className="font-bold text-ink">{pendingQueue}</span>
      </Muted>
      <CardFoot>
        <ButtonLink href="/administracja" variant="primary" block>
          Przejdź do administracji
        </ButtonLink>
      </CardFoot>
    </Card>
  );
}
