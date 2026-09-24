import type { ReactNode } from "react";
import { cn } from "./cn";

type EmptyStateProps = {
  title: ReactNode;
  text?: ReactNode;
  art?: ReactNode;
  actions?: ReactNode;
  inline?: boolean;
  className?: string;
};

/** `.empty` — the empty state drawn on SCR-08, SCR-11, SCR-13 and SCR-16. */
export function EmptyState({ title, text, art, actions, inline, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        "grid gap-3.5 justify-items-center text-center bg-surface border-2 border-dashed border-ink-3 rounded-lg",
        inline ? "px-6 py-10 shadow-none" : "px-8 py-18",
        className,
      )}
    >
      {art ? <span className="w-33 h-23 text-ink-3">{art}</span> : null}
      <h2 className="font-display font-bold text-24 leading-flat text-brand">{title}</h2>
      {text ? <p className="text-ink-2 max-w-105">{text}</p> : null}
      {actions ? <EmptyActions>{actions}</EmptyActions> : null}
    </section>
  );
}

/** `.empty__actions` — also used by SCR-22, which is why it is exported. */
export function EmptyActions({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex gap-3 mt-2 flex-wrap justify-center", className)}>{children}</div>
  );
}
