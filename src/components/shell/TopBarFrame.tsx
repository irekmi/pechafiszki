import Link from "next/link";
import type { ReactNode } from "react";

type TopBarFrameProps = { brand: string; brandHref: string; nav: ReactNode; right: ReactNode };

/** `.topbar` — the brand, the navigation slot and the right-hand slot, shared by both top bars. */
export function TopBarFrame({ brand, brandHref, nav, right }: TopBarFrameProps) {
  return (
    <header className="sticky top-0 z-40 bg-brand text-on-brand border-b-4 border-gold">
      <div className="max-w-page mx-auto px-4 md:px-6 flex items-center gap-3 md:gap-7 min-h-14.5 md:min-h-16 relative">
        <Link
          href={brandHref}
          className="flex items-center gap-2.5 font-display font-bold text-20 leading-none text-gold no-underline uppercase tracking-brand shrink-0"
        >
          <span className="w-7.5 h-7.5 rounded-sm bg-gold text-brand grid place-items-center font-display font-bold text-15">
            F
          </span>
          {brand}
        </Link>
        {nav}
        <div className="flex items-center gap-3">{right}</div>
      </div>
    </header>
  );
}
