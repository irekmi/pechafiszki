import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot } from "@/components/ui/Card";
import { Row } from "@/components/ui/Page";
import { SectionTitle } from "@/components/ui/Typography";
import { FlipButton } from "./FlipButton";
import { SessionActions } from "./SessionActions";

type NavCardProps = { sessionId: number; previousHref: string | null; nextHref: string };

/** SCR-06 elements 10 and 11 — **Poprzednia** / **Pokaż / ukryj** / **Następna** and the session actions. */
export function NavCard({ sessionId, previousHref, nextHref }: NavCardProps) {
  return (
    <Card>
      <SectionTitle>Nawigacja</SectionTitle>
      <Row>
        {previousHref ? (
          <ButtonLink href={previousHref}>Poprzednia</ButtonLink>
        ) : (
          <Button disabled>Poprzednia</Button>
        )}
        <FlipButton />
        <ButtonLink href={nextHref}>Następna</ButtonLink>
      </Row>
      <CardFoot>
        <Row>
          <SessionActions sessionId={sessionId} />
        </Row>
      </CardFoot>
    </Card>
  );
}
