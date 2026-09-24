import { beforeEach, describe, expect, it, vi } from "vitest";
import { Refusal, asSessionMock, refusalFrom, signedInSession } from "./setup/mockSession";

/**
 * `src/server/permissions.ts` — the session reader and its decisions, exercised as Guest, User and
 * Administrator (CLAUDE.md §9.2). Guarded layouts/pages live in `NFR-01-guarded-routes.test.ts`.
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Refusal("redirect", target);
  }),
  forbidden: vi.fn(() => {
    throw new Refusal("forbidden");
  }),
  notFound: vi.fn(() => {
    throw new Refusal("notFound");
  }),
}));

let requestHeaders = new Headers();
let cookieNames: string[] = [];

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => requestHeaders),
  cookies: vi.fn(async () => ({ has: (name: string) => cookieNames.includes(name) })),
}));

const { auth } = await import("@/server/auth");
const { currentUser, requireAdmin, requireUser } = await import("@/server/permissions");

const authMock = asSessionMock(auth);
const signedIn = (role: "USER" | "ADMIN") => authMock.mockResolvedValue(signedInSession(role));
const guest = () => authMock.mockResolvedValue(null);

beforeEach(() => {
  requestHeaders = new Headers();
  cookieNames = [];
  authMock.mockReset();
});

describe("NFR-01 — the session reader", () => {
  it("reports a Guest as nobody", async () => {
    guest();
    expect(await currentUser()).toBeNull();
  });

  it("reports the role the session carries, for both signed-in roles", async () => {
    signedIn("USER");
    expect(await currentUser()).toMatchObject({ id: 7, role: "USER" });
    signedIn("ADMIN");
    expect(await currentUser()).toMatchObject({ id: 7, role: "ADMIN" });
  });
});
describe("NFR-01 — requireUser", () => {
  it("redirects a Guest to SCR-01, carrying the address that forced it (AC-03.3)", async () => {
    guest();
    requestHeaders.set("x-pathname", "/fiszki");
    const refusal = await refusalFrom(() => requireUser());
    expect(refusal.kind).toBe("redirect");
    expect(refusal.target).toBe(`/logowanie?powrot=${encodeURIComponent("/fiszki")}`);
  });

  it("redirects a Guest to plain SCR-01 when no address was recorded", async () => {
    guest();
    expect((await refusalFrom(() => requireUser())).target).toBe("/logowanie");
  });
  it("lets a User and an Administrator through", async () => {
    signedIn("USER");
    await expect(requireUser()).resolves.toMatchObject({ role: "USER" });
    signedIn("ADMIN");
    await expect(requireUser()).resolves.toMatchObject({ role: "ADMIN" });
  });
});

describe("NFR-01 — requireAdmin (DEC-57)", () => {
  it("redirects a Guest rather than showing them the 403", async () => {
    guest();
    expect((await refusalFrom(() => requireAdmin())).kind).toBe("redirect");
  });

  it("refuses a signed-in User with the 403 variant", async () => {
    signedIn("USER");
    expect((await refusalFrom(() => requireAdmin())).kind).toBe("forbidden");
  });

  it("ignores a role claimed in a request header (AC-03.5)", async () => {
    signedIn("USER");
    requestHeaders.set("x-role", "ADMIN");
    requestHeaders.set("role", "ADMIN");
    expect((await refusalFrom(() => requireAdmin())).kind).toBe("forbidden");
  });

  it("lets an Administrator through", async () => {
    signedIn("ADMIN");
    await expect(requireAdmin()).resolves.toMatchObject({ role: "ADMIN" });
  });
});
