import { describe, expect, it } from "vitest";
import { accountBlock } from "@/server/services/accountBlocks";
import { parseUsersParams, userHref, usersHref, usersQuery } from "@/server/services/usersParams";

describe("SCR-19 — URL parameters (DEC-48, NFR-04)", () => {
  it("defaults: newest, 20 rows, no filters", () => {
    expect(parseUsersParams({})).toEqual({ sort: "newest", limit: 20 });
    expect(usersHref({ sort: "newest", limit: 20 })).toBe("/administracja/uzytkownicy");
  });

  it("reads a valid set and writes it back clean", () => {
    const params = parseUsersParams({ query: " example.com ", role: "admin", sort: "nickname", limit: "60" });
    expect(params).toEqual({ query: "example.com", role: "admin", sort: "nickname", limit: 60 });
    expect(usersQuery(params)).toBe("?query=example.com&role=admin&sort=nickname&limit=60");
  });

  it("caps limit at 200 and drops unusable values instead of failing", () => {
    expect(parseUsersParams({ limit: "999" }).limit).toBe(200);
    expect(parseUsersParams({ limit: "30" }).limit).toBe(20);
    expect(parseUsersParams({ role: "root", sort: "id", query: "" })).toEqual({ sort: "newest", limit: 20 });
    expect(parseUsersParams({ role: ["user", "admin"] }).role).toBe("user");
    expect(parseUsersParams({ query: "x".repeat(101) }).query).toBeUndefined();
  });

  it("links an account's SCR-20 address", () => {
    expect(userHref(7)).toBe("/administracja/uzytkownicy/7");
  });
});

describe("DEC-47 — the block rule", () => {
  const target = (id: number, role: "USER" | "ADMIN") => ({ id, role });
  it("blocks one's own account first, then the last administrator, otherwise nothing", () => {
    expect(accountBlock(target(1, "ADMIN"), 1, 2)).toBe("self");
    expect(accountBlock(target(1, "ADMIN"), 1, 1)).toBe("self");
    expect(accountBlock(target(1, "ADMIN"), 2, 1)).toBe("last-admin");
    expect(accountBlock(target(1, "ADMIN"), 2, 2)).toBeNull();
    expect(accountBlock(target(1, "USER"), 2, 1)).toBeNull();
  });
});
