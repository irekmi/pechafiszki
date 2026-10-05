import { Notice } from "@/components/ui/Notice";
import { CheckIcon } from "@/components/ui/icons";
import { formatDate } from "@/components/study/formatDate";

/** SCR-07 element 4 — only rendered when the session hid at least one card for a week. */
export function HiddenNotice({ count, returnDate }: { count: number; returnDate: Date | null }) {
  return (
    <Notice tone="success" icon={<CheckIcon />}>
      Fiszki ukryte na tydzień: {count}.
      {returnDate ? ` Wrócą do sesji ${formatDate(returnDate)} z oceną „Do powtórki”.` : null}
    </Notice>
  );
}
