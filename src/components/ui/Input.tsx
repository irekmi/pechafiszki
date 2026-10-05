import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "./cn";

/** `.input` / `.select` / `.textarea` — the only field styling in the application. */
export const FIELD_CLASS =
  "w-full px-3.5 py-2.75 min-h-11 border-2 border-ink rounded-sm bg-surface text-ink " +
  "font-sans font-normal text-15 leading-input placeholder:text-ink-3 " +
  "read-only:bg-surface-2 read-only:text-ink-2 focus:outline-none focus:shadow-focus";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_CLASS, className)} {...rest} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  // A <select> always matches `:read-only`, so the read-only tint of FIELD_CLASS is undone here.
  return (
    <select
      className={cn(FIELD_CLASS, "appearance-none pr-9.5 cursor-pointer read-only:bg-surface read-only:text-ink", className)}
      {...rest}
    />
  );
}

export function Textarea({
  code,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { code?: boolean }) {
  return (
    <textarea
      className={cn(
        FIELD_CLASS,
        "min-h-28 resize-y",
        code && "font-mono text-code min-h-37.5",
        className,
      )}
      {...rest}
    />
  );
}
