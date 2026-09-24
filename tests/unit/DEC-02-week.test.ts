import { describe, expect, it } from "vitest";
import { countMemorisedInWeek, weekBounds } from "@/domain/week";

// DEC-02, DEC-06 — the Monday-to-Sunday week, Europe/Warsaw, across a daylight-saving change.

describe("DEC-06 — week bounds in an ordinary week", () => {
  it("Monday 00:00 to Sunday 23:59:59.999, Europe/Warsaw, expressed as UTC", () => {
    const bounds = weekBounds(new Date("2026-09-24T10:00:00Z"));
    expect(bounds.start).toEqual(new Date("2026-09-20T22:00:00.000Z"));
    expect(bounds.end).toEqual(new Date("2026-09-27T21:59:59.999Z"));
  });
});

describe("DEC-06 — week bounds across a daylight-saving change", () => {
  it("spring forward (2026-03-29, CET to CEST) still starts and ends at the right UTC instant", () => {
    const bounds = weekBounds(new Date("2026-03-25T10:00:00Z"));
    expect(bounds.start).toEqual(new Date("2026-03-22T23:00:00.000Z"));
    expect(bounds.end).toEqual(new Date("2026-03-29T21:59:59.999Z"));
  });

  it("fall back (2026-10-25, CEST to CET) still starts and ends at the right UTC instant", () => {
    const bounds = weekBounds(new Date("2026-10-21T10:00:00Z"));
    expect(bounds.start).toEqual(new Date("2026-10-18T22:00:00.000Z"));
    expect(bounds.end).toEqual(new Date("2026-10-25T22:59:59.999Z"));
  });
});

describe("DEC-02 — a card counts in the week of its first-ever Umiem", () => {
  it("includes a card first known at Monday 00:00 Europe/Warsaw", () => {
    const mondayMidnightWarsaw = new Date("2026-09-20T22:00:00.000Z");
    expect(countMemorisedInWeek([mondayMidnightWarsaw], new Date("2026-09-24T10:00:00Z"))).toBe(1);
  });

  it("excludes a card first known at the preceding Sunday 23:59:59 Europe/Warsaw", () => {
    const sundayNightBefore = new Date("2026-09-20T21:59:59.000Z");
    expect(countMemorisedInWeek([sundayNightBefore], new Date("2026-09-24T10:00:00Z"))).toBe(0);
  });

  it("does not count a card again in a later week (only the first-ever Umiem counts)", () => {
    const firstKnownLastWeek = new Date("2026-09-15T10:00:00Z");
    expect(countMemorisedInWeek([firstKnownLastWeek], new Date("2026-09-24T10:00:00Z"))).toBe(0);
  });

  it("ignores a card never marked Umiem (firstKnownAt null)", () => {
    expect(countMemorisedInWeek([null], new Date("2026-09-24T10:00:00Z"))).toBe(0);
  });
});
