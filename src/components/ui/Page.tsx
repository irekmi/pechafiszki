import type { ReactNode } from "react";
import { cn } from "./cn";

type PageProps = { narrow?: boolean; className?: string; children: ReactNode };

/** `.page` — the 1152 px column every signed-in screen sits in. */
export function Page({ narrow, className, children }: PageProps) {
  return (
    <main
      className={cn(
        "mx-auto px-4 pt-5.5 pb-14 md:px-6 md:pt-9 md:pb-18",
        narrow ? "max-w-narrow" : "max-w-page",
        className,
      )}
    >
      {children}
    </main>
  );
}

/** `.page__head` with its title group and actions. */
export function PageHead({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-start md:items-end justify-between gap-6 mb-7 flex-wrap",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageTitleGroup({ children }: { children: ReactNode }) {
  return <div className="grid gap-2">{children}</div>;
}

export function PageActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-y-3 gap-x-5 items-center flex-wrap md:flex-nowrap">{children}</div>
  );
}

/**
 * `.stack` — the vertical rhythm every screen composes its sections with. `*:min-w-0` is the
 * mockup's `.stack > *` rule: a wide child must not stretch the grid column past the page.
 */
export function Stack({
  size = "md",
  className,
  children,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  const gap = size === "sm" ? "gap-3" : size === "lg" ? "gap-8" : "gap-gap";
  return <div className={cn("grid *:min-w-0", gap, className)}>{children}</div>;
}

/**
 * `.grid-2` / `.grid-4` — collapses to a single column (or two, for `cols={4}`) below 768 px, the
 * one breakpoint CLAUDE.md §3 fixes; the mockup's separate 1080 px step is folded into this same one
 * (ISS-01), which loses nothing AC-07.8 checks (1280 px and 400 px, both outside that range).
 */
export function Grid({
  cols,
  className,
  children,
}: {
  cols: 2 | 4;
  className?: string;
  children: ReactNode;
}) {
  const columns = cols === 2 ? "grid-cols-1 md:grid-cols-aside" : "grid-cols-2 md:grid-cols-4";
  return <div className={cn("grid gap-4 *:min-w-0", columns, className)}>{children}</div>;
}

/** `.row` and `.row--between` */
export function Row({
  between,
  className,
  children,
}: {
  between?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex gap-3 items-center flex-wrap", between && "justify-between", className)}>
      {children}
    </div>
  );
}
