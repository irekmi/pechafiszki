import { describe, expect, it } from "vitest";
import { unknownNote } from "@/domain/unknownNote";

// DEC-20 — the three note forms under a row of SCR-07's "Nie umiem" list.

describe("DEC-20 — unknownNote", () => {
  it("names the counter a marking reset, whatever the history", () => {
    expect(unknownNote(3, 1)).toBe("Licznik „Umiem” wyzerowany z 3");
    expect(unknownNote(1, 4)).toBe("Licznik „Umiem” wyzerowany z 1");
  });

  it("says it is the first time when the card was never marked Nie umiem before", () => {
    expect(unknownNote(null, 1)).toBe("Pierwszy raz w sesji");
  });

  it("counts the times in total, in ordinal words as the mockup writes them", () => {
    expect(unknownNote(null, 2)).toBe("Oceniona „Nie umiem” po raz drugi");
    expect(unknownNote(null, 3)).toBe("Oceniona „Nie umiem” po raz trzeci");
    expect(unknownNote(null, 10)).toBe("Oceniona „Nie umiem” po raz dziesiąty");
  });

  it("falls back to the number past the tenth", () => {
    expect(unknownNote(null, 11)).toBe("Oceniona „Nie umiem” po raz 11");
  });
});
