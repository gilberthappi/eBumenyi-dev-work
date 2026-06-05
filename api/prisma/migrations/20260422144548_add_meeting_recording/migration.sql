-- CreateTable
CREATE TABLE "meeting_recordings" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_recordings_eventId_idx" ON "meeting_recordings"("eventId");

-- CreateIndex
CREATE INDEX "meeting_recordings_userId_idx" ON "meeting_recordings"("userId");
