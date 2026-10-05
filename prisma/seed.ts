import { hash } from "argon2";
import { db } from "../src/server/db.js";
import { EXPECTED_CARD_COUNT, SEED_CATEGORIES, loadSeedCards } from "./seedData.js";

/**
 * Seeds the starting content of the pool (REQ-03): the nine categories of DEC-22 and the 220 legacy
 * flashcards, Approved and authored by the administrator of DEC-42. Idempotent — running it twice
 * leaves nine categories and 220 cards, not eighteen and 440.
 *
 * The administrator's credentials come from SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in the
 * environment; the seed refuses to run without them and neither value is ever printed (CLAUDE.md §8).
 */

const ADMIN_NICKNAME = "admin";

function requiredEnv(name: "SEED_ADMIN_EMAIL" | "SEED_ADMIN_PASSWORD"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. The seed refuses to invent an administrator (DEC-42).`);
  }
  return value;
}

async function seedAdministrator(): Promise<number> {
  const email = requiredEnv("SEED_ADMIN_EMAIL");
  const password = requiredEnv("SEED_ADMIN_PASSWORD");
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    return existing.id;
  }
  const created = await db.user.create({
    data: {
      email,
      nickname: ADMIN_NICKNAME,
      passwordHash: await hash(password),
      role: "ADMIN",
    },
    select: { id: true },
  });
  return created.id;
}

async function seedCategories(): Promise<Map<string, number>> {
  const byName = new Map<string, number>();
  for (const [index, name] of SEED_CATEGORIES.entries()) {
    const position = index + 1;
    const category = await db.category.upsert({
      where: { name },
      update: { position },
      create: { name, position },
      select: { id: true, name: true },
    });
    byName.set(category.name, category.id);
  }
  return byName;
}

async function seedFlashcards(authorId: number, categories: Map<string, number>): Promise<number> {
  const categoryId = (name: string): number => {
    const id = categories.get(name);
    if (id === undefined) throw new Error(`category "${name}" was not seeded`);
    return id;
  };
  const cards = loadSeedCards();
  const existing = await db.flashcard.findMany({ select: { question: true } });
  const known = new Set(existing.map((card) => card.question));
  const missing = cards.filter((card) => !known.has(card.question));
  if (missing.length === 0) return 0;

  const now = new Date();
  await db.flashcard.createMany({
    data: missing.map((card) => ({
      categoryId: categoryId(card.category),
      question: card.question,
      answer: card.answer,
      codeExample: card.codeExample,
      // Seeded cards are part of the pool from the start: approved at the moment they are written,
      // by the administrator who authors them. No ModerationDecision is invented for them (ENT-04).
      status: "APPROVED" as const,
      authorId,
      submittedAt: now,
      decidedAt: now,
    })),
  });
  return missing.length;
}

async function main(): Promise<void> {
  const authorId = await seedAdministrator();
  const categories = await seedCategories();
  const written = await seedFlashcards(authorId, categories);

  const categoryCount = await db.category.count();
  const cardCount = await db.flashcard.count({ where: { status: "APPROVED" } });
  if (categoryCount !== SEED_CATEGORIES.length || cardCount < EXPECTED_CARD_COUNT) {
    throw new Error(`seed left ${categoryCount} categories and ${cardCount} approved flashcards`);
  }
  console.log(
    `seeded: ${categoryCount} categories, ${cardCount} approved flashcards (${written} new), 1 administrator`,
  );
}

main()
  .then(() => db.$disconnect())
  .catch(async (error: unknown) => {
    await db.$disconnect();
    console.error(error instanceof Error ? error.message : "seed failed");
    process.exitCode = 1;
  });
