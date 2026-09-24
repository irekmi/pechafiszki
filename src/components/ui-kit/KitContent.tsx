import { Badge } from "@/components/ui/Badge";
import { Tile } from "@/components/ui/Tile";
import { KitSection } from "./KitSection";

export function KitContent() {
  return (
    <KitSection title="Plakietki i kafelki">
      <div className="flex gap-2 flex-wrap">
        <Badge tone="category">PHP</Badge>
        <Badge tone="know">Umiem</Badge>
        <Badge tone="repeat">Do powtórki</Badge>
        <Badge tone="unknown">Nie umiem</Badge>
        <Badge tone="hidden">Ukryta do 29.09.2026</Badge>
        <Badge tone="admin">Administrator</Badge>
        <Badge tone="you">To Ty</Badge>
        <Badge>Nie zaczęte</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Tile tone="know" label="Umiem" value="128" meta="41% puli" href="/ui-kit" />
        <Tile tone="repeat" label="Do powtórki" value="64" meta="21% puli" />
        <Tile tone="unknown" label="Nie umiem" value="37" meta="12% puli" />
        <Tile tone="accent" label="Zapamiętane" value="14" meta="w tym tygodniu" />
      </div>
    </KitSection>
  );
}
