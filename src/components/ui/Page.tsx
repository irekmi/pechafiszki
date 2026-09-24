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

/** `.stack` — the vertical rhythm every screen composes its sections with. */
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
  return <div className={cn("grid", gap, className)}>{children}</div>;
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
