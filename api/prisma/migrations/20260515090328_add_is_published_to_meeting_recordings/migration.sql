-- AlterTable
ALTER TABLE "meeting_recordings" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "meeting_recordings_isPublished_idx" ON "meeting_recordings"("isPublished");
