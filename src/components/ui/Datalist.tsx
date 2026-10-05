import type { ReactNode } from "react";
import { cn } from "./cn";

/** `.datalist` — the key/value list of SCR-06, SCR-09 and SCR-20. */
export function Datalist({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid gap-0", className)}>{children}</div>;
}

type DatalistRowProps = {
  label: ReactNode;
  value: ReactNode;
  /** The value sits under its label, left-aligned — for a list too long for the right-hand column. */
  stacked?: boolean;
};

export function DatalistRow({ label, value, stacked }: DatalistRowProps) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4 py-3 border-b border-line last:border-b-0 text-14",
        stacked && "flex-col gap-2",
      )}
    >
      <span className="text-ink-2">{label}</span>
      <span className={cn("font-bold", stacked ? "text-left" : "text-right")}>{value}</span>
    </div>
  );
}
