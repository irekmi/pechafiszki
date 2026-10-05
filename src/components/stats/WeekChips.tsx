"use client";

import { useRouter } from "next/navigation";
import { Chip, Chips } from "@/components/ui/Chip";
import type { WeekOption } from "@/server/services/getStatistics";

const ACTIVE = "bg-gold border-gold text-ink";
const INACTIVE = "bg-transparent border-brand-line-2 text-on-brand hover:bg-transparent";

/** `.tile--accent .chip` — SCR-13's week toggle (DEC-54: exactly these two, nothing stored). */
export function WeekChips({ week }: { week: WeekOption }) {
  const router = useRouter();
  const go = (value: WeekOption) =>
    router.push(value === "current" ? "/statystyki" : "/statystyki?week=previous", { scroll: false });

  return (
    <Chips>
      <Chip active={week === "current"} onClick={() => go("current")} className={week === "current" ? ACTIVE : INACTIVE}>
        Ten tydzień
      </Chip>
      <Chip active={week === "previous"} onClick={() => go("previous")} className={week === "previous" ? ACTIVE : INACTIVE}>
        Poprzedni tydzień
      </Chip>
    </Chips>
  );
}
