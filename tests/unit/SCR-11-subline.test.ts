import { describe, expect, it } from "vitest";
import { myCardsSubline } from "@/components/my-cards/subline";

/** SCR-11 element 2 — the Polish plural of the sub-line, from the counts of API-15. */
describe("SCR-11 — sub-line", () => {
  it("reads as the mockup's example for 22 submissions of which 3 wait", () => {
    expect(myCardsSubline({ all: 22, pending: 3 })).toBe("22 zgłoszenia · 3 oczekują na decyzję administratora");
  });

  it.each([
    [1, 1, "1 zgłoszenie · 1 oczekuje na decyzję administratora"],
    [5, 5, "5 zgłoszeń · 5 oczekuje na decyzję administratora"],
    [12, 12, "12 zgłoszeń · 12 oczekuje na decyzję administratora"],
    [24, 4, "24 zgłoszenia · 4 oczekują na decyzję administratora"],
  ])("%i submissions, %i pending", (all, pending, expected) => {
    expect(myCardsSubline({ all, pending })).toBe(expected);
  });

  it("leaves the pending part out when nothing waits", () => {
    expect(myCardsSubline({ all: 7, pending: 0 })).toBe("7 zgłoszeń");
    expect(myCardsSubline({ all: 0, pending: 0 })).toBe("0 zgłoszeń");
  });
});
