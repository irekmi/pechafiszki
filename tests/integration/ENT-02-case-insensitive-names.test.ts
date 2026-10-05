import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createCategory, createUser, resetDatabase } from "./setup/fixtures";

// AC-02.6 — DEC-24 and DEC-44: a category name and a nickname are unique case-insensitively, and
// so is the address. The uniqueness is a unique index over lower(...) on a plain text column
// (SQ-02.1), so it holds against a direct insert and not only against the service that guards the
// form; a lookup must compare case-insensitively itself.

describe("case-insensitive uniqueness", () => {
  beforeEach(resetDatabase);

  it("refuses a second category whose name differs only in case (DEC-24)", async () => {
    await createCategory("Doctrine/SQL", 3);
    await expect(createCategory("doctrine/sql", 4)).rejects.toThrow();
    expect(await db.category.count()).toBe(1);
  });

  it("finds a category by a differently cased name", async () => {
    await createCategory("TypeScript", 7);
    const found = await db.category.findFirst({
      where: { name: { equals: "typescript", mode: "insensitive" } },
    });
    expect(found?.name).toBe("TypeScript");
  });

  it("refuses a second nickname that differs only in case, and keeps it as typed (DEC-44)", async () => {
    await createUser({ nickname: "Anna_W" });
    await expect(createUser({ nickname: "anna_w" })).rejects.toThrow();
    const stored = await db.user.findFirst({
      where: { nickname: { equals: "ANNA_W", mode: "insensitive" } },
    });
    expect(stored?.nickname).toBe("Anna_W");
  });

  it("refuses two addresses that differ only in case", async () => {
    await db.user.create({
      data: { email: "Ala@Example.Test", nickname: "ala_k", passwordHash: "x" },
    });
    await expect(
      db.user.create({ data: { email: "ala@example.test", nickname: "ala_2", passwordHash: "x" } }),
    ).rejects.toThrow();
  });

  it("refuses two categories in the same position", async () => {
    await createCategory("PHP", 1);
    await expect(createCategory("Symfony", 1)).rejects.toThrow();
  });
});
