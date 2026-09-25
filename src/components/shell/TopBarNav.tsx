"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { BurgerIcon } from "@/components/ui/icons";

export type NavLink = { href: string; label: string; badge?: number };

/**
 * `.topbar__nav` plus `.topbar__burger` (SCR-05 element 1) — the only client-side piece of the
 * shell, because opening the mobile menu is the only interaction here (`app.js`'s `data-burger`
 * toggle, re-implemented in React per CLAUDE.md §3). The admin item, when present, already arrived
 * filtered by the server; this component never decides who sees it.
 */
export function TopBarNav({ links, pathname }: { links: NavLink[]; pathname: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Pokaż menu"
        onClick={() => setOpen((value) => !value)}
        className="hidden max-md:inline-flex items-center justify-center w-10 h-10 ml-auto border border-white/30 rounded-sm bg-transparent text-gold cursor-pointer"
      >
        <BurgerIcon />
      </button>
      <nav
        aria-label="Menu główne"
        className={cn(
          "md:flex md:static md:flex-1 md:flex-row md:items-center md:gap-1 md:bg-transparent",
          "md:border-0 md:px-0 md:py-0",
          open
            ? "flex flex-col items-stretch gap-0.5 absolute top-full inset-x-0 bg-brand border-b-4 border-gold px-3 py-2.5"
            : "hidden",
        )}
      >
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "whitespace-nowrap px-3 py-2 rounded-pill no-underline text-14 font-medium",
                active
                  ? "text-gold font-bold"
                  : "text-on-brand-link hover:bg-white/8 hover:text-white",
              )}
            >
              {link.label}
              {link.badge !== undefined ? " " : null}
              {link.badge !== undefined ? (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 ml-1.5 rounded-pill bg-cta text-white text-11 font-bold font-sans leading-none">
                  {link.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
