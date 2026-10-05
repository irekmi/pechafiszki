import Link from "next/link";
import { headers } from "next/headers";
import { cn } from "@/components/ui/cn";

type Item = { href: string; label: string; also?: string[] };

/**
 * `.subnav` — the administration menu (`16-administracja-…html`). SCR-17 sits under **Oczekujące**.
 * SCR-15, SCR-18, SCR-19 and SCR-21 are built in later stages; their links are drawn already, as the
 * mockup has them, and answer SCR-22's 404 until then.
 */
function itemsFor(pending: number): Item[] {
  return [
    { href: "/administracja", label: "Przegląd" },
    { href: "/administracja/oczekujace", label: `Oczekujące (${pending})`, also: ["/administracja/ocena"] },
    { href: "/administracja/fiszki", label: "Wszystkie fiszki" },
    { href: "/administracja/uzytkownicy", label: "Użytkownicy" },
    { href: "/administracja/kategorie", label: "Kategorie" },
  ];
}

function isActive(item: Item, pathname: string): boolean {
  if (item.href === "/administracja") return pathname === item.href;
  return [item.href, ...(item.also ?? [])].some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export async function AdminSubnav({ pending }: { pending: number }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  return (
    <nav aria-label="Menu administracji" className="border-b-2 border-ink bg-surface">
      <div className="max-w-page mx-auto px-6 flex gap-0.5 overflow-x-auto scrollbar-none">
        {itemsFor(pending).map((item) => {
          const active = isActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "px-3.5 py-3.25 text-14 no-underline whitespace-nowrap",
                active ? "text-ink font-bold shadow-underline" : "text-ink-2 font-medium hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
