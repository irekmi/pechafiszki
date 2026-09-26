import { CheckIcon } from "@/components/ui/icons";
import { List } from "@/components/ui/ListItem";
import { Notice } from "@/components/ui/Notice";
import { Page, Stack } from "@/components/ui/Page";
import { Hint } from "@/components/ui/Typography";
import type { MyCardRow as Row, MyCardsCounts } from "@/server/services/listMyFlashcards";
import type { MyCardsStatus } from "@/server/services/myCardsParams";
import { MyCardRow } from "./MyCardRow";
import { MyCardsEmpty } from "./MyCardsEmpty";
import { MyCardsHead } from "./MyCardsHead";
import { MyCardsTabs } from "./MyCardsTabs";

type MyCardsScreenProps = {
  rows: Row[];
  counts: MyCardsCounts;
  status: MyCardsStatus | undefined;
  /** The person has just submitted on SCR-10 (`?zmiana=wyslana`). */
  submitted: boolean;
};

/**
 * SCR-11 — the person's own submissions (`11-moje-fiszki.html`, DEV-01, DEV-03), or the empty state
 * of `11-moje-fiszki-pusty.html`. A tab with no rows leaves the list area empty and keeps every count
 * (States: "empty — a tab").
 */
export function MyCardsScreen({ rows, counts, status, submitted }: MyCardsScreenProps) {
  if (counts.all === 0) {
    return (
      <Page narrow>
        <MyCardsHead counts={counts} withAction={false} />
        <MyCardsEmpty />
      </Page>
    );
  }
  return (
    <Page>
      <MyCardsHead counts={counts} withAction />
      <Stack>
        {submitted ? (
          <Notice tone="success" role="status" icon={<CheckIcon />}>
            Fiszka wysłana do zatwierdzenia
          </Notice>
        ) : null}
        <MyCardsTabs counts={counts} status={status} />
        <List>
          {rows.map((row) => (
            <MyCardRow key={row.id} row={row} />
          ))}
        </List>
        <Hint>
          Zatwierdzoną fiszkę otwiera widok szczegółów. Oczekującą i odrzuconą otwiera formularz edycji, w którym możesz ją poprawić i wysłać ponownie.
        </Hint>
      </Stack>
    </Page>
  );
}
