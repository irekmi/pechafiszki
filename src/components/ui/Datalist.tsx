import type { ReactNode } from "react";
import { cn } from "./cn";

/** `.datalist` — the key/value list of SCR-06, SCR-09 and SCR-20. */
export function Datalist({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid gap-0", className)}>{children}</div>;
}

export function DatalistRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-3 border-b border-line last:border-b-0 text-14">
      <span className="text-ink-2">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}
