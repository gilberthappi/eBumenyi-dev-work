import type { ToolDef } from "./llmAdapter";
import { CourseService } from "./courseService";
import { ProgressService } from "./progressService";
import { StudentService } from "./studentService";
import { CertificateService } from "./certificateService";
import {
  extractCourseTitleForPlatformTestAggregates,
  extractGenderForDistrictComparison,
  extractCompletionsPeriodsFromQuestion,
  extractCourseTitleForReviewsQuestion,
  extractTestPerformanceDemographicsArgs,
  extractStudentNameFromBestCourseQuestion,
  extractStudentNameFromProfileRequest,
  extractStudentNameFromTestPerformanceQuestion,
  extractStudentProgressInCourseNameAndTitle,
  isCompletionsOverTimeQuestion,
  isCourseReviewsQuestion,
  isPlatformCertificateTotalsQuestion,
  isTopPerformingCoursesQuestion,
  isDistrictPerformanceComparisonQuestion,
  isDropoutRiskStudentsQuestion,
  isTestPerformanceDemographicsQuestion,
  isFlaggedMidTestChaptersQuestion,
  isInProgressNoCompleteQuestion,
  isMostFailedQuestionsQuestion,
  isNotStartedAnyCourseQuestion,
  isPlatformTestAggregatesQuestion,
} from "./chatQuestionMatchers";
import { generateSqlFromQuestion } from "./nlToSql/generateSql";
import { validateReadOnlySql } from "./nlToSql/sqlValidator";
import { runReadOnlyQuery } from "./nlToSql/sqlRunner";
import type { Prisma } from "@prisma/client";
import { prisma } from "../utils/client";

export type ChatContext = { studentId: string | null; isStaff: boolean };

/** Normalize apostrophe / quote variants so DB titles match user text (e.g. Y' vs Y'). */
function normalizeCourseSearchString(s: string): string {
  return s
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u02BC/g, "'")
    .replace(/\u2032/g, "'")
    .replace(/\s+/g, " ");
}

/** Try both ASCII and curly apostrophe — Prisma `contains` is literal. */
function titleContainsVariants(
  value: string,
): { title: { contains: string; mode: "insensitive" } }[] {
  const v = normalizeCourseSearchString(value);
  const curly = v.replace(/'/g, "\u2019");
  if (curly !== v) {
    return [
      { title: { contains: v, mode: "insensitive" } },
      { title: { contains: curly, mode: "insensitive" } },
    ];
  }
  return [{ title: { contains: v, mode: "insensitive" } }];
}

/** Levenshtein distance (course title words are short). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  if (m > 32 || n > 32) return 99;
  const prev = new Array<number>(n + 1);
  const cur = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = cur[j];
  }
  return prev[n];
}

async function findCourseByFuzzyWordsFallback(
  q: string,
): Promise<{ id: string; title: string } | null> {
  const qNorm = normalizeCourseSearchString(q).toLowerCase();
  const words = qNorm.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length < 2) return null;
  const longWords = words
    .filter((w) => w.length >= 5)
    .sort((a, b) => b.length - a.length);
  const anchor = longWords[0] ?? words[0];
  const candidates = await prisma.course.findMany({
    where: { OR: titleContainsVariants(anchor) },
    select: { id: true, title: true },
    take: 150,
  });
  const qWords = words;
  let best: { id: string; title: string } | null = null;
  let bestScore = -1;
  for (const c of candidates) {
    const tNorm = normalizeCourseSearchString(c.title).toLowerCase();
    const tParts = tNorm.split(/\s+/);
    let score = 0;
    for (const qw of qWords) {
      if (tNorm.includes(qw)) {
        score += qw.length + 2;
        continue;
      }
      let hit = false;
      for (const tp of tParts) {
        if (tp.includes(qw) || qw.includes(tp)) {
          score += Math.min(tp.length, qw.length);
          hit = true;
          break;
        }
        if (qw.length >= 5 && tp.length >= 5 && levenshtein(qw, tp) <= 2) {
          score += Math.min(tp.length, qw.length) - 1;
          hit = true;
          break;
        }
      }
      if (!hit && qw.length >= 6) {
        for (const tp of tParts) {
          if (tp.length >= 6 && levenshtein(qw, tp) <= 2) {
            score += 4;
            break;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  const threshold = Math.max(12, qNorm.replace(/\s/g, "").length * 0.55);
  if (best && bestScore >= threshold) return best;
  return null;
}

/** Match course by title when user text may be longer or shorter than the stored title. */
async function findCourseByFlexibleTitle(
  search: string,
): Promise<{ id: string; title: string } | null> {
  const q = normalizeCourseSearchString(search);
  if (!q) return null;

  let course = await prisma.course.findFirst({
    where: { OR: titleContainsVariants(q) },
    select: { id: true, title: true },
  });
  if (course) return course;

  const words = q.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length >= 2) {
    course = await prisma.course.findFirst({
      where: {
        AND: words.map((w) => ({ OR: titleContainsVariants(w) })),
      },
      select: { id: true, title: true },
    });
    if (course) return course;
  }

  const qNormLower = q.toLowerCase();
  const searchWords = words.length ? words : [q];
  const sortedWords = [...searchWords].sort((a, b) => b.length - a.length);
  for (const w of sortedWords) {
    const candidates = await prisma.course.findMany({
      where: { OR: titleContainsVariants(w) },
      select: { id: true, title: true },
      take: 120,
    });
    let best: { id: string; title: string } | null = null;
    let bestLen = -1;
    for (const c of candidates) {
      const tl = normalizeCourseSearchString(c.title).toLowerCase();
      if (qNormLower.includes(tl) && tl.length > bestLen) {
        best = c;
        bestLen = tl.length;
      }
    }
    if (best) return best;
  }

  if (q.length > 15) {
    for (const len of [Math.min(40, q.length), 30, 24]) {
      const prefix = q.slice(0, len).trim();
      if (prefix.length < 8) break;
      course = await prisma.course.findFirst({
        where: { OR: titleContainsVariants(prefix) },
        select: { id: true, title: true },
      });
      if (course) return course;
    }
  }

  return findCourseByFuzzyWordsFallback(q);
}

type DistrictPerfRow = {
  district: string;
  studentCount: number;
  enrollments: number;
  completed: number;
  completionRatePercent: number;
};

async function computeDistrictPerformanceRows(
  genderArg?: string,
): Promise<DistrictPerfRow[]> {
  const g = genderArg?.toLowerCase()?.trim();
  const genderFilter =
    g === "male" ? "Male" : g === "female" ? "Female" : undefined;
  const progressRows = await prisma.courseProgress.findMany({
    select: {
      isCompleted: true,
      student: {
        select: {
          id: true,
          user: { select: { district: true, gender: true } },
        },
      },
    },
  });
  const byDistrict = new Map<
    string,
    { enrollments: number; completed: number; studentIds: Set<string> }
  >();
  for (const row of progressRows) {
    const district = row.student?.user?.district?.trim() || "Unknown";
    const gender = row.student?.user?.gender?.trim();
    if (genderFilter && gender?.toLowerCase() !== genderFilter.toLowerCase())
      continue;
    const cur = byDistrict.get(district) ?? {
      enrollments: 0,
      completed: 0,
      studentIds: new Set<string>(),
    };
    cur.enrollments += 1;
    if (row.isCompleted) cur.completed += 1;
    if (row.student?.id) cur.studentIds.add(row.student.id);
    byDistrict.set(district, cur);
  }
  return [...byDistrict.entries()]
    .map(([district, d]) => ({
      district,
      studentCount: d.studentIds.size,
      enrollments: d.enrollments,
      completed: d.completed,
      completionRatePercent:
        d.enrollments > 0
          ? Math.round((1000 * d.completed) / d.enrollments) / 10
          : 0,
    }))
    .sort((a, b) => b.completionRatePercent - a.completionRatePercent);
}

/** Map period string to start date for analytics (shared by several tools). */
function periodToSince(period?: string): { since?: Date; label: string } {
  const p = period?.trim();
  const now = new Date();
  if (!p) return { label: "all time" };
  if (p === "last_week")
    return {
      since: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      label: "last_week",
    };
  if (p === "this_month")
    return {
      since: new Date(now.getFullYear(), now.getMonth(), 1),
      label: "this_month",
    };
  if (p === "last_year")
    return {
      since: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      label: "last_year",
    };
  if (p === "last_month")
    return {
      since: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      label: "last_month",
    };
  return { label: "all time" };
}

const CHW_TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "get_my_courses",
      description:
        "List courses available to the current user and their enrollment/progress.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_progress",
      description:
        "Get overall learning progress (all courses, chapters, slides).",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_progress_for_course",
      description: "Get progress for a specific course. Requires courseId.",
      parameters: {
        type: "object",
        properties: {
          courseId: { type: "string", description: "Course UUID" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_statistics",
      description:
        "Get summary stats: enrolled vs completed courses, last viewed, etc.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_certificates",
      description: "List certificates earned by the current user.",
      parameters: { type: "object" },
    },
  },
];

