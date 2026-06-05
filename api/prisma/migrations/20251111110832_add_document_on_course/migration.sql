/*
  Warnings:

  - You are about to drop the column `chapterId` on the `DocumentOnSlide` table. All the data in the column will be lost.
  - Added the required column `courseId` to the `DocumentOnSlide` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DocumentOnSlide" DROP CONSTRAINT "DocumentOnSlide_chapterId_fkey";

-- AlterTable
ALTER TABLE "DocumentOnSlide" DROP COLUMN "chapterId",
ADD COLUMN     "courseId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "DocumentOnSlide" ADD CONSTRAINT "DocumentOnSlide_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
