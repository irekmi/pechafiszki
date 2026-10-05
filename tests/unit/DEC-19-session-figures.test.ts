import { describe, expect, it } from "vitest";
import { countResetCards } from "@/domain/countResetCards";
import { sessionDurationMinutes } from "@/domain/sessionDuration";
import { unknownCardNote } from "@/domain/unknownCardNote";

// DEC-18, DEC-19, DEC-20 — the small counting rules of SCR-07.

describe("DEC-19 — countResetCards", () => {
  it("counts distinct cards with a reset and ignores markings that reset nothing", () => {
    expect(countResetCards([])).toBe(0);
    expect(
      countResetCards([
        { flashcardId: 1, resetFrom: 3 },
        { flashcardId: 1, resetFrom: 2 },
        { flashcardId: 2, resetFrom: null },
        { flashcardId: 3, resetFrom: 1 },
      ]),
    ).toBe(2);
  });
});

describe("DEC-18 — sessionDurationMinutes", () => {
  const start = new Date("2026-09-25T10:00:00.000Z");
  const at = (ms: number) => new Date(start.getTime() + ms);

  it("rounds to the nearest whole minute", () => {
    expect(sessionDurationMinutes(start, at(0))).toBe(0);
    expect(sessionDurationMinutes(start, at(29_999))).toBe(0);
    expect(sessionDurationMinutes(start, at(30_000))).toBe(1);
    expect(sessionDurationMinutes(start, at(22 * 60_000))).toBe(22);
  });
});

describe("DEC-20 — unknownCardNote", () => {
  const unknown = (id: number, resetFrom: number | null = null) => ({ id, mark: "UNKNOWN" as const, resetFrom });

  it("says the counter was reset, using the last reset of the session", () => {
    expect(unknownCardNote([unknown(5, 3)], [5])).toBe("Licznik „Umiem” wyzerowany z 3");
  });

  it("counts Nie umiem markings up to the session's last one, never later ones", () => {
    expect(unknownCardNote([unknown(5)], [2, 5, 9])).toBe("Oceniona „Nie umiem” po raz drugi");
    expect(unknownCardNote([unknown(5)], [5, 9])).toBe("Pierwszy raz w sesji");
  });
});
