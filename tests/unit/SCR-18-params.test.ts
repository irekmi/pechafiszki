import { describe, expect, it } from "vitest";
import { counterText } from "@/components/admin-cards/counterText";
import { rowHref } from "@/components/admin-cards/rowHref";
import { adminCardsQuery, parseAdminCardsParams } from "@/server/services/adminCardsParams";

describe("SCR-18 — URL parameters (DEC-51, DEC-48)", () => {
  it("defaults: newest, 20 rows, no filters", () => {
    expect(parseAdminCardsParams({})).toEqual({ sort: "newest", limit: 20 });
  });

  it("reads a valid set and writes it back clean", () => {
    const params = parseAdminCardsParams({ query: " index ", status: "rejected", category: "3", sort: "author", limit: "60" });
    expect(params).toEqual({ query: "index", status: "rejected", category: 3, sort: "author", limit: 60 });
    expect(adminCardsQuery(params)).toBe("?query=index&status=rejected&category=3&sort=author&limit=60");
    expect(adminCardsQuery({ sort: "newest", limit: 20 })).toBe("");
  });

  it("caps limit at 200 and drops unusable values instead of failing", () => {
    expect(parseAdminCardsParams({ limit: "999" }).limit).toBe(200);
    expect(parseAdminCardsParams({ limit: "30" }).limit).toBe(20);
    expect(parseAdminCardsParams({ status: "all", category: "x", sort: "id", query: "" })).toEqual({ sort: "newest", limit: 20 });
    expect(parseAdminCardsParams({ status: ["approved", "pending"] }).status).toBe("approved");
  });
});

describe("SCR-18 — the counter line and the row links", () => {
  it("reads as the mockup does, with Polish plurals", () => {
    expect(counterText({ approved: 312, pending: 7, rejected: 24 })).toBe("343 fiszki: 312 zatwierdzonych, 7 oczekujących, 24 odrzucone");
    expect(counterText({ approved: 0, pending: 0, rejected: 0 })).toBe("0 fiszek: 0 zatwierdzonych, 0 oczekujących, 0 odrzuconych");
    expect(counterText({ approved: 1, pending: 1, rejected: 0 })).toBe("2 fiszki: 1 zatwierdzona, 1 oczekująca, 0 odrzuconych");
  });

  it("a row leads to SCR-09, SCR-17 or SCR-12 by status", () => {
    expect(rowHref(5, "APPROVED")).toBe("/fiszki/5");
    expect(rowHref(5, "PENDING")).toBe("/administracja/ocena/5");
    expect(rowHref(5, "REJECTED")).toBe("/edytuj/5");
  });
});
