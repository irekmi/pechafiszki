"use client";

import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";
import { MY_CARDS_PATH, type MyCardsStatus } from "@/server/services/myCardsParams";
import type { MyCardsCounts } from "@/server/services/listMyFlashcards";

type MyCardsTabsProps = { counts: MyCardsCounts; status: MyCardsStatus | undefined };

/** SCR-11 element 5 — the four tabs; the chosen one is the `status` parameter of the address (behaviour row 1). */
export function MyCardsTabs({ counts, status }: MyCardsTabsProps) {
  const router = useRouter();
  const items = [
    { id: "all", label: `Wszystkie (${counts.all})` },
    { id: "pending", label: `Oczekujące (${counts.pending})` },
    { id: "approved", label: `Zatwierdzone (${counts.approved})` },
    { id: "rejected", label: `Odrzucone (${counts.rejected})` },
  ];
  return (
    <Tabs
      items={items}
      value={status ?? "all"}
      onChange={(id) => router.push(id === "all" ? MY_CARDS_PATH : `${MY_CARDS_PATH}?status=${id}`, { scroll: false })}
    />
  );
}
