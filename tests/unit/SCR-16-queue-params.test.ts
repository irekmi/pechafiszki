import { describe, expect, it } from "vitest";
import { parseQueueParams, queueQuery } from "@/server/services/adminQueueParams";
import { answerExcerpt } from "@/server/services/answerExcerpt";

describe("SCR-16 / API-19 — the address parameters", () => {
  it("defaults to the pending tab, oldest first, every category", () => {
    expect(parseQueueParams({})).toEqual({ tab: "pending", sort: "oldest" });
  });

  it("takes valid values and falls back on anything else instead of failing", () => {
    expect(parseQueueParams({ tab: "rejected", sort: "newest", category: "4" })).toEqual({
      tab: "rejected",
      sort: "newest",
      category: 4,
    });
    expect(parseQueueParams({ tab: "all", sort: "random", category: "0" })).toEqual({ tab: "pending", sort: "oldest" });
    expect(parseQueueParams({ category: "7abc" })).toEqual({ tab: "pending", sort: "oldest" });
    expect(parseQueueParams({ tab: ["approved", "rejected"] })).toMatchObject({ tab: "approved" });
  });

  it("writes a clean query: defaults are left out", () => {
    expect(queueQuery({ tab: "pending", sort: "oldest" })).toBe("");
    expect(queueQuery({ tab: "approved", sort: "newest", category: 2 })).toBe("?tab=approved&category=2&sort=newest");
  });
});

describe("API-19 — answerExcerpt", () => {
  it("keeps a short answer whole and collapses its whitespace", () => {
    expect(answerExcerpt("  Jedna\n\ndruga  ")).toBe("Jedna druga");
  });

  it("cuts a long answer at about 80 characters with an ellipsis", () => {
    const excerpt = answerExcerpt("a".repeat(80) + "b");
    expect(excerpt).toBe(`${"a".repeat(80)}…`);
    expect(answerExcerpt("a".repeat(80))).toBe("a".repeat(80));
  });
});
