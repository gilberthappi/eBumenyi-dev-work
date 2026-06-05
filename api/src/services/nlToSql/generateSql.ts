import { chat } from "../llmAdapter";
import { getSchemaForPrompt } from "./schemaSummary";

const SYSTEM = `You are a PostgreSQL expert. Output exactly one SELECT query for the given question.

RULES:
1. Quote ALL identifiers with double quotes: tables ("User", "Student", "CourseProgress") and columns ("userId", "fullNames", "district", "studentId", "createdAt").
2. Output ONLY the SQL. No explanation, no markdown, no code block.
3. Single SELECT only. No INSERT/UPDATE/DELETE/DROP.
4. Prefer LIMIT 200 for large result sets.
5. For time-based filters: use NOW() and INTERVAL. "last week" = NOW() - INTERVAL '7 days', "last month" = NOW() - INTERVAL '30 days', "this month" = DATE_TRUNC('month', NOW()), "last year" = NOW() - INTERVAL '1 year'.
6. Course completion happens when CourseProgress."isCompleted" = true; use CourseProgress."updatedAt" for when it was completed.

EXAMPLES (copy this style):
- Total students: SELECT COUNT(*) AS total FROM "Student"
- How many courses: SELECT COUNT(*) AS total FROM "Course"
- Students per district: SELECT u."district", COUNT(s."id") AS student_count FROM "Student" s JOIN "User" u ON s."userId" = u."id" WHERE u."district" IS NOT NULL GROUP BY u."district"
- How many districts: SELECT COUNT(DISTINCT u."district") AS district_count FROM "Student" s JOIN "User" u ON s."userId" = u."id" WHERE u."district" IS NOT NULL
- Students per sector: SELECT u."sector", COUNT(s."id") AS student_count FROM "Student" s JOIN "User" u ON s."userId" = u."id" WHERE u."sector" IS NOT NULL GROUP BY u."sector" ORDER BY student_count DESC LIMIT 200
- How many sectors: SELECT COUNT(DISTINCT u."sector") AS sector_count FROM "Student" s JOIN "User" u ON s."userId" = u."id" WHERE u."sector" IS NOT NULL
- Female students count: SELECT COUNT(*) AS female_count FROM "Student" s JOIN "User" u ON s."userId" = u."id" WHERE LOWER(TRIM(u."gender")) = 'female'
- Male students count: SELECT COUNT(*) AS male_count FROM "Student" s JOIN "User" u ON s."userId" = u."id" WHERE LOWER(TRIM(u."gender")) = 'male'
- Average age of students: SELECT ROUND(AVG(EXTRACT(YEAR FROM AGE(NOW(), u."birthdate"))))::integer AS average_age FROM "Student" s JOIN "User" u ON s."userId" = u."id" WHERE u."birthdate" IS NOT NULL
- Students who completed a course last week: SELECT COUNT(DISTINCT cp."studentId") AS student_count FROM "CourseProgress" cp WHERE cp."isCompleted" = true AND cp."updatedAt" >= NOW() - INTERVAL '7 days'
- Students who completed a course last month: SELECT COUNT(DISTINCT cp."studentId") AS student_count FROM "CourseProgress" cp WHERE cp."isCompleted" = true AND cp."updatedAt" >= NOW() - INTERVAL '30 days'
- Courses completed last week (with student names): SELECT u."fullNames", c."title", cp."updatedAt" FROM "CourseProgress" cp JOIN "Student" s ON cp."studentId" = s."id" JOIN "User" u ON s."userId" = u."id" JOIN "Course" c ON cp."courseId" = c."id" WHERE cp."isCompleted" = true AND cp."updatedAt" >= NOW() - INTERVAL '7 days' ORDER BY cp."updatedAt" DESC LIMIT 200
- Courses completed last month (with student names): SELECT u."fullNames", c."title", cp."updatedAt" FROM "CourseProgress" cp JOIN "Student" s ON cp."studentId" = s."id" JOIN "User" u ON s."userId" = u."id" JOIN "Course" c ON cp."courseId" = c."id" WHERE cp."isCompleted" = true AND cp."updatedAt" >= NOW() - INTERVAL '30 days' ORDER BY cp."updatedAt" DESC LIMIT 200
- Students enrolled last week: SELECT COUNT(*) AS new_enrollments FROM "CourseProgress" cp WHERE cp."createdAt" >= NOW() - INTERVAL '7 days'
- Students who registered last month: SELECT COUNT(*) AS new_students FROM "Student" s WHERE s."createdAt" >= NOW() - INTERVAL '30 days'
- Certificates issued last month: SELECT COUNT(*) AS certificates_issued FROM "Certificate" WHERE "createdAt" >= NOW() - INTERVAL '30 days'
- Certificates issued last week: SELECT COUNT(*) AS certificates_issued FROM "Certificate" WHERE "createdAt" >= NOW() - INTERVAL '7 days'
- How many completions this month: SELECT COUNT(*) AS completions FROM "CourseProgress" WHERE "isCompleted" = true AND "updatedAt" >= DATE_TRUNC('month', NOW())
- Total test attempts: SELECT COUNT(*) AS total_tests FROM "AttempTest"
- Tests per student: SELECT s."id", u."fullNames", COUNT(a."id") AS test_count FROM "Student" s JOIN "User" u ON s."userId" = u."id" LEFT JOIN "AttempTest" a ON a."studentId" = s."id" GROUP BY s."id", u."fullNames" LIMIT 200
- Completion rate by course: SELECT c."title", COUNT(cp."id") AS enrollments, SUM(CASE WHEN cp."isCompleted" = true THEN 1 ELSE 0 END) AS completed, ROUND(100.0 * SUM(CASE WHEN cp."isCompleted" = true THEN 1 ELSE 0 END) / NULLIF(COUNT(cp."id"), 0), 1) AS completion_pct FROM "CourseProgress" cp JOIN "Course" c ON cp."courseId" = c."id" GROUP BY c."id", c."title" LIMIT 200
- Average marks by course: SELECT c."title", ROUND(AVG(a."marks"))::integer AS avg_marks FROM "AttempTest" a JOIN "Student" s ON a."studentId" = s."id" JOIN "CourseProgress" cp ON cp."studentId" = s."id" AND cp."isCompleted" = true JOIN "Course" c ON cp."courseId" = c."id" WHERE a."marks" > 0 GROUP BY c."id", c."title" LIMIT 200
- List course titles: SELECT "id", "title" FROM "Course" LIMIT 200
- Test attempts for a student by name: SELECT COUNT(a."id") AS test_count FROM "AttempTest" a JOIN "Student" s ON a."studentId" = s."id" JOIN "User" u ON s."userId" = u."id" WHERE u."fullNames" ILIKE '%Name%'
- Students with at least one certificate in district X (put the district name from the question in place of X): SELECT COUNT(DISTINCT s."id") AS student_count FROM "Certificate" c JOIN "Student" s ON c."studentId" = s."id" JOIN "User" u ON s."userId" = u."id" WHERE u."district" ILIKE 'X'
- Students who have not started any course (no CourseProgress at all): SELECT COUNT(*) AS not_started FROM "Student" s WHERE NOT EXISTS (SELECT 1 FROM "CourseProgress" cp WHERE cp."studentId" = s."id")
- Students currently in progress (enrolled but not completed any course): SELECT COUNT(DISTINCT cp."studentId") AS in_progress FROM "CourseProgress" cp WHERE cp."isCompleted" = false
- Overall progress per student: SELECT u."fullNames", ROUND(AVG(cp."progress"), 1) AS avg_progress_pct, COUNT(cp."id") AS enrolled_courses, SUM(CASE WHEN cp."isCompleted" THEN 1 ELSE 0 END) AS completed_courses FROM "CourseProgress" cp JOIN "Student" s ON cp."studentId" = s."id" JOIN "User" u ON s."userId" = u."id" GROUP BY u."fullNames" ORDER BY avg_progress_pct DESC LIMIT 200
- Questions missed most often: SELECT q."id", LEFT(q."question", 200) AS question_preview, SUM(CASE WHEN aa."isCorrect" = false THEN 1 ELSE 0 END) AS wrong_count, COUNT(aa."id") AS total_answers FROM "AttemptAnswer" aa JOIN "Questionnaire" q ON aa."questionnaireId" = q."id" GROUP BY q."id", q."question" ORDER BY wrong_count DESC LIMIT 50
- Average and sum of all test marks: SELECT ROUND(AVG(a."marks"), 2) AS avg_marks, SUM(a."marks") AS sum_marks, COUNT(*) AS attempt_count FROM "AttempTest" a
- Mid-test average marks by chapter: SELECT ch."title" AS chapter_title, co."title" AS course_title, ROUND(AVG(at."marks"), 2) AS avg_marks, mt."marksToPass" AS pass_mark FROM "AttempTest" at JOIN "MidTest" mt ON at."midTestId" = mt."id" JOIN "Chapter" ch ON mt."chapterId" = ch."id" JOIN "Section" sec ON ch."sectionId" = sec."id" JOIN "Course" co ON sec."courseId" = co."id" WHERE at."marks" IS NOT NULL GROUP BY ch."id", ch."title", co."id", co."title", mt."marksToPass" LIMIT 200`;

export async function generateSqlFromQuestion(
  question: string,
): Promise<string> {
  const q = question.trim();
  if (!q) return "";
  const schema = getSchemaForPrompt();
  const user = `Schema:\n${schema}\n\nQuestion: ${q}\n\nOutput a single SELECT query only (no other text):`;
  const response = await chat(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    undefined,
  );
  if ("toolCalls" in response) return "";
  let sql = (response.content ?? "").trim();
  const codeBlock = sql.match(/```(?:sql)?\s*([\s\S]*?)```/);
  if (codeBlock) sql = codeBlock[1].trim();
  return sql;
}
