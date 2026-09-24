import { Button, ButtonLink } from "@/components/ui/Button";
import { Row } from "@/components/ui/Page";
import { KitSection } from "./KitSection";

export function KitButtons() {
  return (
    <KitSection title="Przyciski">
      <Row>
        <Button variant="primary" size="lg">
          Zacznij naukę
        </Button>
        <ButtonLink href="/ui-kit" size="lg">
          Przeglądaj fiszki
        </ButtonLink>
        <Button>Zapisz</Button>
        <Button variant="ghost">Anuluj</Button>
        <Button variant="danger">Usuń</Button>
        <Button variant="danger-solid">Usuń konto</Button>
        <Button size="sm">Przetasuj</Button>
        <Button disabled>Niedostępne</Button>
      </Row>
    </KitSection>
  );
}
