/**
 * The path table — *which* addresses are protected, in Polish route segments (CLAUDE.md §4, §5).
 * It decides no permission: that is `src/server/permissions.ts` alone. This file exists only
 * because `src/middleware.ts` runs on the edge and cannot import the module that does.
 *
 * Missing a prefix here costs the return path of AC-03.3, never the protection itself: the
 * authoritative guard is the `(app)` / `(admin)` layout, which covers every segment beneath it.
 */

export const SIGN_IN_PATH = "/logowanie";
/** SCR-05 start is served at `/` (SQ-01.1); `/start` is a permanent redirect in next.config.ts. */
export const SIGNED_IN_HOME = "/";

/**
 * SCR-06 … SCR-14, SCR-23 — every address that needs a session (spec/permissions.md). SCR-05 at
 * `/` is protected too, but `/` matches only itself, so `isProtectedPath` handles it apart.
 */
const PROTECTED_PREFIXES = [
  "/nauka",
  "/podsumowanie",
  "/fiszki",
  "/dodaj",
  "/moje-fiszki",
  "/edytuj",
  "/statystyki",
  "/profil",
  "/administracja",
] as const;

/** SCR-15 … SCR-21 — the administration area, which is admin-only (DEC-57). */
const ADMIN_PREFIX = "/administracja";

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  if (pathname === SIGNED_IN_HOME) return true;
  return PROTECTED_PREFIXES.some((prefix) => matches(pathname, prefix));
}

export function isAdminPath(pathname: string): boolean {
  return matches(pathname, ADMIN_PREFIX);
}

/**
 * Sanitises the address a forced sign-in should return to. Anything that is not a plain, same-site
 * path — an absolute URL, a protocol-relative `//host`, a backslash Windows resolves as a slash —
 * is discarded rather than followed, so `?powrot=` can never become an open redirect.
 */
export function safeReturnPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return SIGNED_IN_HOME;
  }
  const path = raw.split(/[?#]/, 1)[0] ?? "";
  return isProtectedPath(path) ? raw : SIGNED_IN_HOME;
}

/** The address a Guest is sent to, carrying the path that forced the sign-in. */
export function signInUrlFor(pathname: string, search = ""): string {
  const target = `${pathname}${search}`;
  // SCR-01 already returns a signed-in person to SCR-05, so `/` needs no `?powrot=`.
  if (!isProtectedPath(pathname) || target === SIGNED_IN_HOME) return SIGN_IN_PATH;
  return `${SIGN_IN_PATH}?powrot=${encodeURIComponent(target)}`;
}
