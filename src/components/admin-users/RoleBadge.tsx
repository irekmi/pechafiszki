import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";

/** The role as the mockups draw it: the brand-coloured **Administrator** badge, the neutral **Użytkownik** one. */
export function RoleBadge({ role }: { role: Role }) {
  return role === "ADMIN" ? <Badge tone="admin">Administrator</Badge> : <Badge>Użytkownik</Badge>;
}

export const roleLabel = (role: Role): string => (role === "ADMIN" ? "Administrator" : "Użytkownik");
