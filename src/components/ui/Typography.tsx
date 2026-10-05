import type { ReactNode } from "react";
import { cn } from "./cn";

type TextProps = { className?: string; children: ReactNode };

/** `h1` — 28 px below the breakpoint, 36 px above it, in the brand colour. */
export function PageTitle({ className, children }: TextProps) {
  return (
    <h1 className={cn("font-display font-bold text-28 md:text-36 leading-hero text-brand", className)}>
      {children}
    </h1>
  );
}

/** `.section-title` */
export function SectionTitle({ className, children }: TextProps) {
  return (
    <h2 className={cn("font-display font-bold text-20 leading-flat text-brand mb-3.5", className)}>
      {children}
    </h2>
  );
}

/** `.muted` */
export function Muted({ className, children }: TextProps) {
  return <p className={cn("text-ink-2", className)}>{children}</p>;
}

/** `.hint` */
export function Hint({ className, children }: TextProps) {
  return <p className={cn("text-ink-3 text-13", className)}>{children}</p>;
}

/** `.flashcard__question` — the mockups' question type: 27 px, 21 px below the breakpoint. */
export const QUESTION_CLASS = "font-display font-semibold text-21 md:text-27 leading-card";
