import type { Role } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { forbidden, notFound, redirect } from "next/navigation";
import { auth } from "./auth";
import { SIGN_IN_PATH, signInUrlFor } from "./routeAccess";

/**
 * The only module in the application that decides a permission (CLAUDE.md §8, NFR-01). Every page,
 * layout, server action and route handler that is not public calls one of these; none of them
 * re-implements the check, and none of them reads a role from a body, a query or a header.
 *
 * The refusal shapes are fixed by DEC-57:
 *  - Guest at a protected address → redirect to SCR-01, carrying the path that forced it;
 *  - User at an administration address → SCR-22's 403 variant, HTTP 403;
 *  - a resource the caller may not see → SCR-22's 404 variant, indistinguishable from a missing one.
 */

export type SessionUser = {
  id: number;
  email: string;
  nickname: string;
  role: Role;
};

/** The session, or `null`. This is the single seam through which a role enters the application. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.role) return null;
  return {
    id: Number(user.id),
    email: user.email ?? "",
    nickname: user.nickname,
    role: user.role,
  };
}

/** Signed in, any role. A Guest never returns from here. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(await signInRedirect());
  return user;
}

/** Administrator only. A Guest is redirected; a signed-in User gets 403, as DEC-57 draws it. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") forbidden();
  return user;
}

/**
 * The refusal for a resource the caller may not see. It is deliberately the same answer as a row
 * that does not exist, and carries nothing about which of the two it was.
 */
export function refuseNotFound(): never {
  notFound();
}

type AccessCard = { status: "PENDING" | "APPROVED" | "REJECTED"; authorId: number | null };
type Actor = Pick<SessionUser, "id" | "role">;

/**
 * Object rule on ENT-03, reading: approved is readable by any signed-in person, pending or rejected
 * only by its author and an Administrator. False ends in `refuseNotFound()`, as a missing row does.
 */
export function canReadFlashcard(user: Actor, card: AccessCard): boolean {
  return card.status === "APPROVED" || card.authorId === user.id || user.role === "ADMIN";
}

/** Editing: an Administrator any card; the author their own while it is not approved. */
export function canEditFlashcard(user: Actor, card: AccessCard): boolean {
  return user.role === "ADMIN" || (card.authorId === user.id && card.status !== "APPROVED");
}

/** Deleting from SCR-09 is the Administrator's alone (API-23). */
export const canDeleteFlashcard = (user: Pick<Actor, "role">): boolean => user.role === "ADMIN";

/**
 * `src/middleware.ts` puts the requested address on the request, so a guard that fires after it —
 * or instead of it — can still send the caller back where they were going (AC-03.3). Without the
 * header the caller simply lands on SCR-01.
 */
async function signInRedirect(): Promise<string> {
  const requested = (await headers()).get("x-pathname");
  return requested ? signInUrlFor(requested) : SIGN_IN_PATH;
}

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/**
 * A session cookie the server could not read back — an expired or invalidated token. SCR-22 offers
 * such a visitor a sign-out rather than a plain link, so the stale cookie is cleared before SCR-01
 * (API-38).
 */
export async function hasStaleSessionCookie(): Promise<boolean> {
  if (await currentUser()) return false;
  const jar = await cookies();
  return SESSION_COOKIES.some((name) => jar.has(name));
}
