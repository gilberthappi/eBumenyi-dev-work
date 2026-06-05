-- CreateTable
CREATE TABLE "ExpandedCalendarEvent" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "expandedStartAt" TIMESTAMP(3) NOT NULL,
    "expandedEndAt" TIMESTAMP(3),
    "occurrenceNum" INTEGER NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpandedCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpandedCalendarEvent_instanceId_key" ON "ExpandedCalendarEvent"("instanceId");

-- CreateIndex
CREATE INDEX "ExpandedCalendarEvent_seriesId_idx" ON "ExpandedCalendarEvent"("seriesId");

-- CreateIndex
CREATE INDEX "ExpandedCalendarEvent_expandedStartAt_expandedEndAt_idx" ON "ExpandedCalendarEvent"("expandedStartAt", "expandedEndAt");

-- CreateIndex
CREATE INDEX "ExpandedCalendarEvent_instanceId_idx" ON "ExpandedCalendarEvent"("instanceId");
