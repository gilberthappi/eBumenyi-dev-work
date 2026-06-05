/*
  Warnings:

  - You are about to drop the column `chapterId` on the `FinalTest` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `PreTest` table. All the data in the column will be lost.
  - You are about to drop the column `finalTestId` on the `Questionnaire` table. All the data in the column will be lost.
  - You are about to drop the column `preTestId` on the `Questionnaire` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FinalTest" DROP CONSTRAINT "FinalTest_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "PreTest" DROP CONSTRAINT "PreTest_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "Questionnaire" DROP CONSTRAINT "Questionnaire_finalTestId_fkey";

-- DropForeignKey
ALTER TABLE "Questionnaire" DROP CONSTRAINT "Questionnaire_preTestId_fkey";

-- DropIndex
DROP INDEX "FinalTest_chapterId_key";

-- AlterTable
ALTER TABLE "FinalTest" DROP COLUMN "chapterId",
ADD COLUMN     "courseId" TEXT;

-- AlterTable
ALTER TABLE "PreTest" DROP COLUMN "sectionId",
ADD COLUMN     "courseId" TEXT;

-- AlterTable
ALTER TABLE "Questionnaire" DROP COLUMN "finalTestId",
DROP COLUMN "preTestId",
ADD COLUMN     "courseId" TEXT;

-- AddForeignKey
ALTER TABLE "PreTest" ADD CONSTRAINT "PreTest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalTest" ADD CONSTRAINT "FinalTest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questionnaire" ADD CONSTRAINT "Questionnaire_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
