import type { FlashcardStatus } from "@prisma/client";

/** Where a row's question leads (SCR-18 behaviour 2–4): approved → SCR-09, pending → SCR-17, rejected → SCR-12. */
export function rowHref(id: number, status: FlashcardStatus): string {
  if (status === "APPROVED") return `/fiszki/${id}`;
  return status === "PENDING" ? `/administracja/ocena/${id}` : `/edytuj/${id}`;
}
