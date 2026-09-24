import { describe, expect, it } from "vitest";
import { expireHide, isHidden } from "@/domain/hide";
import type { ProgressRecord } from "@/domain/types";

// DEC-04, DEC-05, DEC-06, DEC-11 — the week-long hide and its expiry.

const HIDDEN_UNTIL = new Date("2026-10-01T10:00:00.000Z");

function hiddenCard(): ProgressRecord {
  return { mark: "KNOW", knowCount: 5, hiddenUntil: HIDDEN_UNTIL, firstKnownAt: new Date("2026-09-01T00:00:00Z") };
}

describe("DEC-05 — hidden at the last instant, visible at the first", () => {
  it("is hidden one millisecond before hiddenUntil", () => {
    expect(isHidden(hiddenCard(), new Date(HIDDEN_UNTIL.getTime() - 1))).toBe(true);
  });

  it("is visible exactly at hiddenUntil", () => {
    expect(isHidden(hiddenCard(), HIDDEN_UNTIL)).toBe(false);
  });

  it("a card with no hiddenUntil is never hidden", () => {
    const never = { mark: "UNKNOWN" as const, knowCount: 0, hiddenUntil: null, firstKnownAt: null };
    expect(isHidden(never, new Date())).toBe(false);
  });
});

describe("DEC-04, DEC-11 — the state a card returns to when the week ends", () => {
  it("stays untouched while still hidden", () => {
    const before = new Date(HIDDEN_UNTIL.getTime() - 1);
    expect(expireHide(hiddenCard(), before)).toEqual(hiddenCard());
  });

  it("returns to Do powtórki with the counter at 0, at the first moment of visibility", () => {
    const result = expireHide(hiddenCard(), HIDDEN_UNTIL);
    expect(result.mark).toBe("REPEAT");
    expect(result.knowCount).toBe(0);
    expect(result.hiddenUntil).toBeNull();
  });

  it("preserves firstKnownAt across the expiry, since DEC-02 fixes it forever", () => {
    const card = hiddenCard();
    const result = expireHide(card, HIDDEN_UNTIL);
    expect(result.firstKnownAt).toEqual(card.firstKnownAt);
  });

  it("a card never hidden is returned unchanged", () => {
    const untouched: ProgressRecord = { mark: "UNKNOWN", knowCount: 0, hiddenUntil: null, firstKnownAt: null };
    expect(expireHide(untouched, new Date())).toEqual(untouched);
  });
});
