import { Card, CardFoot, CardHead, CardTitle } from "@/components/ui/Card";
import { Row } from "@/components/ui/Page";
import { TextLink } from "@/components/ui/TextLink";
import { Muted } from "@/components/ui/Typography";
import type { SessionFilters } from "@/server/services/sessionFilters";
import { SummaryActions } from "./SummaryActions";

/** SCR-07 element 6 — the tinted what-next card with the second pair of actions. */
export function WhatNext({ filters }: { filters: SessionFilters }) {
  return (
    <Card tint>
      <CardHead>
        <CardTitle>Co dalej</CardTitle>
        <TextLink href="/statystyki">Zobacz moje statystyki</TextLink>
      </CardHead>
      <Muted>Kolejna sesja z tymi samymi filtrami zacznie się od fiszek, których nie umiesz.</Muted>
      <CardFoot>
        <Row>
          <SummaryActions filters={filters} primary="continue" />
        </Row>
      </CardFoot>
    </Card>
  );
}
