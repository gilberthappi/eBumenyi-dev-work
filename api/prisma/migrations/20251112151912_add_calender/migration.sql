-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('TRAINING', 'REMINDER', 'DEADLINE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CalendarFrequency" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "CalendarAttendanceStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'COMPLETED');

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CalendarEventType" NOT NULL DEFAULT 'TRAINING',
    "frequency" "CalendarFrequency" NOT NULL DEFAULT 'NONE',
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "reminderMinutesBefore" INTEGER DEFAULT 30,
    "recurrenceEndsAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "courseId" TEXT,
    "googleSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CalendarAttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventParticipant_eventId_userId_key" ON "CalendarEventParticipant"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventParticipant" ADD CONSTRAINT "CalendarEventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventParticipant" ADD CONSTRAINT "CalendarEventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
