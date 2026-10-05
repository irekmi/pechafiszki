import { describe, expect, it } from "vitest";
import { reshuffleUnseen } from "@/domain/reshuffleUnseen";
import type { QueueEntry } from "@/domain/types";

// DEC-16 + DEC-01 — Przetasuj moves only the unseen tail and keeps the Powtórka slots in place.

function queueOf(count: number): QueueEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    flashcardId: i + 1,
    isReinforcement: (i + 1) % 5 === 0,
  }));
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe("DEC-16 — reshuffleUnseen", () => {
  it("keeps the current card and everything before it in place", () => {
    const queue = queueOf(20);
    const result = reshuffleUnseen(queue, 6, seededRandom(3));
    expect(result.slice(0, 7)).toEqual(queue.slice(0, 7));
  });

  it("keeps the set of cards and the length", () => {
    const queue = queueOf(20);
    const ids = reshuffleUnseen(queue, 6, seededRandom(3)).map((e) => e.flashcardId);
    expect([...ids].sort((a, b) => a - b)).toEqual(queue.map((e) => e.flashcardId));
  });

  it("leaves every reinforcement flag at the same position (DEC-01 pattern re-applied)", () => {
    const queue = queueOf(20);
    const result = reshuffleUnseen(queue, 1, seededRandom(9));
    expect(result.map((e) => e.isReinforcement)).toEqual(queue.map((e) => e.isReinforcement));
  });

  it("actually reorders the tail", () => {
    const queue = queueOf(20);
    const result = reshuffleUnseen(queue, 1, seededRandom(9));
    expect(result.map((e) => e.flashcardId)).not.toEqual(queue.map((e) => e.flashcardId));
  });

  it("is a no-op on the last card, where nothing is unseen", () => {
    const queue = queueOf(7);
    expect(reshuffleUnseen(queue, 6, seededRandom(1))).toEqual(queue);
  });
});
