-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('EBUMENYI_MEETING', 'GOOGLE_MEET', 'ZOOM', 'MICROSOFT_TEAMS', 'OTHER');

-- CreateEnum
CREATE TYPE "EventPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterEnum
ALTER TYPE "CalendarEventType" ADD VALUE IF NOT EXISTS 'WEBINAR';
ALTER TYPE "CalendarEventType" ADD VALUE IF NOT EXISTS 'MEETING';
ALTER TYPE "CalendarEventType" ADD VALUE IF NOT EXISTS 'SCREENING';
ALTER TYPE "CalendarEventType" ADD VALUE IF NOT EXISTS 'DRILL';

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "hostEmail" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "meetingType" "MeetingType" DEFAULT 'EBUMENYI_MEETING',
ADD COLUMN     "priority" "EventPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "roles" JSONB;

-- AlterTable
ALTER TABLE "CalendarEventParticipant" ADD COLUMN     "role" TEXT;

-- CreateTable
CREATE TABLE "CalendarEventExternalParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" "CalendarAttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEventExternalParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventExternalParticipant_eventId_email_key" ON "CalendarEventExternalParticipant"("eventId", "email");