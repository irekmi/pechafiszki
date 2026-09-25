import { describe, expect, it } from "vitest";
import { summariseSession, unknownCardIds, type SessionEvent } from "@/domain/summariseSession";

// DEC-19, DEC-14 — the four tiles of SCR-07 and the "Nie umiem" list.

const event = (flashcardId: number, mark: SessionEvent["mark"], wasReinforcement = false): SessionEvent => ({
  flashcardId,
  mark,
  wasReinforcement,
});

describe("DEC-19 — summariseSession", () => {
  it("is all zeroes for a session in which nothing was marked", () => {
    expect(summariseSession([])).toEqual({ reviewed: 0, know: 0, knowReinforcements: 0, repeat: 0, unknown: 0 });
  });

  it("counts each card once, in the bucket of its last marking (DEC-14)", () => {
    const counts = summariseSession([event(1, "KNOW"), event(1, "REPEAT"), event(2, "KNOW"), event(2, "KNOW"), event(3, "UNKNOWN")]);
    expect(counts).toEqual({ reviewed: 3, know: 1, knowReinforcements: 0, repeat: 1, unknown: 1 });
  });

  it("reviewed always equals know + repeat + unknown", () => {
    const counts = summariseSession([event(1, "KNOW"), event(2, "REPEAT"), event(3, "UNKNOWN"), event(4, "KNOW"), event(1, "UNKNOWN")]);
    expect(counts.reviewed).toBe(counts.know + counts.repeat + counts.unknown);
  });

  it("knowReinforcements counts only Umiem cards that sat in a reinforcement slot", () => {
    const counts = summariseSession([event(1, "KNOW", true), event(2, "KNOW"), event(3, "REPEAT", true), event(4, "KNOW", true)]);
    expect(counts.know).toBe(3);
    expect(counts.knowReinforcements).toBe(2);
  });

  it("a reinforcement card later marked Nie umiem is no longer in the Umiem reinforcement count", () => {
    expect(summariseSession([event(1, "KNOW", true), event(1, "UNKNOWN", true)]).knowReinforcements).toBe(0);
  });
});

describe("DEC-20 — unknownCardIds", () => {
  it("lists cards whose last marking is Nie umiem, once each, in marking order", () => {
    const ids = unknownCardIds([event(5, "UNKNOWN"), event(6, "KNOW"), event(7, "UNKNOWN"), event(5, "UNKNOWN")]);
    expect(ids).toEqual([7, 5]);
  });

  it("drops a card that was Nie umiem and then Umiem", () => {
    expect(unknownCardIds([event(1, "UNKNOWN"), event(1, "KNOW")])).toEqual([]);
  });
});
