import type { Mark } from "@/domain/types";
import { describe, expect, it } from "vitest";
import { authorName, knowTimes, libraryMark, questionFragment } from "@/components/card-detail/detailFormat";

describe("SCR-09 — detail formatting", () => {
  it("cuts a long question at a word boundary for the breadcrumb", () => {
    expect(questionFragment("Czym jest domknięcie?")).toBe("Czym jest domknięcie?");
    const cut = questionFragment("Czym jest domknięcie i do czego przydaje się w praktyce programisty?");
    expect(cut).toBe("Czym jest domknięcie i do czego…");
    expect(cut.length).toBeLessThanOrEqual(41);
  });

  it("cuts an unbroken string hard", () => {
    expect(questionFragment("x".repeat(80))).toBe(`${"x".repeat(40)}…`);
  });

  it("names a deleted author 'Usunięty użytkownik' (DEC-40)", () => {
    expect(authorName(null)).toBe("Usunięty użytkownik");
    expect(authorName("anna_w")).toBe("anna_w");
  });

  it("uses the Polish plural for the Umiem count", () => {
    expect([0, 1, 2, 5, 22].map(knowTimes)).toEqual(["0 razy", "1 raz", "2 razy", "5 razy", "22 razy"]);
  });

  it("maps no marking to Nie zaczęte", () => {
    const marks: (Mark | null)[] = [null, "KNOW", "REPEAT", "UNKNOWN"];
    expect(marks.map(libraryMark)).toEqual([
      "new",
      "know",
      "repeat",
      "unknown",
    ]);
  });
});
