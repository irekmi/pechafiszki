import { beforeEach, describe, expect, it, vi } from "vitest";
import { Refusal, asSessionMock, refusalFrom, signedInSession } from "./setup/mockSession";

/**
 * The guarded route surface built on top of `permissions.ts` — the `(app)` / `(admin)` layouts, the
 * administration placeholder page's own re-check, and API-38 — exercised as Guest, as User and as
 * Administrator (CLAUDE.md §9.2). `permissions.ts` itself is covered in `NFR-01-permissions.test.ts`.
 */

vi.mock("@/server/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(() => {
    throw new Refusal("redirect", "/logowanie");
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
  forbidden: vi.fn(() => {
    throw new Refusal("forbidden");
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({ has: () => false })),
}));

const { auth } = await import("@/server/auth");
const AppLayout = (await import("@/app/(app)/layout")).default;
const AdminLayout = (await import("@/app/(admin)/layout")).default;
const AdminPage = (await import("@/app/(admin)/administracja/page")).default;
const { signOutAction } = await import("@/server/actions/signOut");

const authMock = asSessionMock(auth);
const signedIn = (role: "USER" | "ADMIN") => authMock.mockResolvedValue(signedInSession(role));
const guest = () => authMock.mockResolvedValue(null);

beforeEach(() => authMock.mockReset());

describe("NFR-01 — the guarded segments", () => {
  it("(app) refuses a Guest and admits both signed-in roles", async () => {
    guest();
    expect((await refusalFrom(() => AppLayout({ children: null }))).kind).toBe("redirect");
    signedIn("USER");
    await expect(AppLayout({ children: null })).resolves.toBeTruthy();
    signedIn("ADMIN");
    await expect(AppLayout({ children: null })).resolves.toBeTruthy();
  });

  it("(admin) redirects a Guest, 403s a User and admits an Administrator (AC-03.4)", async () => {
    guest();
    expect((await refusalFrom(() => AdminLayout({ children: null }))).kind).toBe("redirect");
    signedIn("USER");
    expect((await refusalFrom(() => AdminLayout({ children: null }))).kind).toBe("forbidden");
    signedIn("ADMIN");
    await expect(AdminLayout({ children: null })).resolves.toBeTruthy();
  });

  it("the administration page re-checks on its own, not only through its layout", async () => {
    signedIn("USER");
    expect((await refusalFrom(() => AdminPage())).kind).toBe("forbidden");
    guest();
    expect((await refusalFrom(() => AdminPage())).kind).toBe("redirect");
  });
});

describe("API-38 — signOut", () => {
  it("clears the session and lands on SCR-01 for every role, and for a stale cookie", async () => {
    for (const role of ["guest", "USER", "ADMIN"] as const) {
      if (role === "guest") guest();
      else signedIn(role);
      const refusal = await refusalFrom(() => signOutAction());
      expect(refusal.target).toBe("/logowanie");
    }
  });
});
