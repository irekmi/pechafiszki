import { SearchIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { FilterItem, FilterLabel } from "@/components/ui/FilterBar";

type SearchFieldProps = { value: string; onChange: (value: string) => void };

/** `.filters__item--grow` with the `.search` field: label, magnifier and the input. */
export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <FilterItem grow>
      <FilterLabel htmlFor="query">Szukaj w pytaniach i odpowiedziach</FilterLabel>
      <div className="relative">
        <SearchIcon />
        <Input
          id="query"
          name="query"
          type="search"
          maxLength={100}
          className="pl-10.5"
          placeholder="np. domknięcie, useMemo, indeks"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </FilterItem>
  );
}
