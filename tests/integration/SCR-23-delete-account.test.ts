import { hash, verify } from "argon2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createProgress, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom, signedInWithRow } from "./setup/mockSession";

/**
 * SCR-23 / API-37 (CLAUDE.md §9.2, DEC-39, DEC-40, DEC-41, DEC-47). Guest/User/Administrator on the
 * page; the only administrator sees the block and is refused by a direct call; a wrong password
 * deletes nothing; a correct one calls the same service ST-18's own deletion calls (test scenario 5),
 * ends the session and lands on SCR-01 with the farewell notice.
 */

vi.mock("@/server/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(async (options: { redirectTo: string }) => {
    throw new Refusal("redirect", options.redirectTo);
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-pathname": "/profil/usun-konto" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { default: UsunKontoPage } = await import("@/app/(app)/profil/usun-konto/page");
const { deleteOwnAccountAction } = await import("@/server/actions/deleteOwnAccount");
const { deleteOwnAccount } = await import("@/server/services/deleteOwnAccount");
const { deleteUser } = await import("@/server/services/deleteUser");
const authMock = asSessionMock(auth);
const signedIn = (role: "USER" | "ADMIN") => signedInWithRow(authMock, role);

const SESSION_ID = 7;
const PASSWORD = "correct horse battery";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

type ScreenProps = { blocked: boolean; summary: { sessionsCount: number; own: Record<string, number> } };
const open = async () => (await UsunKontoPage()) as unknown as { props: { children: { props: ScreenProps } } };
const screenOf = async () => (await open()).props.children.props;

/** A full footprint of ordinary account activity, so a deletion's cascade has something to remove. */
let categoryPosition = 0;
async function fullAccount(userId: number, authorId: number | null = userId) {
  categoryPosition += 1;
  const php = (await createCategory(`Kat-${userId}-${categoryPosition}`, categoryPosition)).id;
  const approved = await createFlashcard(php, authorId, "APPROVED");
  await createFlashcard(php, authorId, "PENDING");
  await createFlashcard(php, authorId, "REJECTED");
  await createProgress(userId, approved.id, { mark: "KNOW" });
  const session = await db.studySession.create({ data: { userId, queue: [approved.id] } });
  await db.reviewEvent.create({ data: { userId, flashcardId: approved.id, sessionId: session.id, mark: "KNOW" } });
  await db.passwordResetToken.create({ data: { userId, tokenHash: `hash-${userId}`, expiresAt: new Date() } });
  return { approvedId: approved.id };
}

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
});

describe("SCR-23 — an address that needs a session (NFR-01)", () => {
  it("a Guest is redirected", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(open)).kind).toBe("redirect");
  });

  it("a User is never blocked; a sole Administrator is (DEC-47)", async () => {
    await signedIn("USER");
    expect((await screenOf()).blocked).toBe(false);
    await signedIn("ADMIN");
    expect((await screenOf()).blocked).toBe(true);
    await createUser({ role: "ADMIN" });
    expect((await screenOf()).blocked).toBe(false);
  });

  it("lists the caller's own markings, sessions and approved-card counts (AC-22.5)", async () => {
    await signedIn("USER");
    await fullAccount(SESSION_ID);
    const { summary } = await screenOf();
    expect(summary.sessionsCount).toBe(1);
    expect(summary.own).toMatchObject({ pending: 1, approved: 1, rejected: 1 });
  });
});

