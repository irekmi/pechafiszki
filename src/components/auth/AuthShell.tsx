import type { ReactNode } from "react";

/**
 * `.auth`, `.auth__aside` and `.auth__main` — the two-column frame SCR-01 … SCR-04 share. The
 * aside's own copy differs per screen, so it is passed in; the frame is not repeated.
 * Below 768 px the aside is not rendered at all (`styles.css`, the 768 px media query).
 */

export function AuthShell({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <aside className="hidden md:grid content-center gap-5.5 bg-brand text-on-brand p-14 border-r-4 border-gold">
        {aside}
      </aside>
      <section className="grid place-items-center px-8 py-12">
        <div className="w-full max-w-100 grid gap-5.5">{children}</div>
      </section>
    </main>
  );
}

/** `.auth__aside-title` */
export function AuthAsideTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-display font-bold text-38 leading-aside text-gold">{children}</p>
  );
}

/** `.auth__aside-text` */
export function AuthAsideText({ children }: { children: ReactNode }) {
  return <p className="text-on-brand-muted max-w-100">{children}</p>;
}

/** `.auth__sample` — decorative, never real data (SCR-01 element 2). */
export function AuthSample({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-2.5 max-w-100 bg-surface text-ink border-2 border-ink rounded-md px-5.5 py-5 shadow-hard-brand">
      {children}
    </div>
  );
}

/** `.auth__brand` with the `.topbar__mark` recoloured for the light panel. */
export function AuthBrand() {
  return (
    <p className="flex items-center gap-2.5 font-display font-bold text-20 leading-none text-brand uppercase tracking-brand">
      <span className="w-7.5 h-7.5 rounded-sm bg-brand text-gold grid place-items-center font-display font-bold text-15 leading-none">
        F
      </span>{" "}
      Fiszki
    </p>
  );
}

/** `.auth__links` */
export function AuthLinks({ children }: { children: ReactNode }) {
  return <div className="flex justify-between gap-3 text-14 flex-wrap">{children}</div>;
}
