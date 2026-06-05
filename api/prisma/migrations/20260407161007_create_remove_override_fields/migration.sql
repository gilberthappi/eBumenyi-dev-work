/*
  Warnings:

  - You are about to drop the `ExpandedCalendarEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "commonId" TEXT,
ADD COLUMN     "isCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRepeating" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "ExpandedCalendarEvent";

-- CreateIndex
CREATE INDEX "CalendarEvent_commonId_idx" ON "CalendarEvent"("commonId");

-- CreateIndex
CREATE INDEX "CalendarEvent_isRepeating_idx" ON "CalendarEvent"("isRepeating");

-- CreateIndex
CREATE INDEX "CalendarEvent_isCancelled_idx" ON "CalendarEvent"("isCancelled");
