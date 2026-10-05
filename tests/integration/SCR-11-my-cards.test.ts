import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { createCategory, createFlashcard, createUser, resetDatabase } from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * SCR-11 / API-15 listMyFlashcards — own rows only for User and Administrator alike (AC-13.8), the
 * four counts and the URL tabs (AC-13.9), the latest decision's reason verbatim (AC-13.10, DEC-31),
 * newest first, and the Guest refusal (CLAUDE.md §9.2). Real database.
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-pathname": "/moje-fiszki" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { default: MojeFiszkiPage } = await import("@/app/(app)/moje-fiszki/page");
const { listMyFlashcards } = await import("@/server/services/listMyFlashcards");
const authMock = asSessionMock(auth);

type Person = { id: number; role: "USER" | "ADMIN"; nickname: string };
type Counts = { all: number; pending: number; approved: number; rejected: number };
type Props = { rows: { id: number; status: string }[]; counts: Counts; status?: string; notice?: string };

function signInAs(user: Person): void {
  authMock.mockResolvedValue({
    user: { id: String(user.id), email: `${user.nickname}@example.test`, nickname: user.nickname, role: user.role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session);
}

const open = async (search: Record<string, string> = {}) =>
  ((await MojeFiszkiPage({ searchParams: Promise.resolve(search) })) as { props: Props }).props;

let categoryId: number;
beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
  categoryId = (await createCategory("PHP", 1)).id;
});

describe("SCR-11 — access", () => {
  it("a Guest is sent to SCR-01", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => open())).kind).toBe("redirect");
  });

  it("a person with no submission sees zero everywhere (the empty state)", async () => {
    signInAs(await createUser());
    const props = await open();
    expect(props.rows).toEqual([]);
    expect(props.counts).toEqual({ all: 0, pending: 0, approved: 0, rejected: 0 });
  });
});

describe("SCR-11 — isolation (AC-13.8, REQ-02)", () => {
  it("shows a User only their own cards, whatever their status", async () => {
    const a = await createUser();
    const b = await createUser();
    const mine = [
      await createFlashcard(categoryId, a.id, "PENDING"),
      await createFlashcard(categoryId, a.id, "APPROVED"),
      await createFlashcard(categoryId, a.id, "REJECTED"),
    ];
    await createFlashcard(categoryId, b.id, "PENDING");
    await createFlashcard(categoryId, null, "APPROVED");
    signInAs(a);
    const props = await open();
    expect(props.rows.map((row) => row.id).sort()).toEqual(mine.map((card) => card.id).sort());
    signInAs(b);
    expect((await open()).rows).toHaveLength(1);
  });

  it("shows an Administrator only what they submitted themselves, not the pool", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const other = await createUser();
    await createFlashcard(categoryId, other.id, "PENDING");
    await createFlashcard(categoryId, null, "APPROVED");
    const own = await createFlashcard(categoryId, admin.id, "PENDING");
    signInAs(admin);
    const props = await open();
    expect(props.rows.map((row) => row.id)).toEqual([own.id]);
    expect(props.counts).toEqual({ all: 1, pending: 1, approved: 0, rejected: 0 });
  });

  it("the address cannot name another person: an author parameter is ignored", async () => {
    const a = await createUser();
    const b = await createUser();
    await createFlashcard(categoryId, b.id, "PENDING");
    signInAs(a);
    expect((await open({ authorId: String(b.id), author: String(b.id), userId: String(b.id) })).rows).toEqual([]);
  });
});

