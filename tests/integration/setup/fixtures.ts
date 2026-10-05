import { db } from "@/server/db";

/**
 * Helpers shared by the integration tests. They run against the throwaway database of
 * setup/database.ts, sequentially (`fileParallelism: false`), so each file may empty the tables
 * it needs and count exact rows.
 */

/** Empties every table. `CASCADE` follows the foreign keys, which is what makes the order irrelevant. */
export async function resetDatabase(): Promise<void> {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "ReviewEvent", "CardProgress", "ModerationDecision", "StudySession",
     "PasswordResetToken", "Flashcard", "Category", "User" RESTART IDENTITY CASCADE`,
  );
}

let sequence = 0;

export async function createUser(
  overrides: {
    email?: string;
    nickname?: string;
    role?: "USER" | "ADMIN";
    passwordHash?: string;
  } = {},
) {
  sequence += 1;
  return db.user.create({
    data: {
      email: overrides.email ?? `person-${sequence}@example.test`,
      nickname: overrides.nickname ?? `person_${sequence}`,
      passwordHash: overrides.passwordHash ?? "not-a-real-hash",
      role: overrides.role ?? "USER",
    },
  });
}

export async function createCategory(name: string, position: number) {
  return db.category.create({ data: { name, position } });
}

export async function createFlashcard(
  categoryId: number,
  authorId: number | null,
  status: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED",
) {
  sequence += 1;
  return db.flashcard.create({
    data: {
      categoryId,
      authorId,
      question: `Pytanie ${sequence}?`,
      answer: `Odpowiedź ${sequence}.`,
      status,
    },
  });
}

export async function createProgress(
  userId: number,
  flashcardId: number,
  overrides: {
    mark?: "KNOW" | "REPEAT" | "UNKNOWN";
    firstKnownAt?: Date;
    knowCount?: number;
    hiddenUntil?: Date;
    lastSeenAt?: Date;
  } = {},
) {
  return db.cardProgress.create({
    data: {
      userId,
      flashcardId,
      mark: overrides.mark ?? "KNOW",
      firstKnownAt: overrides.firstKnownAt ?? null,
      knowCount: overrides.knowCount ?? 0,
      hiddenUntil: overrides.hiddenUntil ?? null,
      ...(overrides.lastSeenAt ? { lastSeenAt: overrides.lastSeenAt } : {}),
    },
  });
}

/** An open study session with a hand-written queue — for tests that need an exact queue. */
export async function createSession(
  userId: number,
  flashcardIds: number[],
  options: { cursor?: number; reinforcement?: number[]; endedAt?: Date } = {},
) {
  return db.studySession.create({
    data: {
      userId,
      cursor: options.cursor ?? 0,
      endedAt: options.endedAt ?? null,
      queue: flashcardIds.map((flashcardId) => ({
        flashcardId,
        isReinforcement: options.reinforcement?.includes(flashcardId) ?? false,
      })),
    },
  });
}
