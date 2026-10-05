import { describe, expect, it } from "vitest";
import { applyMark } from "@/domain/applyMark";
import type { ProgressRecord } from "@/domain/types";

// DEC-03, DEC-05, DEC-09, DEC-14 — applyMark, the study rules for one marking.

const NOW = new Date("2026-09-24T10:00:00.000Z");

function progress(overrides: Partial<ProgressRecord> = {}): ProgressRecord {
  return { mark: "UNKNOWN", knowCount: 0, hiddenUntil: null, firstKnownAt: null, ...overrides };
}

describe("DEC-03 — Do powtórki / Nie umiem reset the Umiem counter", () => {
  it("resets a streak of 4 to 0 and reports what it reset from", () => {
    const result = applyMark(progress({ mark: "KNOW", knowCount: 4 }), "REPEAT", NOW, false);
    expect(result.mark).toBe("REPEAT");
    expect(result.knowCount).toBe(0);
    expect(result.resetFrom).toBe(4);
  });

  it("Nie umiem also resets, and clears any hide (DEC-09)", () => {
    const hidden = progress({ mark: "KNOW", knowCount: 5, hiddenUntil: new Date("2026-10-01T10:00:00Z") });
    const result = applyMark(hidden, "UNKNOWN", NOW, false);
    expect(result.knowCount).toBe(0);
    expect(result.hiddenUntil).toBeNull();
    expect(result.resetFrom).toBe(5);
  });

  it("reports no reset when the counter was already 0", () => {
    const result = applyMark(progress({ knowCount: 0 }), "REPEAT", NOW, false);
    expect(result.resetFrom).toBeNull();
  });
});

describe("DEC-05 — the fourth and the fifth consecutive Umiem", () => {
  it("the fourth Umiem leaves the card visible", () => {
    const result = applyMark(progress({ mark: "KNOW", knowCount: 3 }), "KNOW", NOW, false);
    expect(result.knowCount).toBe(4);
    expect(result.hiddenUntil).toBeNull();
  });

  it("the fifth Umiem sets hiddenUntil exactly seven days out", () => {
    const result = applyMark(progress({ mark: "KNOW", knowCount: 4 }), "KNOW", NOW, false);
    expect(result.knowCount).toBe(5);
    expect(result.hiddenUntil).toEqual(new Date("2026-10-01T10:00:00.000Z"));
  });

  it("a sixth Umiem, reached via a reinforcement slot, does not move hiddenUntil again", () => {
    const hiddenSince = new Date("2026-10-01T10:00:00Z");
    const result = applyMark(progress({ mark: "KNOW", knowCount: 5, hiddenUntil: hiddenSince }), "KNOW", NOW, false);
    expect(result.knowCount).toBe(6);
    expect(result.hiddenUntil).toEqual(hiddenSince);
  });

  it("sets firstKnownAt on the first ever Umiem, and never moves it again", () => {
    const first = applyMark(progress(), "KNOW", NOW, false);
    expect(first.firstKnownAt).toEqual(NOW);
    const later = new Date("2026-10-05T10:00:00Z");
    const second = applyMark(progress({ mark: "KNOW", knowCount: 1, firstKnownAt: NOW }), "KNOW", later, false);
    expect(second.firstKnownAt).toEqual(NOW);
  });
});

describe("DEC-14 — Umiem rises at most once per card per session", () => {
  it("a second Umiem on the same card in one session does not raise the counter", () => {
    const result = applyMark(progress({ mark: "KNOW", knowCount: 2 }), "KNOW", NOW, true);
    expect(result.knowCount).toBe(2);
    expect(result.countedTowardsKnow).toBe(false);
  });

  it("the first Umiem in a session does count", () => {
    const result = applyMark(progress({ mark: "KNOW", knowCount: 2 }), "KNOW", NOW, false);
    expect(result.knowCount).toBe(3);
    expect(result.countedTowardsKnow).toBe(true);
  });

  it("a non-Umiem marking never counts towards Umiem", () => {
    const result = applyMark(progress(), "REPEAT", NOW, false);
    expect(result.countedTowardsKnow).toBe(false);
  });
});
