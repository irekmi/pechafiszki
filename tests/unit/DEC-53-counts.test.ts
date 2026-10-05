import { describe, expect, it } from "vitest";
import { countsAndShares } from "@/domain/counts";
import type { FlashcardCountInput } from "@/domain/types";

// DEC-10, DEC-53 — the four tile counters and their whole-percent shares.

describe("DEC-53 — denominator and rounding", () => {
  it("counts every approved card, including one with no progress yet (Nie zaczęte)", () => {
    const cards: FlashcardCountInput[] = [
      { mark: "KNOW" },
      { mark: "REPEAT" },
      { mark: "UNKNOWN" },
      { mark: null },
    ];
    const result = countsAndShares(cards);
    expect(result).toMatchObject({ know: 1, repeat: 1, unknown: 1, notStarted: 1 });
  });

  it("rounds each share independently, and the four shares need not sum to 100", () => {
    const cards: FlashcardCountInput[] = [
      { mark: "KNOW" },
      { mark: "REPEAT" },
      { mark: "UNKNOWN" },
      { mark: null },
      { mark: null },
      { mark: null },
      { mark: null },
    ];
    const result = countsAndShares(cards);
    expect(result).toMatchObject({ knowShare: 14, repeatShare: 14, unknownShare: 14, notStartedShare: 57 });
    const sum = result.knowShare + result.repeatShare + result.unknownShare + result.notStartedShare;
    expect(sum).toBe(99);
  });

  it("returns all zeros over an empty pool, without dividing by zero", () => {
    expect(countsAndShares([])).toEqual({
      know: 0,
      repeat: 0,
      unknown: 0,
      notStarted: 0,
      knowShare: 0,
      repeatShare: 0,
      unknownShare: 0,
      notStartedShare: 0,
    });
  });
});

describe("DEC-10 — a hidden card is still counted in the Umiem tile", () => {
  it("a card marked Umiem counts in `know` whether or not it happens to be hidden", () => {
    // countsAndShares only sees the mark, never hiddenUntil — a hidden card is still mark KNOW.
    const cards: FlashcardCountInput[] = [{ mark: "KNOW" }, { mark: "KNOW" }];
    expect(countsAndShares(cards).know).toBe(2);
  });
});
