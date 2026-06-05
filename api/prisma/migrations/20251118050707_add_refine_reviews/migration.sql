/*
  Warnings:

  - You are about to drop the column `reviewCriteria` on the `ChapterReview` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCriteria` on the `CourseReview` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCriteria` on the `SectionReview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChapterReview" DROP COLUMN "reviewCriteria";

-- AlterTable
ALTER TABLE "CourseReview" DROP COLUMN "reviewCriteria";

-- AlterTable
ALTER TABLE "SectionReview" DROP COLUMN "reviewCriteria";

-- CreateTable
CREATE TABLE "CourseCategoryRating" (
    "id" TEXT NOT NULL,
    "courseReviewId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCategoryRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionCategoryRating" (
    "id" TEXT NOT NULL,
    "sectionReviewId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionCategoryRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterCategoryRating" (
    "id" TEXT NOT NULL,
    "chapterReviewId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterCategoryRating_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourseCategoryRating" ADD CONSTRAINT "CourseCategoryRating_courseReviewId_fkey" FOREIGN KEY ("courseReviewId") REFERENCES "CourseReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionCategoryRating" ADD CONSTRAINT "SectionCategoryRating_sectionReviewId_fkey" FOREIGN KEY ("sectionReviewId") REFERENCES "SectionReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterCategoryRating" ADD CONSTRAINT "ChapterCategoryRating_chapterReviewId_fkey" FOREIGN KEY ("chapterReviewId") REFERENCES "ChapterReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
