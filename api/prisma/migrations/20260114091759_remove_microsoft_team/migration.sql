/*
  Warnings:

  - The values [MICROSOFT_TEAMS] on the enum `MeetingType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MeetingType_new" AS ENUM ('EBUMENYI_MEETING', 'GOOGLE_MEET', 'ZOOM', 'OTHER');
ALTER TABLE "CalendarEvent" ALTER COLUMN "meetingType" DROP DEFAULT;
ALTER TABLE "CalendarEvent" ALTER COLUMN "meetingType" TYPE "MeetingType_new" USING ("meetingType"::text::"MeetingType_new");
ALTER TYPE "MeetingType" RENAME TO "MeetingType_old";
ALTER TYPE "MeetingType_new" RENAME TO "MeetingType";
DROP TYPE "MeetingType_old";
ALTER TABLE "CalendarEvent" ALTER COLUMN "meetingType" SET DEFAULT 'EBUMENYI_MEETING';
COMMIT;