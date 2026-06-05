/**
 * Schema for NL→SQL aligned with actual DB (see https://apitest.ebumenyi.online/).
 * PostgreSQL: use double quotes for all table and column names (camelCase and PascalCase).
 */
export const SCHEMA_SUMMARY = `
PostgreSQL schema. Use double quotes for every table and column name (e.g. "User", "Student", "userId", "fullNames").

Tables:
- "User" (id, email, fullNames, phoneNumber, district, sector, cell, village, industry, hospitalId, gender, birthdate, createdAt, updatedAt)  -- gender: 'Male', 'Female', etc.; birthdate for age
- "Student" (id, userId, role, status)  -- links to User via "userId" = "User"."id". status: ACTIVE, INACTIVE, SUSPENDED, GRADUATED
- "UserRole" (id, userId, name)  -- name: ADMIN, TRAINER, TRAINEE, STAFF
- "Staff" (id, userId, role)
- "Course" (id, creatorId, title, coverIcon, description, rating, isPublished, createdAt, updatedAt)
- "Section" (id, courseId, title, description, totalChapter, createdAt, updatedAt)
- "Chapter" (id, sectionId, title, description, totalSlide, chapterNumber, isPublished, createdAt, updatedAt)
- "Slide" (id, chapterId, slideNumber, note, description, isPublished, createdAt, updatedAt)
- "CourseProgress" (id, studentId, courseId, progress, isCompleted, createdAt, updatedAt)
- "ChapterProgress" (id, studentId, chapterId, progress, isCompleted, createdAt, updatedAt)
- "SlideProgress" (id, studentId, slideId, isCompleted, createdAt, updatedAt)
- "AttempTest" (id, studentId, preTestId, midTestId, finalTestId, finalExamId, tryCount, marks, isCompleted, createdAt, updatedAt)
- "AttemptAnswer" (id, attemptId, questionnaireId, selectedAnswerIds, isCorrect, marks, createdAt, updatedAt)
- "Questionnaire" (id, question, questionImage, midTestId, courseId, createdAt, updatedAt)  -- question text; link to mid-chapter test or course
- "MidTest" (id, chapterId, questionToBeAnswered, marksToPass, description, createdAt, updatedAt)
- "PreTest" (id, courseId, marksToPass, description, ...)
- "FinalTest" (id, courseId, marksToPass, ...)
- "FinalExam" (id, courseId, marksToPass, ...)
- "Certificate" (id, studentId, courseId, pdf, createdAt, updatedAt)
- "CourseReview" (id, studentId, courseId, comment, rating, createdAt, updatedAt)
- "Hospital" (id, name, province, district, sector, contact, email, totalChws, activeChws, createdAt, updatedAt)
- "Notification" (id, userId, title, message, type, isRead, createdAt, updatedAt)
- conversations (id, type, name, isPublic, createdAt, updatedAt, lastMessageId)
- messages (id, conversationId, senderId, type, title, content, attachments, timestamp)

Relations:
- Student."userId" = "User"."id" (student's profile: name, district, etc.)
- CourseProgress."studentId" = "Student"."id", CourseProgress."courseId" = "Course"."id"
- AttempTest."studentId" = "Student"."id" (test attempts per student)
- AttemptAnswer."attemptId" = "AttempTest"."id"; AttemptAnswer."questionnaireId" = "Questionnaire"."id"
- Questionnaire may have "midTestId" (chapter quiz) or "courseId" (course-level)
- MidTest."chapterId" = "Chapter"."id" (one mid-test per chapter)
- Certificate."studentId" = "Student"."id", Certificate."courseId" = "Course"."id"
`.trim();

export function getSchemaForPrompt(): string {
  return SCHEMA_SUMMARY;
}
