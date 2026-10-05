import { describe, expect, it } from "vitest";
import { averageDecisionDays, formatDecisionDays } from "@/domain/decisionTurnaround";

// DEC-55 — SCR-15's "Średni czas decyzji": the mean of decidedAt − submittedAt, one decimal, comma.

const EPOCH = Date.UTC(2026, 0, 1);
const day = (n: number) => new Date(EPOCH + n * 86_400_000);

describe("averageDecisionDays", () => {
  it("is null for an empty set — the empty-week boundary", () => {
    expect(averageDecisionDays([])).toBeNull();
  });

  it("is the exact span for a single decision", () => {
    const result = averageDecisionDays([{ submittedAt: day(0), decidedAt: day(1.5) }]);
    expect(result).toBeCloseTo(1.5, 10);
  });

  it("is the mean over several decisions, not their sum", () => {
    const decisions = [
      { submittedAt: day(0), decidedAt: day(1) },
      { submittedAt: day(0), decidedAt: day(2) },
      { submittedAt: day(0), decidedAt: day(3) },
    ];
    expect(averageDecisionDays(decisions)).toBeCloseTo(2, 10);
  });

  it("is 0 for a same-day decision, not null — an empty average and a zero average differ", () => {
    expect(averageDecisionDays([{ submittedAt: day(0), decidedAt: day(0) }])).toBe(0);
  });
});

describe("formatDecisionDays", () => {
  it("renders — for null", () => {
    expect(formatDecisionDays(null)).toBe("—");
  });

  it("renders one decimal with a comma, not a full stop", () => {
    expect(formatDecisionDays(1.5)).toBe("1,5 dnia");
  });

  it("renders a whole number with a trailing ,0", () => {
    expect(formatDecisionDays(0)).toBe("0,0 dnia");
  });

  it("rounds to one decimal", () => {
    expect(formatDecisionDays(1.44)).toBe("1,4 dnia");
    expect(formatDecisionDays(1.46)).toBe("1,5 dnia");
  });
});
