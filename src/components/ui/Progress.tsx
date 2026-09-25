import type { ReactNode } from "react";
import { cn } from "./cn";
import type { TileTone } from "./Tile";

type ProgressBarTone = Extract<TileTone, "know" | "repeat" | "unknown"> | "brand";

const BAR_TONE: Record<ProgressBarTone, string> = {
  brand: "bg-brand",
  know: "bg-know",
  repeat: "bg-repeat",
  unknown: "bg-unknown",
};

type ProgressProps = {
  /** 0–100; clamped so a caller's rounding error never paints past the track. */
  percent: number;
  tone?: ProgressBarTone;
  large?: boolean;
  className?: string;
};

/** `.progress` / `.progress__bar` — the bar of SCR-05's weekly card and SCR-08's table rows. */
export function Progress({ percent, tone = "brand", large, className }: ProgressProps) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "rounded-pill bg-surface-2 overflow-hidden",
        large ? "h-5.5 border-2 border-ink" : "h-2.5",
        className,
      )}
    >
      <div className={cn("h-full", BAR_TONE[tone])} style={{ width: `${width}%` }} />
    </div>
  );
}

/** `.progress-meta` — the label/value line above a `Progress` bar. */
export function ProgressMeta({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-13 text-ink-2 mb-1.5">
      <span>{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}
