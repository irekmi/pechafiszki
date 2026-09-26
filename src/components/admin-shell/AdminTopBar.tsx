import { TopBarFrame } from "@/components/shell/TopBarFrame";
import { TopBarNav } from "@/components/shell/TopBarNav";
import { UserChip } from "@/components/shell/UserChip";
import { Badge } from "@/components/ui/Badge";
import type { SessionUser } from "@/server/permissions";

/**
 * The administration top bar of every `(admin)` screen (`16-administracja-…html`): the brand,
 * **Wróć do nauki** to SCR-05, the Administrator badge and the user chip. It replaces the learning
 * navigation throughout the area (AC-14.9).
 */
export function AdminTopBar({ user }: { user: SessionUser }) {
  return (
    <TopBarFrame
      brand="Fiszki · administracja"
      brandHref="/administracja"
      nav={<TopBarNav links={[{ href: "/", label: "Wróć do nauki" }]} pathname="" />}
      right={
        <>
          <Badge tone="admin">Administrator</Badge>
          <UserChip nickname={user.nickname} />
        </>
      }
    />
  );
}
