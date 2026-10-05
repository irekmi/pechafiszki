import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

/**
 * Auth.js v5 with the credentials provider (CLAUDE.md §2). The verification itself lives in
 * `services/signIn.ts`, which the provider loads dynamically so argon2 and Prisma stay out of every
 * edge bundle; `src/middleware.ts` reads `auth.config.ts` instead of this file.
 *
 * The identity `authorize` returns is built from the database row, so no field a caller submits can
 * become a role (AC-03.5).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const { authorizeCredentials } = await import("./services/signIn");
        const user = await authorizeCredentials(raw);
        if (!user) return null;
        return {
          id: String(user.id),
          email: user.email,
          nickname: user.nickname,
          role: user.role,
        };
      },
    }),
  ],
});
