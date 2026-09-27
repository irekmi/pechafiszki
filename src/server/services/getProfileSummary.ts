import type { Role } from "@prisma/client";
import { db } from "@/server/db";

export type ProfileSummary = {
  nickname: string;
  email: string;
  role: Role;
  createdAt: Date;
  submittedCount: number;
};

/**
 * SCR-14's identity card and datalist. `null` only if the session row vanished between the request
 * reaching `requireUser()` and this read — the next request already sees a Guest (`currentUser`).
 */
export async function getProfileSummary(userId: number): Promise<ProfileSummary | null> {
  const [user, submittedCount] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { nickname: true, email: true, role: true, createdAt: true } }),
    db.flashcard.count({ where: { authorId: userId } }),
  ]);
  return user ? { ...user, submittedCount } : null;
}
