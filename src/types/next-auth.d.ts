import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

/**
 * The shape this application puts in the session and the JWT. `role` is written here once, by the
 * `jwt` callback, out of the database row — never out of a request body, query or header
 * (CLAUDE.md §8).
 */
declare module "next-auth" {
  interface User {
    nickname: string;
    role: Role;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      email: string;
      nickname: string;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    uid: number;
    nickname: string;
    role: Role;
  }
}

export {};
