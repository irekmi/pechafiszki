import type { FormHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/** `.filters` — the filter bar of SCR-08, SCR-11, SCR-16 and SCR-18. */
export function FilterBar({ className, ...rest }: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      className={cn(
        "flex gap-3 items-end flex-wrap px-5 py-4 bg-surface border-2 border-ink rounded-md shadow-hard",
        className,
      )}
      {...rest}
    />
  );
}

export function FilterItem({ grow, children }: { grow?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "grid gap-1.5 min-w-full",
        grow ? "flex-1 md:min-w-65" : "md:min-w-42.5",
      )}
    >
      {children}
    </div>
  );
}

export function FilterLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-12 font-bold text-ink-2">
      {children}
    </label>
  );
}
