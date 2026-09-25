import { Page, Stack } from "@/components/ui/Page";
import type { CategoryRow } from "@/server/services/listCategories";
import type { SessionQueueResult } from "@/server/services/sessionQueueResult";
import { AllHidden } from "./AllHidden";
import { NoResults } from "./NoResults";
import { StudyFilters } from "./StudyFilters";

type StudyEmptyProps = {
  result: Extract<SessionQueueResult, { status: "empty" }>;
  categories: CategoryRow[];
  marks: { know: number; repeat: number; unknown: number };
};

/** SCR-06's two empty states, from `06-sesja-nauki-pusty.html`: no results, and all hidden. */
export function StudyEmpty({ result, categories, marks }: StudyEmptyProps) {
  const { filters } = result;
  const categoryName = categories.find((category) => category.id === filters.category)?.name ?? null;
  return (
    <Page>
      <Stack>
        <StudyFilters
          key={JSON.stringify(filters)}
          categories={categories}
          marks={marks}
          filters={filters}
          showMarks={false}
        />
        {result.kind === "no-results" ? (
          <NoResults filters={filters} categoryName={categoryName} />
        ) : (
          <AllHidden categoryName={categoryName} returnDate={result.returnDate} />
        )}
      </Stack>
    </Page>
  );
}
