import type { Session } from "next-auth";
import { vi, type Mock } from "vitest";

/**
 * Shared by the NFR-01 suites below. Each test file still calls `vi.mock` itself — Vitest hoists
 * `vi.mock` per file, so it cannot be centralised — but the refusal type and the two session
 * builders are identical everywhere `@/server/auth` is mocked this way.
 */

export class Refusal extends Error {
  constructor(
    readonly kind: "redirect" | "forbidden" | "notFound",
    readonly target?: string,
  ) {
    super(`${kind}:${target ?? ""}`);
  }
}

export function signedInSession(role: "USER" | "ADMIN"): Session {
  return {
    user: { id: "7", email: "person@example.test", nickname: "person", role },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session;
}

export async function refusalFrom(run: () => Promise<unknown>): Promise<Refusal> {
  try {
    await run();
  } catch (error) {
    if (error instanceof Refusal) return error;
    throw error;
  }
  throw new Error("expected a refusal, but the call returned");
}

/**
 * `auth` is next-auth's overloaded export (it can also be called as middleware); the module mock
 * replaces it with a plain `vi.fn()`, so this cast just gives that mock the one signature these
 * suites actually call.
 */
export function asSessionMock(auth: unknown): Mock<() => Promise<Session | null>> {
  return vi.mocked(auth as unknown as () => Promise<Session | null>);
}
