import { describe, expect, it } from "vitest";
import { partitionCandidates, type PoolCandidate } from "@/domain/partitionCandidates";

// SQ-08.1 (pool partition) and SQ-08.2 (known cards, least recently seen first) — provisional until answered.

function card(id: number, mark: PoolCandidate["mark"], over: Partial<PoolCandidate> = {}): PoolCandidate {
  return { flashcardId: id, mark, lastSeenAt: null, hidden: false, ...over };
}

describe("SQ-08.1 — ordinary and reinforcement pools", () => {
  it("not-known cards are ordinary, every known card (hidden too) is reinforcement", () => {
    const pool = partitionCandidates(
      [card(1, "UNKNOWN"), card(2, "KNOW"), card(3, "KNOW", { hidden: true }), card(4, null)],
      false,
    );
    expect(pool.notKnown.map((c) => c.flashcardId)).toEqual([1, 4]);
    expect(pool.known.map((c) => c.flashcardId).sort()).toEqual([2, 3]);
  });

  it("maps a mark to its DEC-08 group, a never-marked card is NOT_STARTED", () => {
    const pool = partitionCandidates([card(1, "UNKNOWN"), card(2, "REPEAT"), card(3, null)], false);
    expect(pool.notKnown.map((c) => c.group)).toEqual(["UNKNOWN", "REPEAT", "NOT_STARTED"]);
  });

  it("with nothing not-known left, non-hidden known cards become ordinary and hidden ones reinforcement", () => {
    const pool = partitionCandidates([card(1, "KNOW"), card(2, "KNOW", { hidden: true })], false);
    expect(pool.notKnown.map((c) => c.flashcardId)).toEqual([1]);
    expect(pool.known.map((c) => c.flashcardId)).toEqual([2]);
  });

  it("the Umiem chip uses the fallback even when not-known cards exist", () => {
    const pool = partitionCandidates([card(1, "KNOW"), card(2, "UNKNOWN")], true);
    expect(pool.notKnown.map((c) => c.flashcardId)).toEqual([1]);
    expect(pool.known).toEqual([]);
  });

  it("an empty candidate list gives two empty pools", () => {
    expect(partitionCandidates([], false)).toEqual({ notKnown: [], known: [] });
  });

  it("all known cards hidden leaves the ordinary pool empty", () => {
    const pool = partitionCandidates([card(1, "KNOW", { hidden: true })], false);
    expect(pool.notKnown).toEqual([]);
  });
});

describe("SQ-08.2 — known cards, least recently seen first", () => {
  it("orders reinforcement by lastSeenAt ascending, never-seen first", () => {
    const pool = partitionCandidates(
      [
        card(1, "KNOW", { lastSeenAt: new Date("2026-09-20T00:00:00Z") }),
        card(2, "KNOW", { lastSeenAt: new Date("2026-09-10T00:00:00Z") }),
        card(3, "KNOW"),
        card(4, "UNKNOWN"),
      ],
      false,
    );
    expect(pool.known.map((c) => c.flashcardId)).toEqual([3, 2, 1]);
  });
});
