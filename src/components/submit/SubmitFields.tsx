import { Field, INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { Input, Select, Textarea } from "@/components/ui/Input";
import type { SubmitErrors } from "@/server/actions/submitFlashcardState";
import type { CategoryRow } from "@/server/services/listCategories";
import { PLAIN_COPY, SUBMIT_COPY } from "./submitCopy";
import type { SubmitValues } from "./submitValues";

type SubmitFieldsProps = {
  values: SubmitValues;
  errors: SubmitErrors;
  categories: Pick<CategoryRow, "id" | "name">[];
  disabled: boolean;
  /** SCR-12: no hints, placeholders or empty category option. */
  plain?: boolean;
  onChange: (name: keyof SubmitValues, value: string) => void;
};

/** The category select, the question, the answer and the optional code example (SCR-10 el. 3–6, SCR-12). */
export function SubmitFields({ values, errors, categories, disabled, plain, onChange }: SubmitFieldsProps) {
  const copy = plain ? PLAIN_COPY : SUBMIT_COPY;
  const invalid = (message?: string) => (message ? INVALID_FIELD_CLASS : undefined);
  return (
    <>
      <Field label="Kategoria" htmlFor="category" error={errors.category}>
        <Select
          id="category"
          name="category"
          required
          disabled={disabled}
          value={values.category}
          onChange={(event) => onChange("category", event.target.value)}
          className={invalid(errors.category)}
        >
          {copy.emptyOption ? <option value="">{copy.emptyOption}</option> : null}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Pytanie"
        htmlFor="question"
        hint={copy.questionHint}
        error={errors.question}
      >
        <Input
          id="question"
          name="question"
          type="text"
          required
          maxLength={200}
          disabled={disabled}
          placeholder={copy.questionPlaceholder}
          value={values.question}
          onChange={(event) => onChange("question", event.target.value)}
          className={invalid(errors.question)}
        />
      </Field>

      <Field label="Odpowiedź" htmlFor="answer" error={errors.answer}>
        <Textarea
          id="answer"
          name="answer"
          required
          maxLength={1200}
          disabled={disabled}
          placeholder={copy.answerPlaceholder}
          value={values.answer}
          onChange={(event) => onChange("answer", event.target.value)}
          className={invalid(errors.answer)}
        />
      </Field>

      <Field
        label={<>Przykład kodu <span className="font-normal text-ink-3">— opcjonalnie</span></>}
        htmlFor="code_example"
        hint={copy.codeHint}
        error={errors.codeExample}
      >
        <Textarea
          id="code_example"
          name="code_example"
          code
          maxLength={1200}
          disabled={disabled}
          placeholder={copy.codePlaceholder}
          value={values.codeExample}
          onChange={(event) => onChange("codeExample", event.target.value)}
          className={invalid(errors.codeExample)}
        />
      </Field>
    </>
  );
}
