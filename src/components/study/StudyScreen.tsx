import { Badge } from "@/components/ui/Badge";
import { Notice } from "@/components/ui/Notice";
import { Grid, Page, Stack } from "@/components/ui/Page";
import { InfoIcon } from "@/components/ui/icons";
import { Hint } from "@/components/ui/Typography";
import type { CategoryRow } from "@/server/services/listCategories";
import type { SessionQueueResult } from "@/server/services/sessionQueueResult";
import { AboutCard } from "./AboutCard";
import { MarkButtons } from "./MarkButtons";
import { NavCard } from "./NavCard";
import { ProgressCard } from "./ProgressCard";
import { StudyCard } from "./StudyCard";
import { StudyFilters } from "./StudyFilters";

type StudyScreenProps = {
  queue: Extract<SessionQueueResult, { status: "ok" }>;
  categories: CategoryRow[];
  marks: { know: number; repeat: number; unknown: number };
};

/** SCR-06 — the study session, ported from `06-sesja-nauki.html` (DEV-01, DEV-02, DEV-03). */
export function StudyScreen({ queue, categories, marks }: StudyScreenProps) {
  const { card, filters, position, total } = queue;
  const previousHref = position > 1 ? `/nauka?cursor=${position - 2}` : null;
  const nextHref = `/nauka?cursor=${position}`;
  const selected = categories.find((category) => category.id === filters.category);

  return (
    <Page>
      <Stack>
        <StudyFilters key={JSON.stringify(filters)} categories={categories} marks={marks} filters={filters} />
        <Grid cols={2}>
          <Stack>
            <ProgressCard
              position={position}
              total={total}
              percent={queue.progressPercent}
              categoryName={selected?.name ?? "Wszystkie"}
            />
            <StudyCard
              question={card.question}
              answer={card.answer}
              codeExample={card.codeExample}
              previousHref={previousHref}
              nextHref={nextHref}
              badges={
                <>
                  <Badge tone="category">{card.category.name}</Badge>
                  {queue.isReinforcement ? <Badge tone="repeat">Powtórka</Badge> : null}
                </>
              }
            />
            <MarkButtons flashcardId={card.id} sessionId={queue.sessionId} />
          </Stack>
          <Stack>
            <NavCard sessionId={queue.sessionId} previousHref={previousHref} nextHref={nextHref} />
            <AboutCard mark={queue.mark} knowCount={queue.knowCount} lastSeenAt={queue.lastSeenAt} />
            <Notice icon={<InfoIcon />}>
              Co piąta fiszka w kolejce to powtórka z tych, które już umiesz. Poznasz ją po plakietce „Powtórka”.
            </Notice>
            <Hint>
              Na telefonie przesuń fiszkę w lewo lub w prawo, aby przejść do następnej albo poprzedniej.
            </Hint>
          </Stack>
        </Grid>
      </Stack>
    </Page>
  );
}