describe("SCR-11 — tabs and counts (AC-13.9)", () => {
  it("the four counts sum to the total and each tab filters its rows, counts unchanged", async () => {
    const a = await createUser();
    for (const status of ["PENDING", "PENDING", "APPROVED", "REJECTED", "REJECTED", "REJECTED"] as const) {
      await createFlashcard(categoryId, a.id, status);
    }
    signInAs(a);
    for (const [status, expected] of [["pending", 2], ["approved", 1], ["rejected", 3]] as const) {
      const props = await open({ status });
      expect(props.rows).toHaveLength(expected);
      expect(props.rows.every((row) => row.status === status.toUpperCase())).toBe(true);
      expect(props.counts).toEqual({ all: 6, pending: 2, approved: 1, rejected: 3 });
    }
    const all = await open();
    expect(all.rows).toHaveLength(6);
    expect(all.counts.pending + all.counts.approved + all.counts.rejected).toBe(all.counts.all);
  });

  it("an unknown status falls back to all instead of failing", async () => {
    const a = await createUser();
    await createFlashcard(categoryId, a.id, "PENDING");
    signInAs(a);
    for (const status of ["nope", "", "PENDING", "'; DROP TABLE"]) {
      const props = await open({ status });
      expect(props.rows).toHaveLength(1);
      expect(props.status).toBeUndefined();
    }
  });

  it("the arrival notice is a fixed code, never free text", async () => {
    signInAs(await createUser());
    expect((await open({ zmiana: "wyslana" })).notice).toBe("wyslana");
    expect((await open({ zmiana: "zapisana" })).notice).toBe("zapisana");
    expect((await open({ zmiana: "<b>x</b>" })).notice).toBeUndefined();
    expect((await open()).notice).toBeUndefined();
  });
});

describe("SCR-11 — rows (AC-13.10, DEC-31)", () => {
  it("lists newest first", async () => {
    const a = await createUser();
    const old = await createFlashcard(categoryId, a.id, "PENDING");
    const recent = await createFlashcard(categoryId, a.id, "PENDING");
    await db.flashcard.update({ where: { id: old.id }, data: { submittedAt: new Date("2026-01-01T10:00:00Z") } });
    await db.flashcard.update({ where: { id: recent.id }, data: { submittedAt: new Date("2026-02-01T10:00:00Z") } });
    expect((await listMyFlashcards(a.id)).rows.map((row) => row.id)).toEqual([recent.id, old.id]);
  });

  it("a rejected row carries the latest decision's reason verbatim, and its date", async () => {
    const a = await createUser();
    const admin = await createUser({ role: "ADMIN" });
    const card = await createFlashcard(categoryId, a.id, "REJECTED");
    const reason = "Odpowiedź myli uwierzytelnianie z autoryzacją. <b>Popraw</b> i wyślij ponownie.";
    await db.moderationDecision.createMany({
      data: [
        { flashcardId: card.id, decision: "REJECTED", reason: "Pierwszy powód", decidedById: admin.id, decidedAt: new Date("2026-03-01T10:00:00Z") },
        { flashcardId: card.id, decision: "REJECTED", reason, decidedById: admin.id, decidedAt: new Date("2026-03-05T10:00:00Z") },
      ],
    });
    const [row] = (await listMyFlashcards(a.id)).rows;
    expect(row?.rejectionReason).toBe(reason);
    expect(row?.decidedAt).toEqual(new Date("2026-03-05T10:00:00Z"));
  });

  it("a card rejected earlier and pending again shows no reason and no decision date", async () => {
    const a = await createUser();
    const card = await createFlashcard(categoryId, a.id, "PENDING");
    await db.moderationDecision.create({
      data: { flashcardId: card.id, decision: "REJECTED", reason: "Stary powód", decidedAt: new Date("2026-03-01T10:00:00Z") },
    });
    const [row] = (await listMyFlashcards(a.id)).rows;
    expect(row).toMatchObject({ status: "PENDING", rejectionReason: null, decidedAt: null });
  });

  it("an approved row shows the approval date and no reason", async () => {
    const a = await createUser();
    const card = await createFlashcard(categoryId, a.id, "APPROVED");
    await db.flashcard.update({ where: { id: card.id }, data: { decidedAt: new Date("2026-04-01T10:00:00Z") } });
    const [row] = (await listMyFlashcards(a.id)).rows;
    expect(row).toMatchObject({ status: "APPROVED", rejectionReason: null, decidedAt: new Date("2026-04-01T10:00:00Z") });
  });
});
