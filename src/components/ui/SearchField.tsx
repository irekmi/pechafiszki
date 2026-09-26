import { SearchIcon } from "./icons";
import { Input } from "./Input";
import { FilterItem, FilterLabel } from "./FilterBar";

type SearchFieldProps = { value: string; onChange: (value: string) => void; placeholder?: string };

/** `.filters__item--grow` with the `.search` field: label, magnifier and the input. */
export function SearchField({ value, onChange, placeholder = "np. domknięcie, useMemo, indeks" }: SearchFieldProps) {
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
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </FilterItem>
  );
}
