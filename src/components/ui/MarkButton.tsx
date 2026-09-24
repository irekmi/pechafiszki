"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

/** `.btn-mark` — **Umiem** / **Do powtórki** / **Nie umiem** on SCR-06. */
export type MarkTone = "know" | "repeat" | "unknown";

const TONE: Record<MarkTone, string> = {
  know: "bg-know text-white",
  repeat: "bg-repeat text-ink",
  unknown: "bg-unknown text-white",
};

type MarkButtonProps = {
  tone: MarkTone;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

export function MarkButton({ tone, selected, disabled, onClick, children }: MarkButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex-1 min-w-full md:min-w-37.5 min-h-14 inline-flex items-center justify-center gap-2",
        "rounded-md border-2 border-ink font-display font-bold text-16 leading-none cursor-pointer",
        "transition duration-100 active:translate-y-1 active:shadow-none",
        TONE[tone],
        selected
          ? "translate-y-1 shadow-pressed"
          : "shadow-hard-4 hover:-translate-y-0.5 hover:shadow-hard-6",
        "disabled:opacity-45 disabled:cursor-not-allowed",
      )}
    >
      {selected ? <span aria-hidden="true">✓</span> : null}
      {children}
    </button>
  );
}

/** `.btn-group` */
export function ButtonGroup({ children }: { children: ReactNode }) {
  return <div className="flex gap-3 flex-wrap">{children}</div>;
}
