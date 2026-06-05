/*
  Warnings:

  - A unique constraint covering the columns `[lastPostId]` on the table `communities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lastMessageId]` on the table `direct_chats` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lastMessageId]` on the table `group_chats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "lastPostId" TEXT;

-- AlterTable
ALTER TABLE "direct_chats" ADD COLUMN     "lastMessageId" TEXT;

-- AlterTable
ALTER TABLE "group_chats" ADD COLUMN     "lastMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "communities_lastPostId_key" ON "communities"("lastPostId");

-- CreateIndex
CREATE UNIQUE INDEX "direct_chats_lastMessageId_key" ON "direct_chats"("lastMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "group_chats_lastMessageId_key" ON "group_chats"("lastMessageId");
