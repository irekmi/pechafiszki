import { describe, expect, it } from "vitest";
import { queueNeighbours } from "@/server/services/queueNeighbours";

/** SCR-17 — "Zgłoszenie N z M" and the inactive / wrapping Poprzednie / Następne zgłoszenie (AC-15.1, 15.6). */
describe("SCR-17 — queueNeighbours", () => {
  it("counts the position from 1 out of the whole queue", () => {
    expect(queueNeighbours([10, 20, 30], 20)).toEqual({ position: 2, total: 3, previousId: 10, nextId: 30 });
  });

  it("wraps around at both ends", () => {
    expect(queueNeighbours([10, 20, 30], 10)).toMatchObject({ position: 1, previousId: 30, nextId: 20 });
    expect(queueNeighbours([10, 20, 30], 30)).toMatchObject({ position: 3, previousId: 20, nextId: 10 });
  });

  it("two cards point at each other", () => {
    expect(queueNeighbours([1, 2], 1)).toMatchObject({ previousId: 2, nextId: 2 });
  });

  it("a queue of one has neither neighbour: both buttons are inactive", () => {
    expect(queueNeighbours([7], 7)).toEqual({ position: 1, total: 1, previousId: null, nextId: null });
  });

  it("a card that is not in the queue has no position", () => {
    expect(queueNeighbours([1, 2], 3)).toBeNull();
    expect(queueNeighbours([], 3)).toBeNull();
  });
});
