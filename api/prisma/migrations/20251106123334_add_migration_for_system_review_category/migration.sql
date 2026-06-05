/*
  Warnings:

  - Added the required column `categoryId` to the `CategoryRating` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CategoryRating" ADD COLUMN     "categoryId" TEXT NOT NULL;