const STAFF_TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "list_students",
      description:
        "List students with optional search, pagination, status filter.",
      parameters: {
        type: "object",
        properties: {
          searchq: {
            type: "string",
            description: "Search by name, phone, district, sector",
          },
          limit: { type: "number", description: "Page size" },
          page: { type: "number", description: "Page number" },
          status: {
            type: "string",
            description: "ACTIVE, INACTIVE, SUSPENDED, GRADUATED",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student",
      description: "Get one student's details and progress by studentId.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string", description: "Student UUID" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_students_summary",
      description: "Platform-wide student counts and average progress.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_statistics",
      description:
        "Platform totals: total students (totalStudents.value), total courses (totalCourses.value), completion rate (completionRate.value), popular courses, recent activity. Use this for 'how many students', 'how many courses', completion rate. Report only the .value numbers from the response.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_analytics",
      description:
        "Performance analytics: total/active students, average study time (hours), completion rate, performance distribution (excellent 90-100%, good 80-89%, average 70-79%, poor 60-69%, failing below 60%), top performers, most active learners, recent activity. Use for: tests done, time spent, where students are not progressing vs progressing well, averages.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_students_by_gender",
      description:
        "Exact count of students by gender: female, male, total, and unspecified (no gender set). Use for: how many female students, how many male students, gender breakdown.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_course_completion_rates",
      description:
        "Per-course completion and failure rates. Returns two lists: byFailureRate (courses where people fail most, first) and byCompletionRate (courses where people succeed most, first). Each item has courseTitle, enrollments, completed, completionRatePercent, failureRatePercent. For 'which courses do people fail more' use the first items of byFailureRate. For 'which courses do people succeed more' use the first items of byCompletionRate. Report only these course titles and percentages; never invent.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_performance_by_gender",
      description:
        "Completion rates for female vs male students: female and male each have count, enrollments, completed, completionRatePercent. Use for: do female students perform better than male, gender performance comparison. Report only these numbers.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_progress_by_name",
      description:
        "Find a student by name and return their course progress. Pass the student's full or partial name (e.g. 'Mutembayire Grace'). Returns studentName, and courses array with courseTitle, progressPercent, isCompleted, sorted by progress (best first). Use for: which course is [name] performing better in, how is [name] doing. If no student found returns an error.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Student full or partial name to search for",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_other_female_students_in_student_district",
      description:
        "For a student named X: find their district, then count how many other female students are in that same district. Pass the student's name (e.g. 'Umurerwa Diane'). Returns district, studentName, totalFemaleInDistrict, otherFemaleCount (other = total minus the named student if she is female). Use for: in the district where [name] is, how many other female students are there.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Student full or partial name (e.g. Umurerwa Diane)",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_other_male_students_in_student_district",
      description:
        "For a student named X: find their district, then count how many other male students are in that same district. Pass the student's name (e.g. 'Hakizimana Gregoire'). Returns district, studentName, totalMaleInDistrict, otherMaleCount (other = total minus the named student if he is male). Use for: in the district where [name] is, how many other male students are there.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Student full or partial name (e.g. Hakizimana Gregoire)",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_time_on_course",
      description:
        "Estimated hours a specific student spent on a specific course. Pass student name and course title (e.g. 'Mutembayire Grace', 'UBUVUZI BW'IBANZE BUKOMATANYIJE'). Returns studentName, courseTitle, estimatedHours. Use for: how many hours did [name] spend on [course], time spent by [name] on [course]. Use the exact names from the user's question.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Student full or partial name" },
          courseTitle: {
            type: "string",
            description: "Course title (full or partial)",
          },
          period: {
            type: "string",
            description:
              "Optional: last_week, last_month, this_month, last_year",
          },
        },
        required: ["name", "courseTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_students_with_zero_certificate_in_student_district",
      description:
        "For a student named X: find their district, then count how many (other) students in that district have zero certificates. Pass the student's name (e.g. 'Umurerwa Diane'). Returns district, studentName, studentsWithZeroCertificate (total in district), otherStudentsWithZeroCertificate (excluding the named student). Use for: in the district where [name] is, how many other students have zero certificate.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Student full or partial name (e.g. Umurerwa Diane)",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_students_with_certificate_by_district",
      description:
        "Count of students who have at least one certificate, optionally in a specific district. Pass district (e.g. 'Gasabo') to filter; omit for all districts. Returns studentCount. Use for: how many students have at least one certificate in [district].",
      parameters: {
        type: "object",
        properties: {
          district: {
            type: "string",
            description:
              "District name to filter by (e.g. Gasabo); omit for platform total",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_platform_certificate_totals",
      description:
        "Platform-wide certificate statistics: total certificate records issued (rows in Certificate), and how many distinct students have at least one certificate. No parameters. Use for: how many certificates have been issued overall, how many certificates students have received, total certificates — not per-district (use get_students_with_certificate_by_district for that).",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_top_performers_by_district",
      description:
        "Top performing students in a specific district. Pass district name (e.g. 'Kayonza'). Returns list of students with name, district, avgScore, completedCourses, sorted by avgScore (best first). Use for: who are top performing students in [district], best students in [district].",
      parameters: {
        type: "object",
        properties: {
          district: {
            type: "string",
            description: "District name (e.g. Kayonza, Gasabo)",
          },
        },
        required: ["district"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_district_count",
      description:
        "Total number of distinct districts where students are located. No parameters. Returns districtCount. Use for: how many districts do we have, how many districts are our students in.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_students_per_district",
      description:
        "List of districts with student count in each. Returns array of { district, studentCount }. Use for: what are the districts, what are those (districts), how many students in each district, students per district. Report only the district names and numbers from this response.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_courses_by_study_time",
      description:
        "Courses ranked by total estimated study time (most time spent first). Returns list with courseTitle, estimatedTotalHours, enrollments. First item = course that most students spent the most time on. Use for: what is the first course that most students spent much time on, which course do students spend most time on.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_course_study_time_all_students",
      description:
        "Total and per-student estimated hours ALL students spent on a specific course, with optional time period filter. Pass courseTitle (full or partial) and optional period: 'last_week', 'last_month', 'this_month', 'last_year', or omit for all time. Returns courseTitle, period, totalEstimatedHours, studentCount, perStudent (list of studentName, estimatedHours). Use for: how many hours did students spend on [course], how much time was spent on [course] this month/last week, total study time for [course].",
      parameters: {
        type: "object",
        properties: {
          courseTitle: {
            type: "string",
            description:
              "Course title (full or partial, e.g. 'KURWANYA INDWARA')",
          },
          period: {
            type: "string",
            description:
              "Optional time period: 'last_week', 'last_month', 'this_month', 'last_year'. Omit for all time.",
          },
        },
        required: ["courseTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_performance_by_district",
      description:
        "Completion rate by district. Optional gender: 'male' or 'female' to filter. Returns districts with studentCount, enrollments, completed, completionRatePercent, sorted by completion rate (highest first). Use for: which district has high male/female performance, districts where students perform better.",
      parameters: {
        type: "object",
        properties: {
          gender: {
            type: "string",
            description:
              "Optional: 'male' or 'female' to show performance for that gender only",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_students_per_sector",
      description:
        "List of sectors with student count in each. Returns array of { sector, studentCount }. Also returns sectorCount (total distinct sectors). Use for: how many sectors do we have, students per sector, what are the sectors, sector breakdown.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "list_courses",
      description:
        "List all platform courses with enrollment count and completion rate. Returns array of { title, enrollments, completed, completionRatePercent, isPublished }. Use for: what courses are we having, list all courses, how many courses, which courses exist.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_students_not_started",
      description:
        "Count of students who have never started any course (no course progress at all). Returns notStartedCount and total. Use for: how many students haven't started, students with no activity.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_students_in_progress",
      description:
        "Count of students who are enrolled in at least one course but haven't completed any course yet. Returns inProgressCount. Use for: how many students are in progress, students currently learning.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_completions_over_time",
      description:
        "Count of course completions in a recent time window. Pass period: 'last_week' (7 days), 'last_month' (30 days), 'this_month' (current calendar month), or 'last_year' (365 days). Returns completedCount, period, and rows with studentName and courseTitle. Use for: how many students finished courses last week/month, recent completions, completions over time.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description:
              "Time period: 'last_week', 'last_month', 'this_month', or 'last_year'",
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_enrollment_trend",
      description:
        "Monthly NEW enrollments (CourseProgress createdAt) for the last N calendar months. Pass months: 3, 6, or 12 (default 3). Response shape is fixed: { months: [{ yearMonth, label, newEnrollments }], totalEnrollmentsInWindow: number, windowMonths: number }. Each month uses camelCase keys; totalEnrollmentsInWindow is ONE integer for the whole window (not per month). Use only these fields when summarizing. Use for: enrollment trend, last 3 months enrollment.",
      parameters: {
        type: "object",
        properties: {
          months: {
            type: "number",
            description:
              "Number of past months to include: 3 (default), 6, or 12",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_performance_trend",
      description:
        "Monthly learning-performance indicators for the last N calendar months (not enrollment). Returns months: [{ yearMonth, label, courseCompletions, testAttempts, averageTestMarks }], windowMonths. courseCompletions = courses marked completed that month; testAttempts + averageTestMarks from test activity that month. Use for: how has performance trended, performance over the last 3 months, are scores improving — not the same as enrollment trend.",
      parameters: {
        type: "object",
        properties: {
          months: { type: "number", description: "3 (default), 6, or 12" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_students_at_dropout_risk",
      description:
        "Students who may be at risk: enrolled in a course, not completed, low progress, and no progress update recently. Returns atRisk list with studentName, district, courseTitle, progressPercent, lastActivityAt, reason. Use for: which students are at risk of dropping out, stalled learners, who needs follow-up.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max students to return (default 30, max 100)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_district_performance_comparison",
      description:
        "Compare learning performance across districts: completion rate per district, sorted best to worst. Same data as get_performance_by_district but phrased for side-by-side comparison questions. Optional gender: 'male' or 'female'. Use for: how does performance compare between districts, district comparison, which districts perform best.",
      parameters: {
        type: "object",
        properties: {
          gender: {
            type: "string",
            description: "Optional: 'male' or 'female' to filter",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_average_days_to_complete_per_course",
      description:
        "For each course, average calendar days from first enrollment (CourseProgress created) to completion (when isCompleted became true), using updatedAt at completion. Only includes completed enrollments. Returns courses array with courseTitle, completedCount, averageDaysToComplete. Use for: average time to complete each course, how long does it take to finish courses.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_course_enrollment_count",
      description:
        "How many students are enrolled in a specific course (by title). Pass courseTitle (partial match). Returns courseTitle, enrollmentCount, completedCount. Use for: how many students enrolled in [course name].",
      parameters: {
        type: "object",
        properties: {
          courseTitle: {
            type: "string",
            description: "Course title (full or partial)",
          },
        },
        required: ["courseTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_course_reviews",
      description:
        "Learner-submitted course reviews for one course on this platform (rating, comment, optional category ratings). Pass courseTitle (partial match). Returns courseTitle, reviewCount, reviews with studentName, rating, comment, createdAt. Use for: what are the reviews for [course], ratings/feedback for a course — not external sites.",
      parameters: {
        type: "object",
        properties: {
          courseTitle: {
            type: "string",
            description: "Course title as the user wrote it (full or partial)",
          },
        },
        required: ["courseTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_progress_in_course",
      description:
        "How one student is performing in one specific course. Pass student name and course title (both can be partial). Returns studentName, courseTitle, progressPercent, isCompleted, enrolledAt, lastUpdatedAt. Use for: how is [name] doing in [course], [student] performance in [course].",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Student full or partial name" },
          courseTitle: {
            type: "string",
            description: "Course title (full or partial)",
          },
        },
        required: ["name", "courseTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_full_profile",
      description:
        "One-stop snapshot for a single student by name: demographics, course progress list, and test performance summary (marks, wrong answers). Use when the user asks for everything about one learner or a full profile.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Student full or partial name" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_most_failed_questions",
      description:
        "Questions students miss most often: counts wrong answers (isCorrect false) per question, with course and chapter context. Returns mostMissed with questionPreview, failCount, wrongRatePercent, courseTitle, chapterTitle. Use for: hardest questions, which questions fail most, common mistakes.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max questions (default 20, max 40)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_chapters_flagged_mid_test",
      description:
        "Chapters with mid-chapter tests: average attempt marks vs marksToPass; flags chapters where average score is below passing. Use for: weak chapters, mid test performance, where to intervene.",
      parameters: { type: "object" },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_test_performance_detail",
      description:
        "Deep dive on one student's tests: average marks, wrong-answer rate, recent attempts by type (pre/mid/final) with marks and wrong counts. Use for: low test performance, wrong answers, how is [name] doing on tests.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Student full or partial name" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_test_performance_by_demographics",
      description:
        "Aggregate test stats for a demographic slice: optional gender ('male'/'female'), district name, minAge, maxAge (from birthdate). Returns averageMarks, attempt counts, wrongAnswerRatePercent for that segment. Use for: test performance by gender, by district, by age group.",
      parameters: {
        type: "object",
        properties: {
          gender: { type: "string", description: "Optional: male or female" },
          district: { type: "string", description: "Optional district name" },
          minAge: {
            type: "number",
            description: "Optional minimum age in years",
          },
          maxAge: {
            type: "number",
            description: "Optional maximum age in years",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_platform_test_aggregates",
      description:
        "Platform-level math on tests: sum and average of attempt marks, total attempts, total answer records, wrong-answer count, wrong-answer rate, min/max marks. Optional courseTitle to limit to one course. Use for: average marks overall, total wrong answers, summations.",
      parameters: {
        type: "object",
        properties: {
          courseTitle: {
            type: "string",
            description:
              "Optional: limit to attempts tied to this course (partial title)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_data",
      description:
        "Run a read-only SQL query for data not from other tools. Use for: average age, tests per student. For how many districts use get_district_count. For district names and students per district use get_students_per_district. For certificate count by district use get_students_with_certificate_by_district. For female/male counts use get_students_by_gender. For course failure/success use get_course_completion_rates. For performance by district use get_performance_by_district. Staff only; you have access to call this.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "The user's full question in natural language (e.g. 'How many students per district?', 'How many tests did Mutembayire Grace do?'). Do not leave empty.",
          },
        },
        required: ["question"],
      },
    },
  },
];

export function getToolsForContext(ctx: ChatContext): ToolDef[] {
  const tools = [...CHW_TOOLS];
  if (ctx.isStaff) tools.push(...STAFF_TOOLS);
  return tools;
}

/** Shared JSON shape for get_students_at_dropout_risk and query_data short-circuit. */
export async function getStudentsAtDropoutRiskJson(
  limitArg: unknown,
): Promise<string> {
  const limit = Math.min(100, Math.max(1, Number(limitArg) || 30));
  const staleDays = 14;
  const maxProgress = 40;
  const staleCutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
  const atRiskRows = await prisma.courseProgress.findMany({
    where: {
      isCompleted: false,
      progress: { lt: maxProgress },
      updatedAt: { lt: staleCutoff },
    },
    include: {
      course: { select: { title: true } },
      student: {
        include: { user: { select: { fullNames: true, district: true } } },
      },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });
  const atRisk = atRiskRows.map((cp) => ({
    studentName: cp.student.user.fullNames,
    district: cp.student.user.district ?? "Unknown",
    courseTitle: cp.course.title,
    progressPercent: Math.round(cp.progress * 10) / 10,
    lastActivityAt: cp.updatedAt,
    reason: `Progress below ${maxProgress}% and no update for ${staleDays}+ days`,
  }));
  return JSON.stringify({
    atRiskCount: atRisk.length,
    criteria: `Not completed, progress < ${maxProgress}%, last activity more than ${staleDays} days ago`,
    atRisk,
  });
}

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ChatContext,
): Promise<string> {
  const studentId = ctx.studentId;
  try {
    switch (name) {
      case "get_my_courses": {
        if (!studentId) return JSON.stringify({ error: "Not a student" });
        const out = await CourseService.getMyAllCourses(
          studentId,
          args.searchq as string | undefined,
        );
        const data = (out as { data?: unknown }).data;
        return JSON.stringify(
          Array.isArray(data) ? data.slice(0, 20) : data,
          null,
          0,
        );
      }
      case "get_my_progress": {
        if (!studentId) return JSON.stringify({ error: "Not a student" });
        const out = await ProgressService.getProgressByStudent(studentId);
        return JSON.stringify(out, null, 0);
      }
      case "get_my_progress_for_course": {
        const cid = args.courseId as string;
        if (!studentId || !cid)
          return JSON.stringify({ error: "studentId and courseId required" });
        const out = await ProgressService.getProgressByStudentAndCourse(
          studentId,
          cid,
        );
        return JSON.stringify(out, null, 0);
      }
      case "get_my_statistics": {
        if (!studentId) return JSON.stringify({ error: "Not a student" });
        const out = await ProgressService.getStudentStatistics(studentId);
        const d = (out as { data?: unknown }).data;
        return JSON.stringify(d ?? out, null, 0);
      }
      case "get_my_certificates": {
        if (!studentId) return JSON.stringify({ error: "Not a student" });
        const out = await CertificateService.getMyCertificates(studentId);
        const data = (out as { data?: unknown }).data;
        return JSON.stringify(
          Array.isArray(data)
            ? data.map((c: { course?: { title?: string }; id?: string }) => ({
                id: c.id,
                course: c.course?.title,
              }))
            : data,
          null,
          0,
        );
      }
      case "list_students": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const out = await StudentService.getStudentsWithProgress(
          args.searchq as string | undefined,
          (args.limit as number) ?? 10,
          (args.page as number) ?? 1,
          args.status as string | undefined,
        );
        const paged = out as { data?: unknown[]; totalItems?: number };
        const list = Array.isArray(paged.data)
          ? paged.data.slice(0, 15)
          : paged.data;
        return JSON.stringify(
          { students: list, totalItems: paged.totalItems },
          null,
          0,
        );
      }
      case "get_student": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const sid = args.studentId as string;
        if (!sid) return JSON.stringify({ error: "studentId required" });
        const out = await StudentService.getStudentWithProgressById(sid);
        return JSON.stringify(out, null, 0);
      }
      case "get_students_summary": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const out = await StudentService.getStudentStatisticsSummary();
        return JSON.stringify((out as { data?: unknown }).data ?? out, null, 0);
      }
      case "get_dashboard_statistics": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const out = await CourseService.getDashboardStatistics();
        const d = (out as { data?: unknown }).data;
        return JSON.stringify(d ?? out, null, 0);
      }
      case "get_student_analytics": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const out = await CourseService.getStudentAnalytics();
        const d = (out as { data?: unknown }).data;
        return JSON.stringify(d ?? out, null, 0);
      }
      case "get_students_by_gender": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const [female, male, total] = await Promise.all([
          prisma.student.count({
            where: {
              user: { gender: { equals: "Female", mode: "insensitive" } },
            },
          }),
          prisma.student.count({
            where: {
              user: { gender: { equals: "Male", mode: "insensitive" } },
            },
          }),
          prisma.student.count(),
        ]);
        const unspecified = total - female - male;
        return JSON.stringify({
          female,
          male,
          total,
          unspecified: unspecified > 0 ? unspecified : 0,
        });
      }
      case "get_course_completion_rates": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const progressRows = await prisma.courseProgress.findMany({
          select: { courseId: true, isCompleted: true },
        });
        const byCourse = new Map<
          string,
          { total: number; completed: number }
        >();
        for (const row of progressRows) {
          const cur = byCourse.get(row.courseId) ?? { total: 0, completed: 0 };
          cur.total += 1;
          if (row.isCompleted) cur.completed += 1;
          byCourse.set(row.courseId, cur);
        }
        const courseIds = [...byCourse.keys()];
        const courses = courseIds.length
          ? await prisma.course.findMany({
              where: { id: { in: courseIds } },
              select: { id: true, title: true },
            })
          : [];
        const titleById = new Map(courses.map((c) => [c.id, c.title]));
        const rates = courseIds.map((id) => {
          const { total, completed } = byCourse.get(id)!;
          const completionRate =
            total > 0 ? Math.round((1000 * completed) / total) / 10 : 0;
          const failureRate =
            total > 0
              ? Math.round((1000 * (total - completed)) / total) / 10
              : 0;
          return {
            courseTitle: titleById.get(id) ?? id,
            enrollments: total,
            completed,
            completionRatePercent: completionRate,
            failureRatePercent: failureRate,
          };
        });
        const byFailureRate = [...rates].sort(
          (a, b) => b.failureRatePercent - a.failureRatePercent,
        );
        const byCompletionRate = [...rates].sort(
          (a, b) => b.completionRatePercent - a.completionRatePercent,
        );
        return JSON.stringify({ byFailureRate, byCompletionRate });
      }
      case "get_performance_by_gender": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const [
          femaleEnrollments,
          femaleCompleted,
          maleEnrollments,
          maleCompleted,
          femaleCount,
          maleCount,
        ] = await Promise.all([
          prisma.courseProgress.count({
            where: {
              student: {
                user: { gender: { equals: "Female", mode: "insensitive" } },
              },
            },
          }),
          prisma.courseProgress.count({
            where: {
              student: {
                user: { gender: { equals: "Female", mode: "insensitive" } },
              },
              isCompleted: true,
            },
          }),
          prisma.courseProgress.count({
            where: {
              student: {
                user: { gender: { equals: "Male", mode: "insensitive" } },
              },
            },
          }),
          prisma.courseProgress.count({
            where: {
              student: {
                user: { gender: { equals: "Male", mode: "insensitive" } },
              },
              isCompleted: true,
            },
          }),
          prisma.student.count({
            where: {
              user: { gender: { equals: "Female", mode: "insensitive" } },
            },
          }),
          prisma.student.count({
            where: {
              user: { gender: { equals: "Male", mode: "insensitive" } },
            },
          }),
        ]);
        const femaleRate =
          femaleEnrollments > 0
            ? Math.round((1000 * femaleCompleted) / femaleEnrollments) / 10
            : 0;
        const maleRate =
          maleEnrollments > 0
            ? Math.round((1000 * maleCompleted) / maleEnrollments) / 10
            : 0;
        return JSON.stringify({
          female: {
            count: femaleCount,
            enrollments: femaleEnrollments,
            completed: femaleCompleted,
            completionRatePercent: femaleRate,
          },
          male: {
            count: maleCount,
            enrollments: maleEnrollments,
            completed: maleCompleted,
            completionRatePercent: maleRate,
          },
        });
      }
      case "get_student_progress_by_name": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const name = (args.name as string)?.trim();
        if (!name)
          return JSON.stringify({
            error: "Please provide a student name (e.g. 'Mutembayire Grace')",
          });
        const students = await prisma.student.findMany({
          where: {
            user: { fullNames: { contains: name, mode: "insensitive" } },
          },
          take: 1,
          include: {
            user: { select: { fullNames: true } },
            courseProgresses: {
              include: { course: { select: { title: true } } },
            },
          },
        });
        if (!students.length)
          return JSON.stringify({
            error: `No student found with name matching "${name}"`,
          });
        const student = students[0];
        const courses = student.courseProgresses
          .map((cp) => ({
            courseTitle: cp.course.title,
            progressPercent: Math.round(cp.progress * 10) / 10,
            isCompleted: cp.isCompleted,
          }))
          .sort((a, b) => b.progressPercent - a.progressPercent);
        return JSON.stringify({
          studentName: student.user.fullNames,
          studentId: student.id,
          courses,
        });
      }
      case "get_other_female_students_in_student_district": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const name = (args.name as string)?.trim();
        if (!name)
          return JSON.stringify({
            error: "Please provide a student name (e.g. 'Umurerwa Diane')",
          });
        const students = await prisma.student.findMany({
          where: {
            user: { fullNames: { contains: name, mode: "insensitive" } },
          },
          take: 1,
          include: {
            user: { select: { fullNames: true, district: true, gender: true } },
          },
        });
        if (!students.length)
          return JSON.stringify({
            error: `No student found with name matching "${name}"`,
          });
        const student = students[0];
        const district = student.user.district?.trim() || "";
        if (!district)
          return JSON.stringify({
            error: "This student has no district recorded",
            studentName: student.user.fullNames,
          });
        const isFemale = student.user.gender?.trim().toLowerCase() === "female";
        const totalFemaleInDistrict = await prisma.student.count({
          where: {
            user: {
              district: { equals: district, mode: "insensitive" },
              gender: { equals: "Female", mode: "insensitive" },
            },
          },
        });
        const otherFemaleCount = isFemale
          ? Math.max(0, totalFemaleInDistrict - 1)
          : totalFemaleInDistrict;
        return JSON.stringify({
          district,
          studentName: student.user.fullNames,
          totalFemaleInDistrict,
          otherFemaleCount,
        });
      }
      case "get_other_male_students_in_student_district": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const name = (args.name as string)?.trim();
        if (!name)
          return JSON.stringify({
            error: "Please provide a student name (e.g. 'Hakizimana Gregoire')",
          });
        const students = await prisma.student.findMany({
          where: {
            user: { fullNames: { contains: name, mode: "insensitive" } },
          },
          take: 1,
          include: {
            user: { select: { fullNames: true, district: true, gender: true } },
          },
        });
        if (!students.length)
          return JSON.stringify({
            error: `No student found with name matching "${name}"`,
          });
        const student = students[0];
        const district = student.user.district?.trim() || "";
        if (!district)
          return JSON.stringify({
            error: "This student has no district recorded",
            studentName: student.user.fullNames,
          });
        const isMale = student.user.gender?.trim().toLowerCase() === "male";
        const totalMaleInDistrict = await prisma.student.count({
          where: {
            user: {
              district: { equals: district, mode: "insensitive" },
              gender: { equals: "Male", mode: "insensitive" },
            },
          },
        });
        const otherMaleCount = isMale
          ? Math.max(0, totalMaleInDistrict - 1)
          : totalMaleInDistrict;
        return JSON.stringify({
          district,
          studentName: student.user.fullNames,
          totalMaleInDistrict,
          otherMaleCount,
        });
      }
      case "get_student_time_on_course": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const name = (args.name as string)?.trim();
        const courseTitle = (args.courseTitle as string)?.trim();
        if (!name || !courseTitle)
          return JSON.stringify({
            error: "Please provide both student name and course title",
          });
        const { since, label: periodLabel } = periodToSince(
          (args.period as string | undefined)?.trim(),
        );
        const students = await prisma.student.findMany({
          where: {
            user: { fullNames: { contains: name, mode: "insensitive" } },
          },
          take: 1,
          include: { user: { select: { fullNames: true } } },
        });
        if (!students.length)
          return JSON.stringify({
            error: `No student found with name matching "${name}"`,
          });
        const student = students[0];
        const course = await findCourseByFlexibleTitle(courseTitle);
        if (!course)
          return JSON.stringify({
            error: `No course found matching "${courseTitle}"`,
          });
        const slideIds = await prisma.slide
          .findMany({
            where: { chapter: { section: { courseId: course.id } } },
            select: { id: true },
          })
          .then((s) => s.map((x) => x.id));
        const slideWhere: Prisma.SlideProgressWhereInput = {
          studentId: student.id,
          slideId: { in: slideIds },
        };
        if (since) {
          slideWhere.updatedAt = { gte: since };
        }
        const [slideProgressCount, courseProgressCount] = await Promise.all([
          slideIds.length > 0
            ? prisma.slideProgress.count({ where: slideWhere })
            : 0,
          prisma.courseProgress.count({
            where: { studentId: student.id, courseId: course.id },
          }),
        ]);
        const estimatedMinutes =
          slideProgressCount * 5 + courseProgressCount * 30;
        const estimatedHours = Math.round((estimatedMinutes / 60) * 10) / 10;
        return JSON.stringify({
          studentName: student.user.fullNames,
          courseTitle: course.title,
          period: since ? periodLabel : "all_time",
          estimatedHours,
          methodology: since
            ? "Estimated from slides touched in this period (5 minutes per slide activity update)."
            : "Estimated from all slides touched in the course (5 min each) plus a small allowance if enrolled.",
        });
      }
      case "get_students_with_zero_certificate_in_student_district": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const name = (args.name as string)?.trim();
        if (!name)
          return JSON.stringify({
            error: "Please provide a student name (e.g. 'Umurerwa Diane')",
          });
        const students = await prisma.student.findMany({
          where: {
            user: { fullNames: { contains: name, mode: "insensitive" } },
          },
          take: 1,
          include: { user: { select: { fullNames: true, district: true } } },
        });
        if (!students.length)
          return JSON.stringify({
            error: `No student found with name matching "${name}"`,
          });
        const student = students[0];
        const district = student.user.district?.trim() || "";
        if (!district)
          return JSON.stringify({
            error: "This student has no district recorded",
            studentName: student.user.fullNames,
          });
        const studentsWithZeroCertificate = await prisma.student.count({
          where: {
            user: { district: { equals: district, mode: "insensitive" } },
            certificates: { none: {} },
          },
        });
        const otherStudentsWithZeroCertificate = Math.max(
          0,
          studentsWithZeroCertificate - 1,
        );
        return JSON.stringify({
          district,
          studentName: student.user.fullNames,
          studentsWithZeroCertificate,
          otherStudentsWithZeroCertificate,
        });
      }
      case "get_students_with_certificate_by_district": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const district = (args.district as string)?.trim();
        const where: {
          certificates: { some: object };
          user?: { district: { equals: string; mode: "insensitive" } };
        } = {
          certificates: { some: {} },
        };
        if (district)
          where.user = { district: { equals: district, mode: "insensitive" } };
        const studentCount = await prisma.student.count({ where });
        return JSON.stringify({
          studentCount,
          ...(district ? { district } : {}),
        });
      }
      case "get_platform_certificate_totals": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const [
          totalCertificatesIssued,
          studentsWithAtLeastOneCertificate,
          totalStudents,
        ] = await Promise.all([
          prisma.certificate.count(),
          prisma.student.count({ where: { certificates: { some: {} } } }),
          prisma.student.count(),
        ]);
        return JSON.stringify({
          totalCertificatesIssued,
          studentsWithAtLeastOneCertificate,
          totalStudents,
        });
      }
      case "get_top_performers_by_district": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const district = (args.district as string)?.trim();
        if (!district)
          return JSON.stringify({
            error: "Please provide a district name (e.g. Kayonza)",
          });
        const students = await prisma.student.findMany({
          where: {
            user: { district: { equals: district, mode: "insensitive" } },
          },
          include: {
            user: { select: { fullNames: true, district: true } },
            courseProgresses: { where: { isCompleted: true } },
            attempts: { where: { marks: { gt: 0 } }, select: { marks: true } },
          },
        });
        const withScores = students.map((s) => {
          const completedCourses = s.courseProgresses.length;
          const rawAvg =
            s.attempts.length > 0
              ? s.attempts.reduce((sum, a) => sum + (Number(a.marks) || 0), 0) /
                s.attempts.length
              : 0;
          const avgScore = Number.isFinite(rawAvg)
            ? Math.round(rawAvg * 10) / 10
            : 0;
          return {
            name: s.user.fullNames,
            district: s.user.district ?? district,
            avgScore,
            completedCourses,
          };
        });
        withScores.sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));
        const top = withScores.slice(0, 15);
        return JSON.stringify(top);
      }
      case "get_district_count": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const users = await prisma.user.findMany({
          where: { student: { isNot: null } },
          select: { district: true },
        });
        const distinct = new Set(
          users.map((u) => u.district?.trim()).filter(Boolean),
        );
        return JSON.stringify({ districtCount: distinct.size });
      }
      case "get_students_per_district": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const students = await prisma.student.findMany({
          include: { user: { select: { district: true } } },
        });
        const byDistrict = new Map<string, number>();
        for (const s of students) {
          const d = s.user.district?.trim() || "Unknown";
          byDistrict.set(d, (byDistrict.get(d) ?? 0) + 1);
        }
        const list = [...byDistrict.entries()]
          .map(([district, studentCount]) => ({ district, studentCount }))
          .sort((a, b) => b.studentCount - a.studentCount);
        return JSON.stringify(list);
      }
      case "get_course_study_time_all_students": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const courseTitle = (args.courseTitle as string)?.trim();
        if (!courseTitle)
          return JSON.stringify({ error: "Please provide a course title" });
        const course = await findCourseByFlexibleTitle(courseTitle);
        if (!course)
          return JSON.stringify({
            error: `No course found matching "${courseTitle}"`,
          });

        const periodArg = (args.period as string)?.trim();
        const now = new Date();
        let since: Date | undefined;
        let periodLabel = "all time";
        if (periodArg === "last_week") {
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          periodLabel = "last week";
        } else if (periodArg === "last_month") {
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodLabel = "last month";
        } else if (periodArg === "this_month") {
          since = new Date(now.getFullYear(), now.getMonth(), 1);
          periodLabel = "this month";
        } else if (periodArg === "last_year") {
          since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          periodLabel = "last year";
        }

        const slideIds = await prisma.slide
          .findMany({
            where: { chapter: { section: { courseId: course.id } } },
            select: { id: true },
          })
          .then((s) => s.map((x) => x.id));

        const slideProgressFilter = since
          ? { slideId: { in: slideIds }, createdAt: { gte: since } }
          : { slideId: { in: slideIds } };
        const courseProgressFilter = since
          ? { courseId: course.id, createdAt: { gte: since } }
          : { courseId: course.id };

        // Get per-student breakdown
        const enrolledStudents = await prisma.courseProgress.findMany({
          where: courseProgressFilter,
          select: {
            studentId: true,
            student: { include: { user: { select: { fullNames: true } } } },
          },
        });

        const perStudent = await Promise.all(
          enrolledStudents.map(async (cp) => {
            const slideCount =
              slideIds.length > 0
                ? await prisma.slideProgress.count({
                    where: {
                      studentId: cp.studentId,
                      slideId: { in: slideIds },
                      ...(since ? { createdAt: { gte: since } } : {}),
                    },
                  })
                : 0;
            const estimatedMinutes = slideCount * 5 + 30;
            return {
              studentName: cp.student.user.fullNames,
              estimatedHours: Math.round((estimatedMinutes / 60) * 10) / 10,
            };
          }),
        );

        const totalEstimatedHours =
          Math.round(
            perStudent.reduce((sum, s) => sum + s.estimatedHours, 0) * 10,
          ) / 10;
        perStudent.sort((a, b) => b.estimatedHours - a.estimatedHours);

        return JSON.stringify({
          courseTitle: course.title,
          period: periodLabel,
          totalEstimatedHours,
          studentCount: perStudent.length,
          perStudent,
        });
      }
      case "get_courses_by_study_time": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const courses = await prisma.course.findMany({
          select: { id: true, title: true },
        });
        const result = await Promise.all(
          courses.map(async (c) => {
            const slideIds = await prisma.slide
              .findMany({
                where: { chapter: { section: { courseId: c.id } } },
                select: { id: true },
              })
              .then((s) => s.map((x) => x.id));
            const [slideProgressCount, enrollments] = await Promise.all([
              slideIds.length > 0
                ? prisma.slideProgress.count({
                    where: { slideId: { in: slideIds } },
                  })
                : 0,
              prisma.courseProgress.count({ where: { courseId: c.id } }),
            ]);
            const totalMinutes = slideProgressCount * 5 + enrollments * 30;
            const estimatedTotalHours =
              Math.round((totalMinutes / 60) * 10) / 10;
            return {
              courseTitle: c.title,
              estimatedTotalHours,
              enrollments,
            };
          }),
        );
        result.sort((a, b) => b.estimatedTotalHours - a.estimatedTotalHours);
        return JSON.stringify(result);
      }
      case "get_performance_by_district": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const rows = await computeDistrictPerformanceRows(
          args.gender as string | undefined,
        );
        return JSON.stringify(rows);
      }
      case "get_district_performance_comparison": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const rows = await computeDistrictPerformanceRows(
          args.gender as string | undefined,
        );
        return JSON.stringify({
          districts: rows,
          highestCompletionDistrict: rows[0]?.district,
          lowestCompletionDistrict: rows.length
            ? rows[rows.length - 1]?.district
            : undefined,
          note: "List is sorted by completionRatePercent (best first). Compare enrollments and completed between districts.",
        });
      }
      case "get_students_per_sector": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const students = await prisma.student.findMany({
          include: { user: { select: { sector: true } } },
        });
        const bySector = new Map<string, number>();
        for (const s of students) {
          const sec = s.user.sector?.trim() || "Unknown";
          bySector.set(sec, (bySector.get(sec) ?? 0) + 1);
        }
        const list = [...bySector.entries()]
          .map(([sector, studentCount]) => ({ sector, studentCount }))
          .sort((a, b) => b.studentCount - a.studentCount);
        return JSON.stringify({
          sectorCount: list.filter((x) => x.sector !== "Unknown").length,
          sectors: list,
        });
      }
      case "list_courses": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const courses = await prisma.course.findMany({
          select: { id: true, title: true, isPublished: true },
        });
        const [enrollmentGroups, completedGroups] = await Promise.all([
          prisma.courseProgress.groupBy({
            by: ["courseId"],
            _count: { _all: true },
          }),
          prisma.courseProgress.groupBy({
            by: ["courseId"],
            where: { isCompleted: true },
            _count: { _all: true },
          }),
        ]);
        const enrollMap = new Map(
          enrollmentGroups.map((g) => [g.courseId, g._count._all]),
        );
        const completedMap = new Map(
          completedGroups.map((g) => [g.courseId, g._count._all]),
        );
        const result = courses.map((c) => {
          const enrollments = enrollMap.get(c.id) ?? 0;
          const completed = completedMap.get(c.id) ?? 0;
          const completionRatePercent =
            enrollments > 0
              ? Math.round((1000 * completed) / enrollments) / 10
              : 0;
          return {
            title: c.title,
            enrollments,
            completed,
            completionRatePercent,
            isPublished: c.isPublished,
          };
        });
        result.sort((a, b) => b.enrollments - a.enrollments);
        return JSON.stringify({ totalCourses: result.length, courses: result });
      }
      case "get_students_not_started": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const [total, withProgress] = await Promise.all([
          prisma.student.count(),
          prisma.student.count({ where: { courseProgresses: { some: {} } } }),
        ]);
        const notStartedCount = total - withProgress;
        return JSON.stringify({ notStartedCount, total });
      }
      case "get_students_in_progress": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        // Students with at least one enrollment but zero completed courses
        const studentsWithAnyEnrollment = await prisma.student.findMany({
          where: { courseProgresses: { some: {} } },
          select: {
            id: true,
            courseProgresses: {
              where: { isCompleted: true },
              select: { id: true },
            },
          },
        });
        const inProgress = studentsWithAnyEnrollment.filter(
          (s) => s.courseProgresses.length === 0,
        );
        return JSON.stringify({ inProgressCount: inProgress.length });
      }
      case "get_completions_over_time": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const period = (args.period as string)?.trim() ?? "last_month";
        let since: Date;
        const now = new Date();
        if (period === "last_week") {
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === "this_month") {
          since = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === "last_year") {
          since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        } else {
          // default: last_month (30 days)
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const where = { isCompleted: true, updatedAt: { gte: since } } as const;
        const [completedCount, completions] = await Promise.all([
          prisma.courseProgress.count({ where }),
          prisma.courseProgress.findMany({
            where,
            include: {
              student: { include: { user: { select: { fullNames: true } } } },
              course: { select: { title: true } },
            },
            orderBy: { updatedAt: "desc" },
            take: 200,
          }),
        ]);
        const rows = completions.map((cp) => ({
          studentName: cp.student.user.fullNames,
          courseTitle: cp.course.title,
          completedAt: cp.updatedAt,
        }));
        return JSON.stringify({
          completedCount,
          period,
          since: since.toISOString(),
          rows,
        });
      }
      case "get_enrollment_trend": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        let months = Number(args.months);
        if (![3, 6, 12].includes(months)) months = 3;
        const now = new Date();
        const startMonth = new Date(
          now.getFullYear(),
          now.getMonth() - (months - 1),
          1,
        );
        const enrollments = await prisma.courseProgress.findMany({
          where: { createdAt: { gte: startMonth } },
          select: { createdAt: true },
        });
        const monthBuckets: {
          yearMonth: string;
          label: string;
          newEnrollments: number;
        }[] = [];
        for (let i = 0; i < months; i++) {
          const d = new Date(
            now.getFullYear(),
            now.getMonth() - (months - 1 - i),
            1,
          );
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleString("en-US", {
            month: "short",
            year: "numeric",
          });
          monthBuckets.push({ yearMonth: ym, label, newEnrollments: 0 });
        }
        const keyToIndex = new Map(
          monthBuckets.map((b, idx) => [b.yearMonth, idx]),
        );
        for (const e of enrollments) {
          const d = e.createdAt;
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const idx = keyToIndex.get(ym);
          if (idx !== undefined) monthBuckets[idx].newEnrollments += 1;
        }
        const totalEnrollmentsInWindow = enrollments.length;
        return JSON.stringify({
          months: monthBuckets,
          totalEnrollmentsInWindow,
          windowMonths: months,
        });
      }
      case "get_performance_trend": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        let months = Number(args.months);
        if (![3, 6, 12].includes(months)) months = 3;
        const now = new Date();
        const tasks: Promise<{
          yearMonth: string;
          label: string;
          courseCompletions: number;
          testAttempts: number;
          averageTestMarks: number;
        }>[] = [];
        for (let i = 0; i < months; i++) {
          const d = new Date(
            now.getFullYear(),
            now.getMonth() - (months - 1 - i),
            1,
          );
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleString("en-US", {
            month: "short",
            year: "numeric",
          });
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(
            d.getFullYear(),
            d.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          );
          tasks.push(
            (async () => {
              const [courseCompletions, testAgg] = await Promise.all([
                prisma.courseProgress.count({
                  where: {
                    isCompleted: true,
                    updatedAt: { gte: start, lte: end },
                  },
                }),
                prisma.attempTest.aggregate({
                  where: { updatedAt: { gte: start, lte: end } },
                  _avg: { marks: true },
                  _count: { _all: true },
                }),
              ]);
              const avg = testAgg._avg.marks;
              const averageTestMarks =
                avg != null && Number.isFinite(Number(avg))
                  ? Math.round(Number(avg) * 10) / 10
                  : 0;
              return {
                yearMonth: ym,
                label,
                courseCompletions,
                testAttempts: testAgg._count._all,
                averageTestMarks,
              };
            })(),
          );
        }
        const monthBuckets = await Promise.all(tasks);
        return JSON.stringify({ months: monthBuckets, windowMonths: months });
      }
      case "get_students_at_dropout_risk": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        return getStudentsAtDropoutRiskJson(args.limit);
      }
      case "get_average_days_to_complete_per_course": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const completed = await prisma.courseProgress.findMany({
          where: { isCompleted: true },
          select: {
            createdAt: true,
            updatedAt: true,
            courseId: true,
            course: { select: { title: true } },
          },
        });
        const byCourse = new Map<
          string,
          { title: string; daysSum: number; n: number }
        >();
        for (const cp of completed) {
          const days = Math.max(
            0,
            (cp.updatedAt.getTime() - cp.createdAt.getTime()) /
              (24 * 60 * 60 * 1000),
          );
          const cur = byCourse.get(cp.courseId) ?? {
            title: cp.course.title,
            daysSum: 0,
            n: 0,
          };
          cur.daysSum += days;
          cur.n += 1;
          byCourse.set(cp.courseId, cur);
        }
        const courses = [...byCourse.values()]
          .map((c) => ({
            courseTitle: c.title,
            completedCount: c.n,
            averageDaysToComplete:
              c.n > 0 ? Math.round((c.daysSum / c.n) * 10) / 10 : 0,
          }))
          .sort((a, b) => b.completedCount - a.completedCount);
        return JSON.stringify({ courses });
      }
      case "get_course_enrollment_count": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const courseTitle = (args.courseTitle as string)?.trim();
        if (!courseTitle)
          return JSON.stringify({ error: "Please provide a course title" });
        const course = await findCourseByFlexibleTitle(courseTitle);
        if (!course)
          return JSON.stringify({
            error: `No course found matching "${courseTitle}"`,
          });
        const [enrollmentCount, completedCount] = await Promise.all([
          prisma.courseProgress.count({ where: { courseId: course.id } }),
          prisma.courseProgress.count({
            where: { courseId: course.id, isCompleted: true },
          }),
        ]);
        return JSON.stringify({
          courseTitle: course.title,
          enrollmentCount,
          completedCount,
        });
      }
      case "get_course_reviews": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const courseTitle = (args.courseTitle as string)?.trim();
        if (!courseTitle)
          return JSON.stringify({ error: "Please provide a course title" });
        const course = await findCourseByFlexibleTitle(courseTitle);
        if (!course)
          return JSON.stringify({
            error: `No course found matching "${courseTitle}"`,
          });
        const where = { courseId: course.id };
        const [reviewCount, reviews] = await Promise.all([
          prisma.courseReview.count({ where }),
          prisma.courseReview.findMany({
            where,
            include: {
              student: { include: { user: { select: { fullNames: true } } } },
              categoryRatings: { select: { label: true, rating: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          }),
        ]);
        const rows = reviews.map((r) => ({
          studentName: r.student.user.fullNames,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          categoryRatings: r.categoryRatings.map((c) => ({
            label: c.label,
            rating: c.rating,
          })),
        }));
        return JSON.stringify({
          courseTitle: course.title,
          reviewCount,
          reviewsReturned: rows.length,
          reviews: rows,
        });
      }
      case "get_student_progress_in_course": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const name = (args.name as string)?.trim();
        const courseTitle = (args.courseTitle as string)?.trim();
        if (!name || !courseTitle) {
          return JSON.stringify({
            error: "Please provide both student name and course title",
          });
        }
        const students = await prisma.student.findMany({
          where: {
            user: { fullNames: { contains: name, mode: "insensitive" } },
          },
          take: 1,
          include: { user: { select: { fullNames: true } } },
        });
        if (!students.length)
          return JSON.stringify({
            error: `No student found matching "${name}"`,
          });
        const student = students[0];
        const course = await findCourseByFlexibleTitle(courseTitle);
        if (!course)
          return JSON.stringify({
            error: `No course found matching "${courseTitle}"`,
          });
        const cp = await prisma.courseProgress.findFirst({
          where: { studentId: student.id, courseId: course.id },
        });
        if (!cp) {
          return JSON.stringify({
            studentName: student.user.fullNames,
            courseTitle: course.title,
            enrolled: false,
            message: "Student is not enrolled in this course",
          });
        }
        return JSON.stringify({
          studentName: student.user.fullNames,
          courseTitle: course.title,
          progressPercent: Math.round(cp.progress * 10) / 10,
          isCompleted: cp.isCompleted,
          enrolledAt: cp.createdAt,
          lastUpdatedAt: cp.updatedAt,
        });
      }
      case "get_student_full_profile": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const name = (args.name as string)?.trim();
        if (!name)
          return JSON.stringify({ error: "Please provide a student name" });
        const students = await prisma.student.findMany({
          where: {
            user: { fullNames: { contains: name, mode: "insensitive" } },
          },
          take: 1,
          include: {
            user: {
              select: {
                fullNames: true,
                district: true,
                sector: true,
                gender: true,
                birthdate: true,
                phoneNumber: true,
              },
            },
            courseProgresses: {
              include: { course: { select: { title: true } } },
            },
          },
        });
        if (!students.length)
          return JSON.stringify({
            error: `No student found matching "${name}"`,
          });
        const s = students[0];
        const u = s.user;
        const age =
          u.birthdate != null
            ? Math.floor(
                (Date.now() - u.birthdate.getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000),
              )
            : null;
        const courses = s.courseProgresses
          .map((cp) => ({
            courseTitle: cp.course.title,
            progressPercent: Math.round(cp.progress * 10) / 10,
            isCompleted: cp.isCompleted,
          }))
          .sort((a, b) => b.progressPercent - a.progressPercent);
        const attempts = await prisma.attempTest.findMany({
          where: { studentId: s.id },
          include: { attemptAnswers: { select: { isCorrect: true } } },
          take: 80,
        });
        let totalWrong = 0;
        let totalAns = 0;
        for (const at of attempts) {
          for (const aa of at.attemptAnswers) {
            totalAns += 1;
            if (!aa.isCorrect) totalWrong += 1;
          }
        }
        const avgMarks =
          attempts.length > 0
            ? attempts.reduce((s, a) => s + a.marks, 0) / attempts.length
            : 0;
        return JSON.stringify({
          studentName: u.fullNames,
          district: u.district,
          sector: u.sector,
          gender: u.gender,
          approximateAge: age,
          phoneNumber: u.phoneNumber,
          courses,
          testSummary: {
            attemptCount: attempts.length,
            averageMarks: Math.round(avgMarks * 10) / 10,
            totalWrongAnswers: totalWrong,
            totalAnswerRecords: totalAns,
            wrongAnswerRatePercent:
              totalAns > 0
                ? Math.round((1000 * totalWrong) / totalAns) / 10
                : 0,
          },
        });
      }
      case "get_most_failed_questions": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        let lim = Number(args.limit);
        if (!Number.isFinite(lim) || lim < 1) lim = 20;
        lim = Math.min(40, lim);
        const failGroups = await prisma.attemptAnswer.groupBy({
          by: ["questionnaireId"],
          where: { isCorrect: false },
          _count: { _all: true },
        });
        const allGroups = await prisma.attemptAnswer.groupBy({
          by: ["questionnaireId"],
          _count: { _all: true },
        });
        const totalByQ = new Map(
          allGroups.map((g) => [g.questionnaireId, g._count._all]),
        );
        const merged = failGroups
          .map((f) => ({
            qid: f.questionnaireId,
            failCount: f._count._all,
            total: totalByQ.get(f.questionnaireId) ?? 0,
          }))
          .filter((x) => x.total > 0)
          .map((x) => ({
            ...x,
            wrongRatePercent: Math.round((1000 * x.failCount) / x.total) / 10,
          }))
          .sort((a, b) => b.failCount - a.failCount)
          .slice(0, lim);
        const qIds = merged.map((m) => m.qid);
        if (!qIds.length) return JSON.stringify({ mostMissed: [] });
        const questionnaires = await prisma.questionnaire.findMany({
          where: { id: { in: qIds } },
          select: {
            id: true,
            question: true,
            midTestId: true,
            courseId: true,
            midTest: {
              select: {
                chapter: {
                  select: {
                    title: true,
                    chapterNumber: true,
                    section: {
                      select: { course: { select: { title: true } } },
                    },
                  },
                },
              },
            },
            course: { select: { title: true } },
          },
        });
        const qMap = new Map(questionnaires.map((q) => [q.id, q]));
        const mostMissed = merged.map((m) => {
          const q = qMap.get(m.qid);
          const courseTitle =
            q?.midTest?.chapter?.section?.course?.title ??
            q?.course?.title ??
            "Unknown course";
          const chapterTitle = q?.midTest?.chapter?.title ?? null;
          const chapterNumber = q?.midTest?.chapter?.chapterNumber ?? null;
          return {
            questionPreview: (q?.question ?? "").slice(0, 280),
            failCount: m.failCount,
            totalAttemptsOnQuestion: m.total,
            wrongRatePercent: m.wrongRatePercent,
            courseTitle,
            chapterTitle,
            chapterNumber,
            context: q?.midTestId
              ? "mid_chapter_test"
              : q?.courseId
                ? "course_questionnaire"
                : "other",
          };
        });
        return JSON.stringify({ mostMissed });
      }
      case "get_chapters_flagged_mid_test": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const mids = await prisma.midTest.findMany({
          include: {
            chapter: {
              select: {
                title: true,
                chapterNumber: true,
                section: { select: { course: { select: { title: true } } } },
              },
            },
            attempts: { select: { marks: true, isCompleted: true } },
          },
        });
        const rows = mids.map((mt) => {
          const attempts = mt.attempts.filter(
            (a) => a.isCompleted || (a.marks ?? 0) > 0,
          );
          const n = attempts.length;
          const avgMarks =
            n > 0
              ? attempts.reduce((s, a) => s + (Number(a.marks) || 0), 0) / n
              : 0;
          const passLine = mt.marksToPass;
          const roundedAvg = Math.round(avgMarks * 10) / 10;
          const flagged = n > 0 && roundedAvg < passLine;
          return {
            courseTitle: mt.chapter.section.course.title,
            chapterTitle: mt.chapter.title,
            chapterNumber: mt.chapter.chapterNumber,
            averageMarks: roundedAvg,
            marksToPass: passLine,
            attemptCount: n,
            flagged,
            flagReason: flagged
              ? `Average mid-test score (${roundedAvg}) is below the pass mark (${passLine}).`
              : null,
          };
        });
        rows.sort((a, b) => a.averageMarks - b.averageMarks);
        const flaggedChapters = rows.filter((r) => r.flagged);
        return JSON.stringify({ chapters: rows, flaggedChapters });
      }
      case "get_student_test_performance_detail": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const name = (args.name as string)?.trim();
        if (!name)
          return JSON.stringify({ error: "Please provide student name" });
        const students = await prisma.student.findMany({
          where: {
            user: { fullNames: { contains: name, mode: "insensitive" } },
          },
          take: 1,
          include: {
            user: {
              select: {
                fullNames: true,
                district: true,
                gender: true,
                birthdate: true,
              },
            },
          },
        });
        if (!students.length)
          return JSON.stringify({
            error: `No student found matching "${name}"`,
          });
        const s = students[0];
        const attempts = await prisma.attempTest.findMany({
          where: { studentId: s.id },
          include: {
            attemptAnswers: { select: { isCorrect: true, marks: true } },
            preTest: {
              select: {
                description: true,
                course: { select: { title: true } },
              },
            },
            midTest: {
              select: {
                chapter: {
                  select: {
                    title: true,
                    section: {
                      select: { course: { select: { title: true } } },
                    },
                  },
                },
              },
            },
            finalTest: { select: { course: { select: { title: true } } } },
            finalExam: { select: { course: { select: { title: true } } } },
          },
          orderBy: { updatedAt: "desc" },
          take: 50,
        });
        let totalWrong = 0;
        let totalAns = 0;
        const recentAttempts = attempts.map((at) => {
          const wrong = at.attemptAnswers.filter((a) => !a.isCorrect).length;
          const tot = at.attemptAnswers.length;
          totalWrong += wrong;
          totalAns += tot;
          let testLabel = "unknown";
          let contextTitle = "";
          if (at.preTestId) {
            testLabel = "pre_test";
            contextTitle = at.preTest?.course?.title ?? "";
          } else if (at.midTestId) {
            testLabel = "mid_chapter_test";
            contextTitle =
              `${at.midTest?.chapter?.section?.course?.title ?? ""} · ${at.midTest?.chapter?.title ?? ""}`.trim();
          } else if (at.finalTestId) {
            testLabel = "final_test";
            contextTitle = at.finalTest?.course?.title ?? "";
          } else if (at.finalExamId) {
            testLabel = "final_exam";
            contextTitle = at.finalExam?.course?.title ?? "";
          }
          return {
            testLabel,
            contextTitle,
            marks: at.marks,
            wrongAnswers: wrong,
            questionsInAttempt: tot,
            isCompleted: at.isCompleted,
          };
        });
        const marksList = attempts.map((a) => a.marks);
        const avgMarks = marksList.length
          ? marksList.reduce((a, b) => a + b, 0) / marksList.length
          : 0;
        const age =
          s.user.birthdate != null
            ? Math.floor(
                (Date.now() - s.user.birthdate.getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000),
              )
            : null;
        return JSON.stringify({
          studentName: s.user.fullNames,
          district: s.user.district,
          gender: s.user.gender,
          approximateAge: age,
          attemptCount: attempts.length,
          averageMarksOnAttempts: Math.round(avgMarks * 10) / 10,
          totalWrongAnswers: totalWrong,
          totalAnswerRecords: totalAns,
          wrongAnswerRatePercent:
            totalAns > 0 ? Math.round((1000 * totalWrong) / totalAns) / 10 : 0,
          recentAttempts: recentAttempts.slice(0, 15),
        });
      }
      case "get_test_performance_by_demographics": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const genderRaw = (args.gender as string)?.trim();
        const district = (args.district as string)?.trim();
        const minAge =
          args.minAge != null && args.minAge !== ""
            ? Number(args.minAge)
            : undefined;
        const maxAge =
          args.maxAge != null && args.maxAge !== ""
            ? Number(args.maxAge)
            : undefined;
        const userWhere: Prisma.UserWhereInput = {};
        if (genderRaw) {
          const g =
            genderRaw.toLowerCase() === "male"
              ? "Male"
              : genderRaw.toLowerCase() === "female"
                ? "Female"
                : genderRaw;
          userWhere.gender = { equals: g, mode: "insensitive" };
        }
        if (district)
          userWhere.district = { equals: district, mode: "insensitive" };
        const studentRows = await prisma.student.findMany({
          where: Object.keys(userWhere).length ? { user: userWhere } : {},
          select: { id: true, user: { select: { birthdate: true } } },
        });
        let ids = studentRows.map((r) => r.id);
        if (minAge != null || maxAge != null) {
          const now = Date.now();
          ids = studentRows
            .filter((row) => {
              if (!row.user.birthdate) return false;
              const age = Math.floor(
                (now - row.user.birthdate.getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000),
              );
              if (minAge != null && age < minAge) return false;
              if (maxAge != null && age > maxAge) return false;
              return true;
            })
            .map((row) => row.id);
        }
        if (!ids.length) {
          return JSON.stringify({
            filters: {
              gender: genderRaw ?? null,
              district: district ?? null,
              minAge: minAge ?? null,
              maxAge: maxAge ?? null,
            },
            message: "No students match these filters.",
          });
        }
        const attempts = await prisma.attempTest.findMany({
          where: { studentId: { in: ids } },
          select: { marks: true },
        });
        const answers = await prisma.attemptAnswer.findMany({
          where: { attempt: { studentId: { in: ids } } },
          select: { isCorrect: true },
        });
        const wrong = answers.filter((a) => !a.isCorrect).length;
        const avgMarks = attempts.length
          ? attempts.reduce((s, a) => s + a.marks, 0) / attempts.length
          : 0;
        return JSON.stringify({
          filters: {
            gender: genderRaw ?? null,
            district: district ?? null,
            minAge: minAge ?? null,
            maxAge: maxAge ?? null,
          },
          studentsInSegment: ids.length,
          testAttempts: attempts.length,
          averageMarks: Math.round(avgMarks * 10) / 10,
          sumOfAttemptMarks:
            Math.round(attempts.reduce((s, a) => s + a.marks, 0) * 10) / 10,
          totalAnswerRecords: answers.length,
          wrongAnswerCount: wrong,
          wrongAnswerRatePercent: answers.length
            ? Math.round((1000 * wrong) / answers.length) / 10
            : 0,
        });
      }
      case "get_platform_test_aggregates": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const courseTitle = (args.courseTitle as string)?.trim();
        let attemptWhere: Prisma.AttempTestWhereInput = {};
        let scopeLabel = "all courses";
        if (courseTitle) {
          const course = await findCourseByFlexibleTitle(courseTitle);
          if (!course) {
            return JSON.stringify({
              error: `No course found matching "${courseTitle}"`,
            });
          }
          const cid = course.id;
          scopeLabel = `course "${course.title}"`;
          attemptWhere = {
            OR: [
              { preTest: { courseId: cid } },
              { midTest: { chapter: { section: { courseId: cid } } } },
              { finalTest: { courseId: cid } },
              { finalExam: { courseId: cid } },
            ],
          };
        }
        const attempts = await prisma.attempTest.findMany({
          where: attemptWhere,
          select: { id: true, marks: true },
        });
        const attemptIds = attempts.map((a) => a.id);
        const answers =
          attemptIds.length > 0
            ? await prisma.attemptAnswer.findMany({
                where: { attemptId: { in: attemptIds } },
                select: { isCorrect: true },
              })
            : [];
        const wrong = answers.filter((a) => !a.isCorrect).length;
        const markValues = attempts.map((a) => a.marks);
        const sumMarks = markValues.reduce((s, m) => s + m, 0);
        const avg = markValues.length ? sumMarks / markValues.length : 0;
        const min = markValues.length ? Math.min(...markValues) : 0;
        const max = markValues.length ? Math.max(...markValues) : 0;
        return JSON.stringify({
          scope: scopeLabel,
          totalAttempts: attempts.length,
          sumOfMarks: Math.round(sumMarks * 10) / 10,
          averageMarks: Math.round(avg * 10) / 10,
          minMarks: Math.round(min * 10) / 10,
          maxMarks: Math.round(max * 10) / 10,
          totalAnswerRecords: answers.length,
          wrongAnswerCount: wrong,
          wrongAnswerRatePercent: answers.length
            ? Math.round((1000 * wrong) / answers.length) / 10
            : 0,
        });
      }
      case "query_data": {
        if (!ctx.isStaff) return JSON.stringify({ error: "Forbidden" });
        const question = (args.question as string)?.trim();
        if (!question) {
          return JSON.stringify({
            error:
              "Please provide the user's question as the 'question' parameter (e.g. how many students per district?). Do not call query_data with an empty question.",
          });
        }
        try {
          if (isNotStartedAnyCourseQuestion(question)) {
            const [total, withProgress] = await Promise.all([
              prisma.student.count(),
              prisma.student.count({
                where: { courseProgresses: { some: {} } },
              }),
            ]);
            return JSON.stringify({
              notStartedCount: total - withProgress,
              total,
            });
          }
          if (isInProgressNoCompleteQuestion(question)) {
            const studentsWithAnyEnrollment = await prisma.student.findMany({
              where: { courseProgresses: { some: {} } },
              select: {
                id: true,
                courseProgresses: {
                  where: { isCompleted: true },
                  select: { id: true },
                },
              },
            });
            const inProgress = studentsWithAnyEnrollment.filter(
              (s) => s.courseProgresses.length === 0,
            );
            return JSON.stringify({ inProgressCount: inProgress.length });
          }
          if (isDropoutRiskStudentsQuestion(question)) {
            return getStudentsAtDropoutRiskJson(30);
          }
          {
            const profileName = extractStudentNameFromProfileRequest(question);
            if (profileName) {
              return runTool(
                "get_student_full_profile",
                { name: profileName },
                ctx,
              );
            }
          }
          {
            const pc = extractStudentProgressInCourseNameAndTitle(question);
            if (pc) {
              return runTool(
                "get_student_progress_in_course",
                { name: pc.name, courseTitle: pc.courseTitle },
                ctx,
              );
            }
          }
          {
            const bestName = extractStudentNameFromBestCourseQuestion(question);
            if (bestName) {
              return runTool(
                "get_student_progress_by_name",
                { name: bestName },
                ctx,
              );
            }
          }
          {
            const testName =
              extractStudentNameFromTestPerformanceQuestion(question);
            if (testName) {
              return runTool(
                "get_student_test_performance_detail",
                { name: testName },
                ctx,
              );
            }
          }
          if (isMostFailedQuestionsQuestion(question)) {
            return runTool("get_most_failed_questions", {}, ctx);
          }
          if (isFlaggedMidTestChaptersQuestion(question)) {
            return runTool("get_chapters_flagged_mid_test", {}, ctx);
          }
          if (isTestPerformanceDemographicsQuestion(question)) {
            const a = extractTestPerformanceDemographicsArgs(question);
            if (Object.keys(a).length > 0) {
              return runTool("get_test_performance_by_demographics", a, ctx);
            }
          }
          if (isCompletionsOverTimeQuestion(question)) {
            const periods = extractCompletionsPeriodsFromQuestion(question);
            if (periods.length > 0) {
              const completionsByPeriod: unknown[] = [];
              for (const period of periods) {
                const raw = await runTool(
                  "get_completions_over_time",
                  { period },
                  ctx,
                );
                completionsByPeriod.push(JSON.parse(raw) as unknown);
              }
              return JSON.stringify({ completionsByPeriod });
            }
          }
          if (isCourseReviewsQuestion(question)) {
            const ct = extractCourseTitleForReviewsQuestion(question);
            if (ct)
              return runTool("get_course_reviews", { courseTitle: ct }, ctx);
          }
          if (isPlatformCertificateTotalsQuestion(question)) {
            return runTool("get_platform_certificate_totals", {}, ctx);
          }
          if (isTopPerformingCoursesQuestion(question)) {
            return runTool("get_course_completion_rates", {}, ctx);
          }
          if (isPlatformTestAggregatesQuestion(question)) {
            const ct = extractCourseTitleForPlatformTestAggregates(question);
            return runTool(
              "get_platform_test_aggregates",
              ct ? { courseTitle: ct } : {},
              ctx,
            );
          }
          if (isDistrictPerformanceComparisonQuestion(question)) {
            const g = extractGenderForDistrictComparison(question);
            return runTool(
              "get_district_performance_comparison",
              g ? { gender: g } : {},
              ctx,
            );
          }
          const sql = await generateSqlFromQuestion(question);
          if (!sql)
            return JSON.stringify({ error: "Could not generate query" });
          const validation = validateReadOnlySql(sql);
          if (!validation.ok)
            return JSON.stringify({ error: validation.error });
          const result = await runReadOnlyQuery(sql);
          return result;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return JSON.stringify({ error: msg });
        }
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return JSON.stringify({ error: msg });
  }
}
