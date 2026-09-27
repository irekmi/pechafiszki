import { Prisma, type Role } from "@prisma/client";
import { db } from "@/server/db";
import { accountBlock, ROW_TOOLTIP } from "./accountBlocks";
import { foldedLikePattern } from "./libraryWhere";
import type { UsersParams } from "./usersParams";

/** One row of SCR-19. No password hash, and no field that is not shown. */
export type UserRow = {
  id: number;
  nickname: string;
  email: string;
  role: Role;
  createdAt: Date;
  submissionCount: number;
  isSelf: boolean;
  canDelete: boolean;
  blockReason: string | null;
};

/** `users` and `admins` are the whole system (the heading); `total` is what the filters match. */
export type UsersPage = { rows: UserRow[]; shown: number; total: number; users: number; admins: number };

type RawRow = Omit<UserRow, "isSelf" | "canDelete" | "blockReason">;

/** Aliases `u` User. The phrase is folded and escaped like SCR-18's (DEC-49, ISS-12), never `ILIKE`. */
function where(params: UsersParams): Prisma.Sql {
  const parts = [Prisma.sql`TRUE`];
  if (params.role) parts.push(Prisma.sql`u."role" = ${params.role === "admin" ? "ADMIN" : "USER"}::"Role"`);
  if (params.query) {
    const pattern = foldedLikePattern(params.query);
    parts.push(Prisma.sql`(fold_text(u."nickname") LIKE ${pattern} OR fold_text(u."email") LIKE ${pattern})`);
  }
  return Prisma.join(parts, " AND ");
}

/** Ties break on id, so paging is stable. */
function order(sort: UsersParams["sort"]): Prisma.Sql {
  if (sort === "oldest") return Prisma.sql`u."createdAt" ASC, u."id" ASC`;
  if (sort === "nickname") return Prisma.sql`lower(u."nickname") ASC, u."id" ASC`;
  return Prisma.sql`u."createdAt" DESC, u."id" DESC`;
}

/**
 * API-31 — every account, filtered, sorted and capped in the query (NFR-04, DEC-48). `isSelf`,
 * `canDelete` and `blockReason` are decided here, from the session's id and the whole-system administrator
 * count (DEC-47) — never in a component. The caller (the page) has passed `requireAdmin`.
 *
 * Raw SQL, on purpose (CLAUDE.md §2): the folded search runs on `fold_text()` and the row carries a
 * correlated count, which Prisma's query API cannot express together. Every value is a bound parameter.
 */
export async function listUsers(callerId: number, params: UsersParams): Promise<UsersPage> {
  const filter = where(params);
  const [rows, counted, users, admins] = await Promise.all([
    db.$queryRaw<RawRow[]>`
      SELECT u."id", u."nickname", u."email", u."role", u."createdAt",
             (SELECT count(*)::int FROM "Flashcard" f WHERE f."authorId" = u."id") AS "submissionCount"
      FROM "User" u
      WHERE ${filter}
      ORDER BY ${order(params.sort)}
      LIMIT ${params.limit}`,
    db.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS "total" FROM "User" u WHERE ${filter}`,
    db.user.count(),
    db.user.count({ where: { role: "ADMIN" } }),
  ]);
  return {
    rows: rows.map((row) => {
      const block = accountBlock(row, callerId, admins);
      return { ...row, isSelf: row.id === callerId, canDelete: block === null, blockReason: block && ROW_TOOLTIP[block] };
    }),
    shown: rows.length,
    total: counted[0]?.total ?? 0,
    users,
    admins,
  };
}
