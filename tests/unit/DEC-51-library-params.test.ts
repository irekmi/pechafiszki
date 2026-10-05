import { describe, expect, it } from "vitest";
import { libraryQuery, parseLibraryParams } from "@/server/services/libraryParams";

// DEC-51 / NFR-04 — every SCR-08 search parameter is validated; an unusable value becomes the
// default and `limit` is capped at 200. A URL built by hand never raises an error.

describe("DEC-51 — parseLibraryParams", () => {
  it("defaults an empty URL to the newest first page", () => {
    expect(parseLibraryParams({})).toEqual({
      query: undefined,
      category: undefined,
      mark: undefined,
      sort: "newest",
      limit: 20,
    });
  });

  it("keeps valid values", () => {
    const parsed = parseLibraryParams({ query: " domkniecie ", category: "3", mark: "new", sort: "mark", limit: "60" });
    expect(parsed).toEqual({ query: "domkniecie", category: 3, mark: "new", sort: "mark", limit: 60 });
  });

  it("caps limit above 200 (NFR-04)", () => {
    expect(parseLibraryParams({ limit: "100000" }).limit).toBe(200);
    expect(parseLibraryParams({ limit: "220" }).limit).toBe(200);
    expect(parseLibraryParams({ limit: "200" }).limit).toBe(200);
  });

  it.each(["0", "-20", "19", "45", "abc", "", "1.5", "NaN"])("falls back to 20 for limit=%s", (limit) => {
    expect(parseLibraryParams({ limit }).limit).toBe(20);
  });

  it("drops an unknown mark, sort, category and an over-long or blank query", () => {
    const parsed = parseLibraryParams({
      mark: "nonsense",
      sort: "random",
      category: "0",
      query: "x".repeat(101),
    });
    expect(parsed).toMatchObject({ mark: undefined, sort: "newest", category: undefined, query: undefined });
    expect(parseLibraryParams({ category: "abc" }).category).toBeUndefined();
    expect(parseLibraryParams({ category: "99999999999" }).category).toBeUndefined();
    expect(parseLibraryParams({ query: "   " }).query).toBeUndefined();
  });

  it("strips NUL bytes from the phrase, PostgreSQL text cannot hold them (regression, AC-11.9)", () => {
    expect(parseLibraryParams({ query: "\0" }).query).toBeUndefined();
    expect(parseLibraryParams({ query: "a\0b" }).query).toBe("ab");
    expect(parseLibraryParams({ query: "\0\0\0" }).query).toBeUndefined();
  });

  it("takes the first of a repeated parameter", () => {
    expect(parseLibraryParams({ mark: ["know", "repeat"], limit: ["40", "60"] })).toMatchObject({
      mark: "know",
      limit: 40,
    });
  });
});

describe("DEC-51 — libraryQuery", () => {
  it("leaves defaults out, so the unfiltered list has no query string", () => {
    expect(libraryQuery(parseLibraryParams({}))).toBe("");
  });

  it("round-trips a filtered list", () => {
    const params = parseLibraryParams({ query: "indeks sql", category: "2", mark: "unknown", sort: "oldest", limit: "40" });
    expect(parseLibraryParams(Object.fromEntries(new URLSearchParams(libraryQuery(params))))).toEqual(params);
  });
});
