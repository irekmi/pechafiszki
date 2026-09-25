import type { ReactNode } from "react";
import { cn } from "./cn";

type CardProps = {
  tint?: boolean;
  flat?: boolean;
  className?: string;
  children: ReactNode;
};

/** `.card` — the panel every screen groups content in. */
export function Card({ tint, flat, className, children }: CardProps) {
  return (
    <section
      className={cn(
        "border-2 border-ink rounded-md p-5.5",
        tint ? "bg-surface-2" : "bg-surface",
        flat ? "shadow-none" : "shadow-hard",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHead({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-4 flex-wrap", className)}>
      {children}
    </div>
  );
}

export function CardFoot({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mt-4.5 pt-3.5 border-t border-line", className)}>{children}</div>
  );
}

/** `.card__head h2` — the title inside a card's head. */
export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h2 className={cn("font-display font-bold text-16 leading-title", className)}>{children}</h2>;
}
