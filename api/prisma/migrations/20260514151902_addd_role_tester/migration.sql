/*
  Warnings:

  - The values [ADMINISTRATOR] on the enum `RoleType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoleType_new" AS ENUM ('ADMIN', 'TRAINER', 'SUPERVISOR', 'TRAINEE', 'DEVELOPER', 'TESTER', 'STAFF');
ALTER TABLE "Staff" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "UserRole" ALTER COLUMN "name" TYPE "RoleType_new" USING ("name"::text::"RoleType_new");
ALTER TABLE "Student" ALTER COLUMN "role" TYPE "RoleType_new" USING ("role"::text::"RoleType_new");
ALTER TABLE "Staff" ALTER COLUMN "role" TYPE "RoleType_new" USING ("role"::text::"RoleType_new");
ALTER TYPE "RoleType" RENAME TO "RoleType_old";
ALTER TYPE "RoleType_new" RENAME TO "RoleType";
DROP TYPE "RoleType_old";
ALTER TABLE "Staff" ALTER COLUMN "role" SET DEFAULT 'STAFF';
ALTER TABLE "Student" ALTER COLUMN "role" SET DEFAULT 'TRAINEE';
COMMIT;
