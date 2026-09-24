import type { NextAuthConfig } from "next-auth";

/**
 * The half of the Auth.js configuration that carries no provider, so `src/middleware.ts` can read a
 * session on the edge without pulling argon2 and Prisma into its bundle. `src/server/auth.ts` adds
 * the credentials provider on top of it.
 *
 * DEC-45 — the session is a JWT cookie valid 30 days, rolling, with no "remember me".
 */

const THIRTY_DAYS = 30 * 24 * 60 * 60;
const ONE_DAY = 24 * 60 * 60;

export const authConfig = {
  // `AUTH_SECRET` comes from the environment only; it is never read from a file and never printed.
  trustHost: true,
  session: { strategy: "jwt", maxAge: THIRTY_DAYS, updateAge: ONE_DAY },
  pages: { signIn: "/logowanie", error: "/logowanie" },
  providers: [],
  callbacks: {
    /** The one place the role enters the token: from the row `authorize` verified, nothing else. */
    jwt({ token, user }) {
      if (user) {
        token.uid = Number(user.id);
        token.nickname = user.nickname;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.uid);
      session.user.nickname = token.nickname;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
