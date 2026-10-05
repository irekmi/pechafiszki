"use client";

import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";
import { QUEUE_PATH, queueQuery, type QueueParams } from "@/server/services/adminQueueParams";
import type { QueueCounts } from "@/server/services/listPendingFlashcards";

/** SCR-16 element 2 — the three tabs; the chosen one is the `tab` parameter, the filters stay (behaviour row 6). */
export function QueueTabs({ counts, params }: { counts: QueueCounts; params: QueueParams }) {
  const router = useRouter();
  const items = [
    { id: "pending", label: `Oczekujące (${counts.pending})` },
    { id: "approved", label: `Zatwierdzone (${counts.approved})` },
    { id: "rejected", label: `Odrzucone (${counts.rejected})` },
  ];
  return (
    <Tabs
      items={items}
      value={params.tab}
      onChange={(id) => {
        const tab = items.find((item) => item.id === id)?.id as QueueParams["tab"] | undefined;
        if (tab) router.push(`${QUEUE_PATH}${queueQuery({ ...params, tab })}`, { scroll: false });
      }}
    />
  );
}
