import Link from "next/link";
import { headers } from "next/headers";
import type { SessionUser } from "@/server/permissions";
import { ButtonLink } from "@/components/ui/Button";
import { TopBarNav, type NavLink } from "./TopBarNav";

const BASE_LINKS: NavLink[] = [
  { href: "/start", label: "Start" },
  { href: "/fiszki", label: "Fiszki" },
  { href: "/dodaj", label: "Dodaj fiszkę" },
  { href: "/moje-fiszki", label: "Moje fiszki" },
  { href: "/statystyki", label: "Statystyki" },
];

type TopBarProps = { user: SessionUser; pendingQueue?: number; studying?: boolean };

/**
 * SCR-05 element 1, shared by every `(app)`/`(admin)` screen. The **Administracja** item and its
 * badge exist in this array only for an administrator (NFR-01) — never rendered and then hidden, so
 * a User's HTML never carries it (AC-07.3). `studying` adds **Zakończ sesję** on SCR-06 (until
 * ST-09 builds SCR-07 it returns to SCR-05).
 */
export async function TopBar({ user, pendingQueue, studying }: TopBarProps) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  // The mockups mark **Fiszki** active on the study session: SCR-06 is entered from the library.
  const navPath = pathname === "/nauka" ? "/fiszki" : pathname;
  const links: NavLink[] =
    user.role === "ADMIN"
      ? [...BASE_LINKS, { href: "/administracja", label: "Administracja", badge: pendingQueue ?? 0 }]
      : BASE_LINKS;
  const initials = user.nickname.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-brand text-on-brand border-b-4 border-gold">
      <div className="max-w-page mx-auto px-4 md:px-6 flex items-center gap-3 md:gap-7 min-h-14.5 md:min-h-16 relative">
        <Link
          href="/start"
          className="flex items-center gap-2.5 font-display font-bold text-20 leading-none text-gold no-underline uppercase tracking-brand shrink-0"
        >
          <span className="w-7.5 h-7.5 rounded-sm bg-gold text-brand grid place-items-center font-display font-bold text-15">
            F
          </span>
          Fiszki
        </Link>
        <TopBarNav links={links} pathname={navPath} />
        <div className="flex items-center gap-3">
          {studying ? (
            <ButtonLink size="sm" href="/start">
              Zakończ sesję
            </ButtonLink>
          ) : null}
          <Link
            href="/profil"
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 border border-white/20 rounded-pill text-on-brand no-underline text-14 font-medium hover:text-white hover:border-gold"
          >
            <span className="w-8.5 h-8.5 rounded-pill bg-gold text-brand grid place-items-center font-display font-bold text-13 shrink-0">
              {initials}
            </span>
            <span className="hidden md:inline">{user.nickname}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
