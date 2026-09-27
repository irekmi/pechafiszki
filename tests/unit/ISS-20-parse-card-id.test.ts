import { describe, expect, it } from "vitest";
import { parseCardId } from "@/server/services/cardId";

/** ISS-20 / SCR-20 — an address segment is an id only in its canonical spelling; anything else is SCR-22's 404. */
describe("ISS-20 — parseCardId", () => {
  it("reads canonical positive 32-bit integers", () => {
    expect(parseCardId("1")).toBe(1);
    expect(parseCardId("224")).toBe(224);
    expect(parseCardId("2147483647")).toBe(2_147_483_647);
  });

  it("refuses spellings that merely coerce to a number", () => {
    for (const raw of ["1e2", "0x10", "007", "00005", "+5", " 5", "5 ", "1.0", "1_0", "Infinity"]) {
      expect(parseCardId(raw), raw).toBeNull();
    }
  });

  it("refuses zero, negatives, non-numbers, the empty string and ids beyond 32 bits", () => {
    for (const raw of ["0", "-1", "abc", "", "221abc", "NaN", "2147483648"]) {
      expect(parseCardId(raw), raw).toBeNull();
    }
  });
});
