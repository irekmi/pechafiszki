import { describe, expect, it } from "vitest";
import { earliestReturn } from "@/domain/earliestReturn";

// DEC-05 — the "all hidden" empty state names the first day a hidden card returns.

describe("DEC-05 — earliestReturn", () => {
  it("is null when nothing is hidden", () => {
    expect(earliestReturn([])).toBeNull();
  });

  it("is the only date when one card is hidden", () => {
    const date = new Date("2026-10-02T10:00:00Z");
    expect(earliestReturn([date])?.getTime()).toBe(date.getTime());
  });

  it("is the earliest of several dates, whatever the input order", () => {
    const early = new Date("2026-10-02T10:00:00Z");
    const late = new Date("2026-10-05T10:00:00Z");
    expect(earliestReturn([late, early, late])?.getTime()).toBe(early.getTime());
  });
});
