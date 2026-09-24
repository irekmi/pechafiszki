import type { ReactNode } from "react";
import { cn } from "./cn";

/** `.field`, `.field__label`, `.field__hint` and `.field__error` from the mockups' styles.css. */

/** What `.field--invalid` does to the control inside it. Pass it to the input's `className`. */
export const INVALID_FIELD_CLASS = "border-cta shadow-invalid";

type FieldProps = {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("grid gap-1.75", className)}>
      <label className="text-13 font-bold text-ink" htmlFor={htmlFor}>
        {label}
      </label>
      {hint ? <p className="text-12 text-ink-3">{hint}</p> : null}
      {children}
      {error ? <p className="text-13 font-semibold text-cta-ink">{error}</p> : null}
    </div>
  );
}
