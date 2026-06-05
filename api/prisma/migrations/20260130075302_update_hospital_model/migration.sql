-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "activeChws" INTEGER DEFAULT 0,
ADD COLUMN     "cell" TEXT,
ADD COLUMN     "chwSupervisor" TEXT,
ADD COLUMN     "chwSupervisorContact" TEXT,
ADD COLUMN     "contact" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "districtsCovered" JSONB,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "totalChws" INTEGER DEFAULT 0,
ADD COLUMN     "village" TEXT;
