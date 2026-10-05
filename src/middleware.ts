import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/server/auth.config";
import { isProtectedPath, signInUrlFor } from "@/server/routeAccess";

/**
 * A second net in front of the layout guards, never a replacement for them: it sends a Guest to
 * SCR-01 carrying the address that forced it, and puts that address on the request so
 * `src/server/permissions.ts` can rebuild the same target if it has to refuse on its own.
 *
 * It decides no role. `requireUser` / `requireAdmin` still run on the server for every protected
 * page, because a middleware that could be skipped must never be the only check (CLAUDE.md §8).
 *
 * It reads `auth.config.ts`, which carries no provider, so argon2 and Prisma stay out of the edge
 * bundle.
 */
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { nextUrl } = request;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", nextUrl.pathname);

  if (isProtectedPath(nextUrl.pathname) && !request.auth) {
    const target = signInUrlFor(nextUrl.pathname, nextUrl.search);
    return NextResponse.redirect(new URL(target, nextUrl));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico|webmanifest)$).*)"],
};
