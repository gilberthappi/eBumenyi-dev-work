-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('WELTEL', 'RBC', 'SFH', 'CIIC_HIN');

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionnaireId_fkey";

-- DropForeignKey
ALTER TABLE "AttempTest" DROP CONSTRAINT "AttempTest_finalExamId_fkey";

-- DropForeignKey
ALTER TABLE "AttempTest" DROP CONSTRAINT "AttempTest_finalTestId_fkey";

-- DropForeignKey
ALTER TABLE "AttempTest" DROP CONSTRAINT "AttempTest_midTestId_fkey";

-- DropForeignKey
ALTER TABLE "AttempTest" DROP CONSTRAINT "AttempTest_preTestId_fkey";

-- DropForeignKey
ALTER TABLE "AttempTest" DROP CONSTRAINT "AttempTest_studentId_fkey";

-- DropForeignKey
ALTER TABLE "AttemptAnswer" DROP CONSTRAINT "AttemptAnswer_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "AttemptAnswer" DROP CONSTRAINT "AttemptAnswer_questionnaireId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_createdById_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEventParticipant" DROP CONSTRAINT "CalendarEventParticipant_eventId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEventParticipant" DROP CONSTRAINT "CalendarEventParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryRating" DROP CONSTRAINT "CategoryRating_systemReviewId_fkey";

-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "ChapterCategoryRating" DROP CONSTRAINT "ChapterCategoryRating_chapterReviewId_fkey";

-- DropForeignKey
ALTER TABLE "ChapterProgress" DROP CONSTRAINT "ChapterProgress_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "ChapterProgress" DROP CONSTRAINT "ChapterProgress_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ChapterReview" DROP CONSTRAINT "ChapterReview_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "ChapterReview" DROP CONSTRAINT "ChapterReview_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "CourseCategoryRating" DROP CONSTRAINT "CourseCategoryRating_courseReviewId_fkey";

-- DropForeignKey
ALTER TABLE "CourseIntro" DROP CONSTRAINT "CourseIntro_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CourseProgress" DROP CONSTRAINT "CourseProgress_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CourseProgress" DROP CONSTRAINT "CourseProgress_studentId_fkey";

-- DropForeignKey
ALTER TABLE "CourseReview" DROP CONSTRAINT "CourseReview_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CourseReview" DROP CONSTRAINT "CourseReview_studentId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentOnSlide" DROP CONSTRAINT "DocumentOnSlide_courseId_fkey";

-- DropForeignKey
ALTER TABLE "FAQOnSlide" DROP CONSTRAINT "FAQOnSlide_slideId_fkey";

-- DropForeignKey
ALTER TABLE "FAQOnSlide" DROP CONSTRAINT "FAQOnSlide_userId_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackOnSlide" DROP CONSTRAINT "FeedbackOnSlide_slideId_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackOnSlide" DROP CONSTRAINT "FeedbackOnSlide_userId_fkey";

-- DropForeignKey
ALTER TABLE "FinalExam" DROP CONSTRAINT "FinalExam_courseId_fkey";

-- DropForeignKey
ALTER TABLE "FinalTest" DROP CONSTRAINT "FinalTest_courseId_fkey";

-- DropForeignKey
ALTER TABLE "MidTest" DROP CONSTRAINT "MidTest_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_questionnaireId_fkey";

-- DropForeignKey
ALTER TABLE "PreTest" DROP CONSTRAINT "PreTest_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Questionnaire" DROP CONSTRAINT "Questionnaire_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Questionnaire" DROP CONSTRAINT "Questionnaire_midTestId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_courseId_fkey";

-- DropForeignKey
ALTER TABLE "SectionCategoryRating" DROP CONSTRAINT "SectionCategoryRating_sectionReviewId_fkey";

-- DropForeignKey
ALTER TABLE "SectionReview" DROP CONSTRAINT "SectionReview_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "SectionReview" DROP CONSTRAINT "SectionReview_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Slide" DROP CONSTRAINT "Slide_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "SlideProgress" DROP CONSTRAINT "SlideProgress_slideId_fkey";

-- DropForeignKey
ALTER TABLE "SlideProgress" DROP CONSTRAINT "SlideProgress_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_userId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_userId_fkey";

-- DropForeignKey
ALTER TABLE "StudentOnSlide" DROP CONSTRAINT "StudentOnSlide_slideId_fkey";

-- DropForeignKey
ALTER TABLE "StudentOnSlide" DROP CONSTRAINT "StudentOnSlide_studentId_fkey";

-- DropForeignKey
ALTER TABLE "SystemReview" DROP CONSTRAINT "SystemReview_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "industry" "Industry";
