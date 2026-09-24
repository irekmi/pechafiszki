import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { EXPECTED_CARD_COUNT, SEED_CATEGORIES, loadSeedCards } from "../../prisma/seedData";
import { resetDatabase } from "./setup/fixtures";

// AC-02.2, AC-02.3, AC-02.4, AC-02.7 — REQ-03: the pool is never empty, the seed is idempotent,
// and it refuses to invent an administrator (DEC-42). The values below are this test's own,
// created inside a throwaway database and never used anywhere else.

const ADMIN_EMAIL = "seed-test-admin@example.test";
const ADMIN_PASSWORD = "seed-test-password";

function runSeed(env: Record<string, string | undefined>): { ok: boolean; output: string } {
  try {
    const output = execFileSync(join("node_modules", ".bin", "prisma"), ["db", "seed"], {
      env: { ...process.env, ...env },
      encoding: "utf8",
      stdio: "pipe",
    });
    return { ok: true, output };
  } catch (error: unknown) {
    const failure = error as { stdout?: string; stderr?: string };
    return { ok: false, output: `${failure.stdout ?? ""}${failure.stderr ?? ""}` };
  }
}

describe("REQ-03 seeded pool", () => {
  let firstRun: { ok: boolean; output: string };
  let secondRun: { ok: boolean; output: string };

  beforeAll(async () => {
    await resetDatabase();
    const env = { SEED_ADMIN_EMAIL: ADMIN_EMAIL, SEED_ADMIN_PASSWORD: ADMIN_PASSWORD };
    firstRun = runSeed(env);
    secondRun = runSeed(env);
  }, 180_000);

  it("seeds the nine categories in the DEC-22 order", async () => {
    expect(firstRun.ok).toBe(true);
    const categories = await db.category.findMany({ orderBy: { position: "asc" } });
    expect(categories.map((category) => category.name)).toEqual([...SEED_CATEGORIES]);
    expect(categories.map((category) => category.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("seeds 220 approved flashcards authored by the administrator (AC-02.3)", async () => {
    const admin = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });
    expect(admin?.role).toBe("ADMIN");
    expect(await db.flashcard.count()).toBe(EXPECTED_CARD_COUNT);
    expect(await db.flashcard.count({ where: { status: "APPROVED" } })).toBe(EXPECTED_CARD_COUNT);
    expect(await db.flashcard.count({ where: { authorId: null } })).toBe(0);
    expect(await db.flashcard.count({ where: { authorId: admin?.id } })).toBe(EXPECTED_CARD_COUNT);
    expect(await db.flashcard.count({ where: { decidedAt: null } })).toBe(0);
  });

  it("gives every card a category, a question and an answer, straight from the legacy file", async () => {
    const cards = await db.flashcard.findMany({ include: { category: true } });
    for (const card of cards) {
      expect(card.question.length).toBeGreaterThan(0);
      expect(card.answer.length).toBeGreaterThan(0);
      expect(SEED_CATEGORIES).toContain(card.category.name);
    }
    const perCategory = new Map<string, number>();
    for (const card of loadSeedCards()) {
      perCategory.set(card.category, (perCategory.get(card.category) ?? 0) + 1);
    }
    for (const [name, expected] of perCategory) {
      expect(await db.flashcard.count({ where: { category: { name } } })).toBe(expected);
    }
  });

  it("is idempotent — a second run leaves 9 categories and 220 cards (AC-02.7)", async () => {
    expect(secondRun.ok).toBe(true);
    expect(await db.category.count()).toBe(SEED_CATEGORIES.length);
    expect(await db.flashcard.count()).toBe(EXPECTED_CARD_COUNT);
    expect(await db.user.count()).toBe(1);
  });

  it("prints neither the address nor the password (AC-02.4, CLAUDE.md §8)", () => {
    expect(firstRun.output).not.toContain(ADMIN_PASSWORD);
    expect(firstRun.output).not.toContain(ADMIN_EMAIL);
    expect(firstRun.output).toContain("220 approved flashcards");
  });

  it("refuses to run without SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD (DEC-42)", () => {
    const withoutEmail = runSeed({
      SEED_ADMIN_EMAIL: undefined,
      SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
    });
    expect(withoutEmail.ok).toBe(false);
    expect(withoutEmail.output).toContain("SEED_ADMIN_EMAIL is not set");
    expect(withoutEmail.output).not.toContain(ADMIN_PASSWORD);

    const withoutPassword = runSeed({ SEED_ADMIN_EMAIL: ADMIN_EMAIL, SEED_ADMIN_PASSWORD: undefined });
    expect(withoutPassword.ok).toBe(false);
    expect(withoutPassword.output).toContain("SEED_ADMIN_PASSWORD is not set");
  });
});
