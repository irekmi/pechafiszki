import type { ReactNode } from "react";
import { cn } from "./cn";

/** `.code` — the code example block. `light` is the `.code--light` variant. */
export function Code({
  light,
  className,
  children,
}: {
  light?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <pre
      className={cn(
        "m-0 px-5.5 py-5 overflow-x-auto rounded-md font-mono text-code leading-code",
        light ? "bg-surface-2 text-ink border border-line" : "bg-brand-2 text-code-ink",
        className,
      )}
    >
      {children}
    </pre>
  );
}
