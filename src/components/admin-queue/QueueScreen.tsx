import { Page, Stack } from "@/components/ui/Page";
import type { QueueParams } from "@/server/services/adminQueueParams";
import type { CategoryRow } from "@/server/services/listCategories";
import type { PendingQueue } from "@/server/services/listPendingFlashcards";
import { QueueBoard } from "./QueueBoard";
import { QueueEmpty } from "./QueueEmpty";
import { QueueFilters } from "./QueueFilters";
import { QueueHead } from "./QueueHead";
import { QueueTabs } from "./QueueTabs";

type QueueScreenProps = { queue: PendingQueue; params: QueueParams; categories: CategoryRow[] };

/**
 * SCR-16 (`16-administracja-fiszki-oczekujace.html`, DEV-01) or, when nothing at all is pending, its
 * empty state (`…-pusty.html`), which has no filters. A filter that matches nothing leaves the list
 * area empty and the tab counts showing; decided tabs carry no decide buttons (DEC-34).
 */
export function QueueScreen({ queue, params, categories }: QueueScreenProps) {
  const drained = params.tab === "pending" && queue.pendingTotal === 0;
  return (
    <Page>
      <QueueHead pendingTotal={queue.pendingTotal} />
      <Stack>
        <QueueTabs counts={queue.counts} params={{ ...params, category: queue.category }} />
        {drained ? null : <QueueFilters categories={categories} params={{ ...params, category: queue.category }} />}
        <QueueBoard rows={queue.rows} decidable={params.tab === "pending"} empty={drained ? <QueueEmpty /> : undefined} />
      </Stack>
    </Page>
  );
}
