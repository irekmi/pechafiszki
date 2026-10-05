import { describe, expect, it } from "vitest";
import { shuffleTail } from "@/domain/shuffleTail";
import type { QueueEntry } from "@/domain/types";

// DEC-16 — Przetasuj reorders only the part of the queue not yet seen.

function queueOf(count: number): QueueEntry[] {
  return Array.from({ length: count }, (_, i) => ({ flashcardId: i + 1, isReinforcement: false }));
}

/** A deterministic seeded generator — same seed, same sequence, every call. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe("DEC-16 — only the unseen tail moves", () => {
  it("leaves the seen head in place, at the same positions and values", () => {
    const queue = queueOf(10);
    const result = shuffleTail(queue, 3, seededRandom(1));
    expect(result.slice(0, 3)).toEqual(queue.slice(0, 3));
  });

  it("reorders the tail — the set of cards is unchanged, only their order", () => {
    const queue = queueOf(10);
    const result = shuffleTail(queue, 3, seededRandom(1));
    const tailIds = result.slice(3).map((e) => e.flashcardId).sort((a, b) => a - b);
    expect(tailIds).toEqual([4, 5, 6, 7, 8, 9, 10]);
  });

  it("is deterministic: the same random source yields the same order twice", () => {
    const queue = queueOf(10);
    const first = shuffleTail(queue, 3, seededRandom(42));
    const second = shuffleTail(queue, 3, seededRandom(42));
    expect(first).toEqual(second);
  });

  it("a fully-seen queue (seenCount = length) is returned unchanged", () => {
    const queue = queueOf(5);
    expect(shuffleTail(queue, 5, seededRandom(7))).toEqual(queue);
  });
});
