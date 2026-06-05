/*
  Warnings:

  - You are about to drop the column `comment` on the `SystemReview` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `SystemReview` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCriteria` on the `SystemReview` table. All the data in the column will be lost.
  - Added the required column `feedback` to the `SystemReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overallRating` to the `SystemReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendation` to the `SystemReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SystemReview" DROP COLUMN "comment",
DROP COLUMN "rating",
DROP COLUMN "reviewCriteria",
ADD COLUMN     "feedback" TEXT NOT NULL,
ADD COLUMN     "overallRating" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "recommendation" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CategoryRating" (
    "id" TEXT NOT NULL,
    "systemReviewId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryRating_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CategoryRating" ADD CONSTRAINT "CategoryRating_systemReviewId_fkey" FOREIGN KEY ("systemReviewId") REFERENCES "SystemReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
