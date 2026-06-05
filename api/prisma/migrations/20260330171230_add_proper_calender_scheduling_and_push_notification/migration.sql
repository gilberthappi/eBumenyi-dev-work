/*
  Warnings:

  - You are about to drop the column `courseId` on the `CalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `googleEventId` on the `CalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `googleSyncEnabled` on the `CalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `CalendarEvent` table. All the data in the column will be lost.
  - The `reminderMinutesBefore` column on the `CalendarEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `role` on the `CalendarEventExternalParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `CalendarEventExternalParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `CalendarEventParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `CalendarEventParticipant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CalendarEvent" DROP COLUMN "courseId",
DROP COLUMN "googleEventId",
DROP COLUMN "googleSyncEnabled",
DROP COLUMN "roles",
DROP COLUMN "reminderMinutesBefore",
ADD COLUMN     "reminderMinutesBefore" INTEGER[] DEFAULT ARRAY[30]::INTEGER[];

-- AlterTable
ALTER TABLE "CalendarEventExternalParticipant" DROP COLUMN "role",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "CalendarEventParticipant" DROP COLUMN "role",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "CalendarAttendanceStatus";

-- CreateTable
CREATE TABLE "NotificationPushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "deviceId" VARCHAR(200),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageUnreadCounter" (
    "userId" TEXT NOT NULL,
    "totalUnread" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageUnreadCounter_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventAttachment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEventAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPushToken_userId_token_key" ON "NotificationPushToken"("userId", "token");
