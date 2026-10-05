import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

/** `.tile` — the statistic tile of SCR-05 and SCR-13. */
export type TileTone = "neutral" | "know" | "repeat" | "unknown" | "accent";

const DOT: Record<TileTone, string> = {
  neutral: "bg-surface-3",
  know: "bg-know",
  repeat: "bg-repeat",
  unknown: "bg-unknown",
  accent: "bg-gold",
};

type TileProps = {
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  tone?: TileTone;
  href?: string;
  className?: string;
};

export function Tile({ label, value, meta, tone = "neutral", href, className }: TileProps) {
  const accent = tone === "accent";
  const body = (
    <>
      <span
        className={cn("flex items-center gap-2 text-14", accent ? "text-on-brand-muted" : "text-ink-2")}
      >
        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", DOT[tone])} />
        {label}
      </span>
      <span
        className={cn(
          "block font-display font-bold leading-none",
          accent ? "text-60 text-gold" : "text-40 text-ink",
        )}
      >
        {value}
      </span>
      {meta ? (
        <span className={cn("block text-12", accent ? "text-on-brand-muted" : "text-ink-2")}>
          {meta}
        </span>
      ) : null}
    </>
  );
  const classes = cn(
    "flex flex-col gap-2 text-left w-full border-2 border-ink rounded-md shadow-hard p-4.5",
    "font-sans no-underline transition duration-100",
    accent ? "bg-brand text-on-brand" : "bg-surface text-ink",
    href && "cursor-pointer hover:-translate-y-0.5 hover:shadow-hard-lg",
    className,
  );
  if (!href) return <div className={classes}>{body}</div>;
  return (
    <Link href={href} className={classes}>
      {body}
    </Link>
  );
}
