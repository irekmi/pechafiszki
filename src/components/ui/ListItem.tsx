import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

type ListItemProps = {
  /** A row is a link, or — without `href` — a submit button of the form it sits in (SCR-05's **Ucz się**). */
  href?: string;
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  side?: ReactNode;
  note?: ReactNode;
  className?: string;
};

/** `.list-item` — one row of the flashcard lists on SCR-08, SCR-11 and SCR-16. */
export function ListItem({ href, leading, title, meta, side, note, className }: ListItemProps) {
  const classes = cn(
    "flex items-center gap-4 px-5 py-4 bg-surface border-2 border-ink rounded-md",
    "shadow-hard hover:shadow-hard-lg no-underline text-ink",
    !href && "w-full text-left font-sans cursor-pointer",
    className,
  );
  const body = (
    <>
      {leading ? (
        <span className="shrink-0 w-auto md:w-42 flex justify-center">{leading}</span>
      ) : null}
      <span className="flex-1 min-w-0 grid gap-1.5">
        <span className="font-bold text-15">{title}</span>
        {meta ? (
          <span className="flex gap-2.5 flex-wrap items-center text-13 text-ink-3">{meta}</span>
        ) : null}
        {note ? (
          <span className="mt-2.5 px-3.5 py-2.5 rounded-sm bg-unknown-soft text-unknown-ink text-13">
            {note}
          </span>
        ) : null}
      </span>
      {side ? <span className="flex gap-2 items-center shrink-0">{side}</span> : null}
    </>
  );
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <button type="submit" className={classes}>
      {body}
    </button>
  );
}

/** `.list` — the stack the rows sit in. */
export function List({ children }: { children: ReactNode }) {
  return <div className="grid gap-3">{children}</div>;
}
