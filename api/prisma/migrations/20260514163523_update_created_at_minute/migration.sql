/*
  Warnings:

  - You are about to drop the column `createdAt_minute` on the `Notification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,type,entityType,entityId,createdAtMinute]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Notification_userId_type_entityType_entityId_createdAt_minu_key";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "createdAt_minute",
ADD COLUMN     "createdAtMinute" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_type_entityType_entityId_createdAtMinut_key" ON "Notification"("userId", "type", "entityType", "entityId", "createdAtMinute");
