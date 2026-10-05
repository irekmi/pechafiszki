import { headers } from "next/headers";
import type { SessionUser } from "@/server/permissions";
import { FinishSessionButton } from "@/components/study/FinishSessionButton";
import { TopBarFrame } from "./TopBarFrame";
import { TopBarNav, type NavLink } from "./TopBarNav";
import { UserChip } from "./UserChip";

const BASE_LINKS: NavLink[] = [
  { href: "/", label: "Start" },
  { href: "/fiszki", label: "Fiszki" },
  { href: "/dodaj", label: "Dodaj fiszkę" },
  { href: "/moje-fiszki", label: "Moje fiszki" },
  { href: "/statystyki", label: "Statystyki" },
];

type TopBarProps = { user: SessionUser; pendingQueue?: number; studyingSessionId?: number };

/**
 * SCR-05 element 1, shared by every `(app)` screen (the administration area has its own, `AdminTopBar`). The **Administracja** item and its
 * badge exist in this array only for an administrator (NFR-01) — never rendered and then hidden, so
 * a User's HTML never carries it (AC-07.3). `studyingSessionId` adds **Zakończ sesję** on
 * SCR-06, which closes that session and opens SCR-07 (API-13).
 */
export async function TopBar({ user, pendingQueue, studyingSessionId }: TopBarProps) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  // The mockups mark **Fiszki** active on the study session and its summary (SCR-06, SCR-07).
  const studyScreen = pathname === "/nauka" || pathname.startsWith("/podsumowanie/");
  const navPath = studyScreen ? "/fiszki" : pathname;
  const links: NavLink[] =
    user.role === "ADMIN"
      ? [...BASE_LINKS, { href: "/administracja", label: "Administracja", badge: pendingQueue ?? 0 }]
      : BASE_LINKS;
  return (
    <TopBarFrame
      brand="Fiszki"
      brandHref="/"
      nav={<TopBarNav links={links} pathname={navPath} />}
      right={
        <>
          {studyingSessionId ? <FinishSessionButton sessionId={studyingSessionId} /> : null}
          <UserChip nickname={user.nickname} />
        </>
      }
    />
  );
}
