import { describe, expect, it } from "vitest";
import { buildQueue } from "@/domain/buildQueue";
import type { KnownCandidate, NotKnownCandidate } from "@/domain/types";

// DEC-01, DEC-07, DEC-08, DEC-09 — the session queue.

function unknownCard(id: number, lastSeenAt: Date | null = null): NotKnownCandidate {
  return { flashcardId: id, group: "UNKNOWN", lastSeenAt };
}

describe("DEC-08 — draw order: Nie umiem, then Do powtórki, then never-seen", () => {
  it("orders by group first, then least-recently-seen within a group", () => {
    const notKnown: NotKnownCandidate[] = [
      { flashcardId: 1, group: "NOT_STARTED", lastSeenAt: null },
      { flashcardId: 2, group: "REPEAT", lastSeenAt: new Date("2026-09-20T00:00:00Z") },
      { flashcardId: 3, group: "UNKNOWN", lastSeenAt: new Date("2026-09-22T00:00:00Z") },
      { flashcardId: 4, group: "UNKNOWN", lastSeenAt: new Date("2026-09-19T00:00:00Z") },
    ];
    const queue = buildQueue(notKnown, []);
    expect(queue.map((entry) => entry.flashcardId)).toEqual([4, 3, 2, 1]);
  });

  it("a never-seen card sorts before a seen card in the same group", () => {
    const notKnown: NotKnownCandidate[] = [
      { flashcardId: 1, group: "UNKNOWN", lastSeenAt: new Date("2026-09-01T00:00:00Z") },
      { flashcardId: 2, group: "UNKNOWN", lastSeenAt: null },
    ];
    const queue = buildQueue(notKnown, []);
    expect(queue.map((entry) => entry.flashcardId)).toEqual([2, 1]);
  });
});

describe("DEC-01, DEC-07 — reinforcement every fifth position, capped at 20", () => {
  it("flags every fifth position as reinforcement when known cards are available", () => {
    const notKnown = Array.from({ length: 30 }, (_, i) => unknownCard(i + 1));
    const known: KnownCandidate[] = Array.from({ length: 10 }, (_, i) => ({ flashcardId: 1000 + i }));
    const queue = buildQueue(notKnown, known);
    expect(queue).toHaveLength(20);
    const reinforcementPositions = queue.map((e, i) => (e.isReinforcement ? i + 1 : null)).filter(Boolean);
    expect(reinforcementPositions).toEqual([5, 10, 15, 20]);
  });

  it("never exceeds the 20-card cap even with a much larger pool", () => {
    const notKnown = Array.from({ length: 100 }, (_, i) => unknownCard(i + 1));
    expect(buildQueue(notKnown, [])).toHaveLength(20);
  });

  it("is the whole set, unpadded, when the filtered set is smaller than the cap", () => {
    const notKnown = [unknownCard(1), unknownCard(2), unknownCard(3)];
    expect(buildQueue(notKnown, [])).toHaveLength(3);
  });
});

describe("DEC-01 fallback and DEC-09 — hidden known cards may fill reinforcement", () => {
  it("fills a reinforcement position with the next unknown card when no known card exists", () => {
    const notKnown = Array.from({ length: 6 }, (_, i) => unknownCard(i + 1));
    const queue = buildQueue(notKnown, []);
    expect(queue).toHaveLength(6);
    expect(queue.every((entry) => !entry.isReinforcement)).toBe(true);
    expect(queue.map((e) => e.flashcardId)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("a hidden card is still a valid reinforcement candidate (DEC-09)", () => {
    const notKnown = Array.from({ length: 5 }, (_, i) => unknownCard(i + 1));
    const hiddenKnownCard: KnownCandidate = { flashcardId: 999 };
    const queue = buildQueue(notKnown, [hiddenKnownCard]);
    expect(queue[4]).toEqual({ flashcardId: 999, isReinforcement: true });
  });
});
