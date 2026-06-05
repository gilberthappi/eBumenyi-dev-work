/*
  Warnings:

  - The `districtsCovered` column on the `Hospital` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Hospital" DROP COLUMN "districtsCovered",
ADD COLUMN     "districtsCovered" TEXT[] DEFAULT ARRAY[]::TEXT[];
