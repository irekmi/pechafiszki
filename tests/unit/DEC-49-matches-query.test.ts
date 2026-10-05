import { describe, expect, it } from "vitest";
import { foldText, matchesQuery } from "@/domain/matchesQuery";

// DEC-49 — search is case-insensitive, diacritic-insensitive, substring, question and answer only.

describe("DEC-49 — folded substring search", () => {
  it("finds a diacritic word from its plain-ASCII spelling", () => {
    expect(matchesQuery(["Czym jest domknięcie?"], "domkniecie")).toBe(true);
  });

  it("folds ł, which Unicode does not decompose", () => {
    expect(foldText("Łódź")).toBe("lodz");
  });

  it("is case-insensitive in both directions", () => {
    expect(matchesQuery(["useMemo i useCallback"], "USEMEMO")).toBe(true);
  });

  it("matches a substring anywhere in any given field", () => {
    expect(matchesQuery(["pytanie", "odpowiedź o indeksie"], "indeks")).toBe(true);
  });

  it("does not match text absent from every field", () => {
    expect(matchesQuery(["pytanie", "odpowiedź"], "kubernetes")).toBe(false);
  });

  it("treats a blank or whitespace query as matching everything", () => {
    expect(matchesQuery(["cokolwiek"], "   ")).toBe(true);
  });
});
