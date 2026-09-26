import Link from "next/link";
import type { ReactNode } from "react";

/** `.table__question` — the question of a row, a link: 700 because `.table td a` outranks the 600 of `.table__question`. */
export function TableQuestion({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-bold text-ink no-underline hover:text-cta-ink">
      {children}
    </Link>
  );
}

/** `.table__sub` — the small line under a question. */
export function TableSub({ children }: { children: ReactNode }) {
  return <span className="block text-13 text-ink-3 mt-0.75">{children}</span>;
}

/** `.table__actions` — the row's buttons, flush right. */
export function TableActions({ children }: { children: ReactNode }) {
  return <span className="flex gap-2 justify-end">{children}</span>;
}
