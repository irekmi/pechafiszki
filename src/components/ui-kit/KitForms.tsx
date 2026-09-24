import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, FilterItem, FilterLabel } from "@/components/ui/FilterBar";
import { Input, Select } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { Muted } from "@/components/ui/Typography";
import { KitSection } from "./KitSection";

export function KitForms() {
  return (
      <KitSection title="Filtry, komunikaty, stan pusty">
        <FilterBar>
          <FilterItem grow>
            <FilterLabel htmlFor="kit-query">Szukaj w pytaniach i odpowiedziach</FilterLabel>
            <Input id="kit-query" type="search" placeholder="np. domknięcie, useMemo, indeks" />
          </FilterItem>
          <FilterItem>
            <FilterLabel htmlFor="kit-category">Kategoria</FilterLabel>
            <Select id="kit-category" defaultValue="">
              <option value="">Wszystkie kategorie</option>
            </Select>
          </FilterItem>
        </FilterBar>
        <Notice>Co piąta fiszka w kolejce to powtórka z tych, które już umiesz.</Notice>
        <Notice tone="success">Zapisano ocenę</Notice>
        <Notice tone="warning">Fiszka czeka na zatwierdzenie.</Notice>
        <Notice tone="danger">Nie masz uprawnień do tej operacji.</Notice>
        <EmptyState
          title="Nie ma jeszcze żadnych fiszek"
          text="Wspólna pula jest pusta. Dodaj pierwszą fiszkę."
          actions={<Muted>Wyczyść filtry</Muted>}
        />
      </KitSection>
  );
}
