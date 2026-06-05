/*
  Warnings:

  - You are about to drop the column `districtsCovered` on the `Hospital` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Hospital` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Hospital" DROP COLUMN "districtsCovered",
DROP COLUMN "location",
ADD COLUMN     "catchmentArea" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "province" TEXT;
