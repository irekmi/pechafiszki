import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Input";

type CategoryFieldProps = {
  categories: { id: number; name: string }[];
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
};

/** SCR-17 element 6 — the category the card enters the pool under; prefilled with the submitted one. */
export function CategoryField({ categories, value, error, onChange }: CategoryFieldProps) {
  return (
    <Field label="Kategoria" htmlFor="category" hint="Kategorię można zmienić przed zatwierdzeniem." error={error}>
      <Select id="category" name="category" required value={value} onChange={(event) => onChange(event.target.value)}>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}