describe("API-37 — deleteOwnAccount", () => {
  beforeEach(async () => {
    await signedIn("USER");
    await db.user.update({ where: { id: SESSION_ID }, data: { passwordHash: await hash(PASSWORD) } });
  });

  it("a Guest is refused", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => deleteOwnAccountAction({}, form({ password: PASSWORD })))).kind).toBe("redirect");
  });

  it("a wrong password deletes nothing; the account still signs in afterwards (AC-22.9)", async () => {
    const result = await deleteOwnAccountAction({}, form({ password: "not-it" }));
    expect(result).toEqual({ error: "Hasło jest nieprawidłowe" });
    const row = await db.user.findUnique({ where: { id: SESSION_ID } });
    expect(row).not.toBeNull();
    expect(await verify(row!.passwordHash, PASSWORD)).toBe(true);
  });

  it("the only administrator is refused by a direct call, even with the right password (AC-22.10)", async () => {
    await db.user.update({ where: { id: SESSION_ID }, data: { role: "ADMIN" } });
    const result = await deleteOwnAccountAction({}, form({ password: PASSWORD }));
    expect(result.error).toMatch(/jedynym administratorem/);
    expect(await db.user.findUnique({ where: { id: SESSION_ID } })).not.toBeNull();
  });

  it("deletes with the right password and ends the session on SCR-01 (AC-22.6)", async () => {
    await fullAccount(SESSION_ID);
    const run = () => deleteOwnAccountAction({}, form({ password: PASSWORD }));
    expect((await refusalFrom(run)).target).toBe("/logowanie?zmiana=konto-usuniete");
    expect(await db.user.findUnique({ where: { id: SESSION_ID } })).toBeNull();
  });

  it("removes progress, events, sessions and reset tokens; deletes pending/rejected; approves cards go authorless (AC-22.7, AC-22.8)", async () => {
    const { approvedId } = await fullAccount(SESSION_ID);
    await refusalFrom(() => deleteOwnAccountAction({}, form({ password: PASSWORD })));
    expect(await db.cardProgress.count()).toBe(0);
    expect(await db.reviewEvent.count()).toBe(0);
    expect(await db.studySession.count()).toBe(0);
    expect(await db.passwordResetToken.count()).toBe(0);
    expect(await db.flashcard.count({ where: { status: "PENDING" } })).toBe(0);
    expect(await db.flashcard.count({ where: { status: "REJECTED" } })).toBe(0);
    const survivor = await db.flashcard.findUnique({ where: { id: approvedId } });
    expect(survivor).toMatchObject({ status: "APPROVED", authorId: null });
  });

  it("a second administrator survives when the first deletes their own account", async () => {
    const other = await createUser({ role: "ADMIN" });
    await db.user.update({ where: { id: SESSION_ID }, data: { role: "ADMIN" } });
    expect(await deleteOwnAccount(SESSION_ID, PASSWORD)).toEqual({ ok: true });
    expect(await db.user.findUnique({ where: { id: other.id } })).toMatchObject({ role: "ADMIN" });
    expect(await db.user.count({ where: { role: "ADMIN" } })).toBe(1);
  });
});

describe("Test scenario 5 — one service for both routes (DEC-41)", () => {
  it("self-deletion and an administrator's deletion of somebody else leave an identical footprint", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const selfDeleter = await createUser({ passwordHash: await hash(PASSWORD) });
    const other = await createUser();
    const { approvedId: ownApproved } = await fullAccount(selfDeleter.id);
    const { approvedId: otherApproved } = await fullAccount(other.id);

    expect(await deleteOwnAccount(selfDeleter.id, PASSWORD)).toEqual({ ok: true });
    expect(await deleteUser(admin.id, other.id)).toEqual({ ok: true });

    for (const id of [ownApproved, otherApproved]) {
      const survivor = await db.flashcard.findUnique({ where: { id } });
      expect(survivor).toMatchObject({ status: "APPROVED", authorId: null });
    }
    expect(await db.user.findUnique({ where: { id: selfDeleter.id } })).toBeNull();
    expect(await db.user.findUnique({ where: { id: other.id } })).toBeNull();
    expect(await db.cardProgress.count()).toBe(0);
    expect(await db.studySession.count()).toBe(0);
    expect(await db.flashcard.count({ where: { status: { in: ["PENDING", "REJECTED"] } } })).toBe(0);
  });
});
