/*
  Warnings:

  - The `reviewCriteria` column on the `CourseReview` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `reviewCriteria` column on the `SystemReview` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "CourseReview" DROP COLUMN "reviewCriteria",
ADD COLUMN     "reviewCriteria" TEXT[];

-- AlterTable
ALTER TABLE "SystemReview" DROP COLUMN "reviewCriteria",
ADD COLUMN     "reviewCriteria" TEXT[];
