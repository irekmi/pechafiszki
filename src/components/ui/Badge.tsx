import type { ReactNode } from "react";
import { cn } from "./cn";

/** `.badge` from the mockups' styles.css. Tone names follow its modifier names. */
export type BadgeTone =
  | "neutral"
  | "category"
  | "know"
  | "repeat"
  | "unknown"
  | "hidden"
  | "admin"
  | "you";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-neutral-soft text-ink-2",
  category: "bg-accent-soft text-brand",
  know: "bg-know-soft text-know-ink",
  repeat: "bg-repeat-soft text-repeat-ink",
  unknown: "bg-unknown-soft text-unknown-ink",
  hidden: "bg-surface-3 text-ink-2",
  admin: "bg-brand text-gold",
  you: "bg-gold text-ink",
};

type BadgeProps = {
  tone?: BadgeTone;
  size?: "md" | "lg";
  /** The 168 px leading badge of `.list-item`: fills its slot and wraps its text. */
  block?: boolean;
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = "neutral", size = "md", block, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill font-sans font-bold leading-input",
        block ? "w-full justify-center text-center whitespace-normal" : "whitespace-nowrap",
        size === "lg" ? "px-3.5 py-1.25 text-13" : "px-2.5 py-0.75 text-12",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
