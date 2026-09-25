import { FilterItem, FilterLabel } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Input";

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

/** One labelled `.select` of the filter bar; the form around it submits on change. */
export function FilterSelect({ id, label, value, options }: FilterSelectProps) {
  return (
    <FilterItem>
      <FilterLabel htmlFor={id}>{label}</FilterLabel>
      <Select
        id={id}
        name={id}
        defaultValue={value}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FilterItem>
  );
}
