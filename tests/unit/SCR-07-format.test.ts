import { describe, expect, it } from "vitest";
import { formatStart } from "@/components/summary/formatStart";
import { pluralPl } from "@/components/summary/pluralPl";

// SCR-07 — the copy that depends on a number, and the start time of the sub-line.

const minutes = (n: number) => `${n} ${pluralPl(n, "minuta", "minuty", "minut")}`;

describe("SCR-07 — pluralPl", () => {
  it.each([
    [0, "0 minut"],
    [1, "1 minuta"],
    [2, "2 minuty"],
    [4, "4 minuty"],
    [5, "5 minut"],
    [12, "12 minut"],
    [14, "14 minut"],
    [22, "22 minuty"],
    [25, "25 minut"],
  ])("%i is written %s", (count, expected) => {
    expect(minutes(count)).toBe(expected);
  });
});

describe("SCR-07 — formatStart", () => {
  it("writes `22 września 2026, 19:41` in Europe/Warsaw", () => {
    expect(formatStart(new Date("2026-09-22T17:41:00Z"))).toBe("22 września 2026, 19:41");
  });
});
