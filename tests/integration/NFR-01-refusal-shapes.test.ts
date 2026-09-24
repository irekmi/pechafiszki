import { beforeEach, describe, expect, it, vi } from "vitest";
import { Refusal, asSessionMock, refusalFrom, signedInSession } from "./setup/mockSession";

/**
 * The two refusal shapes `permissions.ts` offers besides a redirect and a 403: the 404 a hidden
 * resource gets (DEC-57), and the stale-cookie check SCR-22 uses to offer a sign-out.
 */

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Refusal("notFound");
  }),
}));

let cookieNames: string[] = [];
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({ has: (name: string) => cookieNames.includes(name) })),
}));

const { auth } = await import("@/server/auth");
const { hasStaleSessionCookie, refuseNotFound } = await import("@/server/permissions");
const authMock = asSessionMock(auth);

beforeEach(() => {
  cookieNames = [];
  authMock.mockReset();
});

describe("NFR-01 — the other two refusal shapes", () => {
  it("a resource the caller may not see answers exactly like a missing one", async () => {
    expect((await refusalFrom(async () => refuseNotFound())).kind).toBe("notFound");
  });

  it("offers a sign-out only when a session cookie is present but unreadable", async () => {
    authMock.mockResolvedValue(null);
    expect(await hasStaleSessionCookie()).toBe(false);
    cookieNames = ["authjs.session-token"];
    expect(await hasStaleSessionCookie()).toBe(true);
    authMock.mockResolvedValue(signedInSession("USER"));
    expect(await hasStaleSessionCookie()).toBe(false);
  });
});
