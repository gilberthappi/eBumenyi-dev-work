-- CreateEnum
CREATE TYPE "RecordingAudience" AS ENUM ('ALL', 'TRAINEES', 'INVITED');

-- AlterTable
ALTER TABLE "meeting_recordings" ADD COLUMN     "publishedTo" "RecordingAudience" NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE "meeting_recording_invites" (
    "id" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_recording_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_recording_invites_recordingId_idx" ON "meeting_recording_invites"("recordingId");

-- CreateIndex
CREATE INDEX "meeting_recording_invites_userId_idx" ON "meeting_recording_invites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_recording_invites_recordingId_userId_key" ON "meeting_recording_invites"("recordingId", "userId");
