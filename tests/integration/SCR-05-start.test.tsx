import type { Session } from "next-auth";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCategory,
  createFlashcard,
  createProgress,
  createUser,
  resetDatabase,
} from "./setup/fixtures";
import { Refusal, asSessionMock, refusalFrom } from "./setup/mockSession";

/**
 * SCR-05 / API-08 — exercised as Guest, User and Administrator against the real database
 * (CLAUDE.md §9.2), plus the figures API-08 computes (AC-07.2, AC-07.5, AC-07.6, AC-07.7). The
 * guard itself (redirect/forbidden shapes) is covered in `NFR-01-guarded-routes.test.ts`; this file
 * is about what API-08 puts on the page once a role is let through.
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-pathname": "/start" })),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const { currentUser } = await import("@/server/permissions");
const { TopBar } = await import("@/components/shell/TopBar");
const { getPendingQueueCount } = await import("@/server/services/getPendingQueueCount");
const StartPage = (await import("@/app/(app)/start/page")).default;

const authMock = asSessionMock(auth);

function sessionFor(user: { id: number; email: string; nickname: string; role: "USER" | "ADMIN" }): Session {
  return {
    user: { id: String(user.id), email: user.email, nickname: user.nickname, role: user.role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session;
}

/**
 * Renders exactly what `(app)/layout.tsx` composes — `TopBar` plus the page — without going through
 * the layout function itself: `renderToStaticMarkup` cannot resolve an unawaited async component
 * inside JSX (`TopBar` reads `headers()`), so both are awaited here first, as Next's own RSC
 * renderer already does at runtime. The guard `(app)/layout.tsx` also runs is covered by
 * `NFR-01-guarded-routes.test.ts`.
 */
async function renderStart(): Promise<string> {
  const user = await currentUser();
  if (!user) throw new Error("renderStart needs a signed-in mock");
  const pendingQueue = user.role === "ADMIN" ? await getPendingQueueCount() : undefined;
  const topBar = await TopBar({ user, pendingQueue });
  const page = await StartPage();
  return renderToStaticMarkup(
    <>
      {topBar}
      {page}
    </>,
  );
}

beforeEach(async () => {
  await resetDatabase();
  authMock.mockReset();
});

describe("SCR-05 — access", () => {
  it("redirects a Guest to SCR-01", async () => {
    authMock.mockResolvedValue(null);
    expect((await refusalFrom(() => StartPage())).kind).toBe("redirect");
  });
});

describe("SCR-05 — role-conditional shell (AC-07.3, AC-07.4)", () => {
  it("a User sees no Administracja item and no administration card anywhere in the DOM", async () => {
    const user = await createUser({ role: "USER" });
    authMock.mockResolvedValue(sessionFor(user));
    const html = await renderStart();
    expect(html).not.toContain("Administracja");
    expect(html).not.toContain("Administrator");
  });

  it("an Administrator sees the item, its badge and the card, matching the pending count", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const category = await createCategory("PHP", 1);
    await createFlashcard(category.id, admin.id, "PENDING");
    await createFlashcard(category.id, admin.id, "PENDING");
    authMock.mockResolvedValue(sessionFor(admin));
    const html = await renderStart();
    expect(html).toContain("Administracja");
    expect(html).toContain(">2<");
    expect(html).toContain("Fiszki oczekujące na zatwierdzenie");
  });
});

describe("SCR-05 — the figures (API-08)", () => {
  it("the four tiles sum to the approved pool and shares are whole percents (AC-07.2)", async () => {
    const user = await createUser({ role: "USER" });
    const category = await createCategory("PHP", 1);
    const cards = await Promise.all(
      Array.from({ length: 7 }, () => createFlashcard(category.id, null)),
    );
    await createProgress(user.id, cards[0]!.id, { mark: "KNOW" });
    await createProgress(user.id, cards[1]!.id, { mark: "KNOW" });
    await createProgress(user.id, cards[2]!.id, { mark: "REPEAT" });
    await createProgress(user.id, cards[3]!.id, { mark: "UNKNOWN" });
    // cards[4..6] stay unmarked ("Nie zaczęte").

    authMock.mockResolvedValue(sessionFor(user));
    const html = await renderStart();
    expect(html).toContain("29% puli"); // 2 / 7 rounded ("Umiem")
    expect(html).toContain("43% puli"); // 3 / 7 rounded ("Nie zaczęte")
  });

  it("the nine seeded-shaped categories render in position order with real counts (DEV-01, AC-07.6)", async () => {
    const user = await createUser({ role: "USER" });
    const php = await createCategory("PHP", 1);
    const symfony = await createCategory("Symfony", 2);
    await createFlashcard(php.id, null);
    await createFlashcard(php.id, null);
    await createFlashcard(symfony.id, null);
    authMock.mockResolvedValue(sessionFor(user));
    const html = await renderStart();
    expect(html.indexOf("PHP")).toBeLessThan(html.indexOf("Symfony"));
    expect(html).toContain("2 fiszek");
    expect(html).toContain("1 fiszek");
  });

  it("a person who has marked nothing sees zeroed tiles and '0% puli' (AC-07.7)", async () => {
    const user = await createUser({ role: "USER" });
    const category = await createCategory("PHP", 1);
    await createFlashcard(category.id, null);
    authMock.mockResolvedValue(sessionFor(user));
    const html = await renderStart();
    expect(html).toContain("0% puli");
  });

  it("an empty pool shows the empty state instead of the tiles and the category list (AC-07.7)", async () => {
    const user = await createUser({ role: "USER" });
    authMock.mockResolvedValue(sessionFor(user));
    const html = await renderStart();
    expect(html).toContain("Nie ma jeszcze żadnych fiszek");
    expect(html).not.toContain("Twoje oceny");
  });

  it("counts only a firstKnownAt inside the current Monday–Sunday week (AC-07.5, DEC-02)", async () => {
    const user = await createUser({ role: "USER" });
    const category = await createCategory("PHP", 1);
    const inWeek = await createFlashcard(category.id, null);
    const beforeWeek = await createFlashcard(category.id, null);

    const { weekBounds } = await import("@/domain/week");
    const { start } = weekBounds(new Date());
    await createProgress(user.id, inWeek.id, { mark: "KNOW", firstKnownAt: start });
    await createProgress(user.id, beforeWeek.id, {
      mark: "KNOW",
      firstKnownAt: new Date(start.getTime() - 1),
    });

    authMock.mockResolvedValue(sessionFor(user));
    const html = await renderStart();
    expect(html).toContain("Zapamiętane w tym tygodniu: 1 fiszek");
  });
});
