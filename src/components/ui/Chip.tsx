"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

type ChipProps = {
  active?: boolean;
  count?: number;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
};

/** `.chip` — the filter chip, selected one at a time by the group that owns it. */
export function Chip({ active, count, onClick, className, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.75 rounded-pill border-2 font-sans font-semibold text-13 leading-flat cursor-pointer",
        active
          ? "bg-brand border-brand text-gold"
          : "bg-surface border-ink text-ink hover:bg-surface-2",
        className,
      )}
    >
      {children}
      {count === undefined ? null : <span className="text-inherit opacity-70 ml-1.5">{count}</span>}
    </button>
  );
}

/** `.chips` — the row the chips sit in. */
export function Chips({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex gap-2 flex-wrap", className)}>{children}</div>;
}
