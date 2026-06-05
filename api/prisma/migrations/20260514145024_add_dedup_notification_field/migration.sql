/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,entityType,entityId,createdAt_minute]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "createdAt_minute" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_type_entityType_entityId_createdAt_minu_key" ON "Notification"("userId", "type", "entityType", "entityId", "createdAt_minute");
