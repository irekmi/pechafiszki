-- SQ-02.1: case-insensitive uniqueness (DEC-24, DEC-44) moves from `citext` columns to plain
-- `text` columns plus unique indexes over `lower(...)`. Prisma cannot express an expression index
-- in schema.prisma, so these indexes exist only here: never drop them in a later migration.
-- Lookups by address, nickname or name must compare `lower(...)` to use them (mode: "insensitive").

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" TYPE TEXT,
ALTER COLUMN "nickname" TYPE TEXT;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "name" TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_lower_key" ON "User" (lower("email"));

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_lower_key" ON "User" (lower("nickname"));

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_lower_key" ON "Category" (lower("name"));

-- DropExtension
DROP EXTENSION IF EXISTS "citext";
