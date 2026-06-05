-- AlterTable
ALTER TABLE "User" ADD COLUMN "weltelUserId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_weltelUserId_key" ON "User"("weltelUserId");
