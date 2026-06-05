/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../utils/client";
import AppError from "../utils/error";
import {
  CreateAttempTestDto,
  TAttempTestResponse,
} from "../utils/interfaces/common";
import { Prisma } from "@prisma/client";
import { NotificationHelper } from "../utils/notificationHelper";

export class AttemptTestService {
  public static async createAttempt(data: CreateAttempTestDto, io?: any): Promise<{
    message: string;
    statusCode: number;
    data: TAttempTestResponse & {
      attemptAnswers: Array<any>;
      testInfo: any;
    };
  }> {
    // Ensure studentId is provided (should come from controller now)
    if (!data.studentId) {
      throw new AppError("Student ID is required", 400);
    }

    // validate student
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
    });
    if (!student) throw new AppError("Student not found", 404);

    // ensure only one test id is provided
    const testIds = [
      data.preTestId,
      data.midTestId,
      data.finalTestId,
      data.finalExamId,
    ].filter(Boolean);
    if (testIds.length === 0)
      throw new AppError(
        "One of preTestId, midTestId, finalTestId or finalExamId must be provided",
        400,
      );
    if (testIds.length > 1)
      throw new AppError(
        "Provide only one test id (preTestId OR midTestId OR finalTestId OR finalExamId)",
        400,
      );

    // validate referenced test
    if (data.preTestId) {
      const pre = await prisma.preTest.findUnique({
        where: { id: data.preTestId },
      });
      if (!pre) throw new AppError("PreTest not found", 404);
    }
    if (data.midTestId) {
      const mid = await prisma.midTest.findUnique({
        where: { id: data.midTestId },
      });
      if (!mid) throw new AppError("MidTest not found", 404);
    }
    if (data.finalTestId) {
      const fin = await prisma.finalTest.findUnique({
        where: { id: data.finalTestId },
      });
      if (!fin) throw new AppError("FinalTest not found", 404);
    }
    if (data.finalExamId) {
      const exam = await prisma.finalExam.findUnique({
        where: { id: data.finalExamId },
      });
      if (!exam) throw new AppError("FinalExam not found", 404);
    }

    // Auto-increment tryCount for this student and test
    let tryCount = 1;
    const latestAttempt = await prisma.attempTest.findFirst({
      where: {
        studentId: data.studentId,
        preTestId: data.preTestId ?? undefined,
        midTestId: data.midTestId ?? undefined,
        finalTestId: data.finalTestId ?? undefined,
        finalExamId: data.finalExamId ?? undefined,
      },
      orderBy: { tryCount: "desc" },
    });
    if (latestAttempt) {
      tryCount = (latestAttempt.tryCount || 1) + 1;
    }

    // Preload questionnaires outside the transaction so the interactive transaction
    // stays short (avoids default 5s timeout when many questions are submitted).
    const qAnswers = data.questionAnswers ?? [];
    const questionnaireById = new Map<
      string,
      Prisma.QuestionnaireGetPayload<{
        include: { answers: true; options: true };
      }>
    >();

    if (qAnswers.length > 0) {
      const uniqueIds = [...new Set(qAnswers.map((qa) => qa.questionnaireId))];
      const loaded = await prisma.questionnaire.findMany({
        where: { id: { in: uniqueIds } },
        include: { answers: true, options: true },
      });
      if (loaded.length !== uniqueIds.length) {
        throw new AppError("Questionnaire not found", 404);
      }
      for (const q of loaded) {
        questionnaireById.set(q.id, q);
      }
    }

    // Use transaction: create attempt, create attemptAnswers (evaluated) if provided, update marks
    const result = await prisma.$transaction(
      async (tx) => {
        const created = await tx.attempTest.create({
          data: {
            studentId: data.studentId!,
            preTestId: data.preTestId ?? null,
            midTestId: data.midTestId ?? null,
            finalTestId: data.finalTestId ?? null,
            finalExamId: data.finalExamId ?? null,
            tryCount,
          },
        });

        const attemptAnswers: any[] = [];
        let testInfo: any = null;
        if (qAnswers.length > 0) {
          let correctCount = 0;
          for (const qa of qAnswers) {
            const questionnaire = questionnaireById.get(qa.questionnaireId);
            if (!questionnaire) {
              throw new AppError("Questionnaire not found", 404);
            }

            // Get correct answer labels (filter out empty/whitespace and duplicates)
            const correctLabels = [
              ...new Set(
                (questionnaire.answers || [])
                  .map((ans) => ans.label)
                  .filter((label) => label && label.trim() !== ""),
              ),
            ];

            // Get selected option labels from selectedAnswerIds (filter out empty/whitespace and duplicates)
            const selectedOptionIds = qa.selectedAnswerIds || [];
            const selectedLabels = [
              ...new Set(
                (questionnaire.options || [])
                  .filter((opt) => selectedOptionIds.includes(opt.id))
                  .map((opt) => opt.label)
                  .filter((label) => label && label.trim() !== ""),
              ),
            ];

            // Sort both arrays for comparison
            const sortedCorrectLabels = [...correctLabels].sort();
            const sortedSelectedLabels = [...selectedLabels].sort();

            // Compare as sets (unordered) - check if arrays have same length and same elements
            const isCorrect =
              sortedCorrectLabels.length === sortedSelectedLabels.length &&
              sortedCorrectLabels.every(
                (label, index) => label === sortedSelectedLabels[index],
              );
            if (isCorrect) correctCount += 1;

            const answer = await tx.attemptAnswer.create({
              data: {
                attemptId: created.id,
                questionnaireId: qa.questionnaireId,
                selectedAnswerIds: selectedOptionIds,
                isCorrect,
                marks: isCorrect ? 1 : 0,
              },
            });

            attemptAnswers.push({
              ...answer,
              selectedOptionLabels: selectedLabels,
              correctAnswerLabels: correctLabels,
              questionnaire: {
                id: questionnaire.id,
                question: questionnaire.question,
              },
            });
          }

          const totalQuestions = qAnswers.length;
          const percentage =
            totalQuestions === 0 ? 0 : (correctCount / totalQuestions) * 100;
          const rounded = Math.round(percentage);
          // Get the marksToPass from the respective test
          let marksToPass = 0;
          if (created.preTestId) {
            const preTest = await tx.preTest.findUnique({
              where: { id: created.preTestId },
            });
            marksToPass = preTest?.marksToPass || 0;
            testInfo = preTest;
          } else if (created.midTestId) {
            const midTest = await tx.midTest.findUnique({
              where: { id: created.midTestId },
            });
            marksToPass = midTest?.marksToPass || 0;
            testInfo = midTest;
          } else if (created.finalTestId) {
            const finalTest = await tx.finalTest.findUnique({
              where: { id: created.finalTestId },
            });
            marksToPass = finalTest?.marksToPass || 0;
            testInfo = finalTest;
          } else if (created.finalExamId) {
            const finalExam = await tx.finalExam.findUnique({
              where: { id: created.finalExamId },
            });
            marksToPass = finalExam?.marksToPass || 0;
            testInfo = finalExam;
          }

          // Mark as completed: always true for preTest, else only if marks meet the threshold
          let isCompleted = false;
          if (created.preTestId) {
            isCompleted = true;
          } else {
            isCompleted = rounded >= marksToPass;
          }

          await tx.attempTest.update({
            where: { id: created.id },
            data: { marks: rounded, isCompleted },
          });

          const updatedAttempt = await tx.attempTest.findUnique({
            where: { id: created.id },
          });
          return { ...updatedAttempt, attemptAnswers, testInfo };
        }
        return { ...created, attemptAnswers, testInfo };
      },
      {
        maxWait: 15_000,
        timeout: 30_000,
      },
    );

    if (!result || !result.id) {
      throw new AppError("Attempt creation failed", 500);
    }

    // ── Fire test-result push notification to the student ──────────────────────
    if (io) {
      try {
        const studentUser = await prisma.student.findUnique({
          where: { id: data.studentId! },
          select: { userId: true },
        });

        // Resolve the courseId so the notification deep-links to the right course
        let courseId: string | null = null;
        if (data.preTestId) {
          const t = await prisma.preTest.findUnique({
            where: { id: data.preTestId },
            select: { courseId: true },
          });
          courseId = t?.courseId ?? null;
        } else if (data.midTestId) {
          const t = await prisma.midTest.findUnique({
            where: { id: data.midTestId },
            include: { chapter: { include: { section: { select: { courseId: true } } } } },
          });
          courseId = t?.chapter?.section?.courseId ?? null;
        } else if (data.finalTestId) {
          const t = await prisma.finalTest.findUnique({
            where: { id: data.finalTestId },
            select: { courseId: true },
          });
          courseId = t?.courseId ?? null;
        } else if (data.finalExamId) {
          const t = await prisma.finalExam.findUnique({
            where: { id: data.finalExamId },
            select: { courseId: true },
          });
          courseId = t?.courseId ?? null;
        }

        const score = (result as any).marks ?? 0;
        const passed = (result as any).isCompleted ?? false;
        const testLabel = data.preTestId
          ? "Ibizamini byo gutangira"
          : data.midTestId
          ? "Ibizamini by'igice"
          : data.finalTestId
          ? "Ibizamini bya nyuma"
          : "Ikizamini cya nyuma";

        if (studentUser) {
          await NotificationHelper.sendToUser(
            io,
            studentUser.userId,
            `${testLabel}: ${score}%`,
            passed
              ? `Wabashije! Warangije ${score}% kuri ${testLabel}. Komeza usome!`
              : `Warangije ${score}% kuri ${testLabel}. Gerageza ukundi!`,
            passed ? "success" : "warning",
            courseId ? `/courses/${courseId}` : undefined,
            "attempt",
            courseId ?? result.id, // pass courseId so pathFromEntity resolves correctly
            {
              score: String(score),
              passed: String(passed),
              testLabel,
              courseId: courseId ?? "",
            },
            0, // no cooldown — every attempt is a distinct event
          );
        }
      } catch (notifErr) {
        console.warn("[AttemptTestService] Notification failed:", notifErr);
      }
    }

    return {
      message: "Attempt created successfully",
      statusCode: 201,
      data: result as TAttempTestResponse & {
        attemptAnswers: any[];
        testInfo: any;
      },
    };
  }

  public static async getAttemptById(id: string): Promise<{
    message: string;
    statusCode: number;
    data: TAttempTestResponse & { attemptAnswers: Array<any> };
  }> {
    // Fetch attempt and answers
    const attempt = await prisma.attempTest.findUnique({
      where: { id },
      include: { attemptAnswers: true },
    });
    if (!attempt) throw new AppError("Attempt not found", 404);
    // For each answer, fetch the correct answer IDs
    const answersWithCorrect = await Promise.all(
      (attempt.attemptAnswers || []).map(async (ans) => {
        const questionnaire = await prisma.questionnaire.findUnique({
          where: { id: ans.questionnaireId },
          include: { answers: true },
        });
        return {
          ...ans,
          correctAnswerIds: (questionnaire?.answers || []).map((a) => a.id),
        };
      }),
    );

    return {
      message: "Attempt fetched",
      statusCode: 200,
      data: { ...attempt, attemptAnswers: answersWithCorrect },
    };
  }

  public static async updateAttempt(
    id: string,
    data: CreateAttempTestDto,
  ): Promise<{
    message: string;
    statusCode: number;
    data: TAttempTestResponse;
  }> {
    const existing = await prisma.attempTest.findUnique({ where: { id } });
    if (!existing) throw new AppError("Attempt not found", 404);

    // validate student if changed (but studentId should typically not be changed in updates)
    if (data.studentId && data.studentId !== existing.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
      });
      if (!student) throw new AppError("Student not found", 404);
    }

    // If questionAnswers are provided on update -> evaluate and compute marks
    if (data.questionAnswers && data.questionAnswers.length > 0) {
      // evaluate each submitted question
      let correctCount = 0;
      for (const qa of data.questionAnswers) {
        const questionnaire = await prisma.questionnaire.findUnique({
          where: { id: qa.questionnaireId },
          include: {
            answers: true,
            options: true,
          },
        });
        if (!questionnaire) throw new AppError("Questionnaire not found", 404);
        // ensure questionnaire belongs to the same test type as the attempt
        if (
          existing.midTestId &&
          questionnaire.midTestId !== existing.midTestId
        ) {
          throw new AppError(
            "Questionnaire does not belong to the attempt's midTest",
            400,
          );
        }

        // Compare by label (selectedAnswerIds are option IDs) - Remove duplicates and sort
        const correctLabels = [
          ...new Set(
            (questionnaire.answers || [])
              .map((a) => a.label)
              .filter((label) => label && label.trim() !== ""),
          ),
        ].sort();

        const selectedOptionIds = qa.selectedAnswerIds || [];
        const selectedLabels = [
          ...new Set(
            (questionnaire.options || [])
              .filter((opt) => selectedOptionIds.includes(opt.id))
              .map((opt) => opt.label)
              .filter((label) => label && label.trim() !== ""),
          ),
        ].sort();

        const isCorrect =
          correctLabels.length === selectedLabels.length &&
          correctLabels.every(
            (label, index) => label === selectedLabels[index],
          );
        if (isCorrect) correctCount += 1;

        // upsert AttemptAnswer
        const existingAnswer = await prisma.attemptAnswer.findFirst({
          where: { attemptId: id, questionnaireId: qa.questionnaireId },
        });
        if (existingAnswer) {
          await prisma.attemptAnswer.update({
            where: { id: existingAnswer.id },
            data: {
              selectedAnswerIds: selectedOptionIds,
              isCorrect,
              marks: isCorrect ? 1 : 0,
            },
          });
        } else {
          await prisma.attemptAnswer.create({
            data: {
              attemptId: id,
              questionnaireId: qa.questionnaireId,
              selectedAnswerIds: selectedOptionIds,
              isCorrect,
              marks: isCorrect ? 1 : 0,
            },
          });
        }
      }

      const totalQuestions = data.questionAnswers.length;
      const percentage =
        totalQuestions === 0 ? 0 : (correctCount / totalQuestions) * 100;
      const rounded = Math.round(percentage);
      // Get the marksToPass from the respective test
      let marksToPass = 0;
      if (existing.preTestId) {
        const preTest = await prisma.preTest.findUnique({
          where: { id: existing.preTestId },
        });
        marksToPass = preTest?.marksToPass || 0;
      } else if (existing.midTestId) {
        const midTest = await prisma.midTest.findUnique({
          where: { id: existing.midTestId },
        });
        marksToPass = midTest?.marksToPass || 0;
      } else if (existing.finalTestId) {
        const finalTest = await prisma.finalTest.findUnique({
          where: { id: existing.finalTestId },
        });
        marksToPass = finalTest?.marksToPass || 0;
      } else if (existing.finalExamId) {
        const finalExam = await prisma.finalExam.findUnique({
          where: { id: existing.finalExamId },
        });
        marksToPass = finalExam?.marksToPass || 0;
      }

      // Mark as completed: always true for preTest, else only if marks meet the threshold
      let isCompleted = false;
      if (existing.preTestId) {
        isCompleted = true;
      } else {
        isCompleted = rounded >= marksToPass;
      }

      const updatedAttempt = await prisma.attempTest.update({
        where: { id },
        data: { marks: rounded, isCompleted },
      });

      return {
        message: "Attempt evaluated",
        statusCode: 200,
        data: updatedAttempt,
      };
    }

    const updated = await prisma.attempTest.update({
      where: { id },
      data: {
        studentId: data.studentId ?? existing.studentId,
        preTestId: data.preTestId ?? existing.preTestId,
        midTestId: data.midTestId ?? existing.midTestId,
        finalTestId: data.finalTestId ?? existing.finalTestId,
        finalExamId: data.finalExamId ?? existing.finalExamId,
        tryCount: data.tryCount ?? existing.tryCount,
      },
    });

    return { message: "Attempt updated", statusCode: 200, data: updated };
  }

  public static async deleteAttempt(id: string) {
    const existing = await prisma.attempTest.findUnique({ where: { id } });
    if (!existing) throw new AppError("Attempt not found", 404);
    await prisma.attempTest.delete({ where: { id } });
    return { message: "Attempt deleted", statusCode: 200 };
  }

  public static async getAttempts(
    searchq?: string,
    limit?: number,
    currentPage?: number,
  ) {
    const where: Prisma.AttempTestWhereInput = {};
    if (searchq) {
      where.OR = [{ studentId: { contains: searchq, mode: "insensitive" } }];
    }

    const take = limit ?? 15;
    const skip = currentPage && currentPage > 0 ? (currentPage - 1) * take : 0;
    const attempts = await prisma.attempTest.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
    });
    const totalItems = await prisma.attempTest.count({ where });
    return {
      message: "Attempts fetched",
      statusCode: 200,
      data: attempts,
      totalItems,
      currentPage: currentPage || 1,
      itemsPerPage: take,
    };
  }

  public static async getAllAttempts(searchq?: string) {
    const where: Prisma.AttempTestWhereInput = {};
    if (searchq) {
      where.OR = [{ studentId: { contains: searchq, mode: "insensitive" } }];
    }
    const attempts = await prisma.attempTest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return { message: "Attempts fetched", statusCode: 200, data: attempts };
  }

  public static async getAttemptByTestId(testId: string) {
    // Try to find attempts by preTestId, midTestId, finalTestId or finalExamId
    const attempts = await prisma.attempTest.findMany({
      where: {
        OR: [
          { preTestId: testId },
          { midTestId: testId },
          { finalTestId: testId },
          { finalExamId: testId },
        ],
      },
      include: { attemptAnswers: true },
      orderBy: { createdAt: "desc" },
    });

    // For each attempt, add correctAnswerIds to each answer
    const attemptsWithCorrect = await Promise.all(
      attempts.map(async (attempt) => {
        const answersWithCorrect = await Promise.all(
          (attempt.attemptAnswers || []).map(async (ans) => {
            const questionnaire = await prisma.questionnaire.findUnique({
              where: { id: ans.questionnaireId },
              include: { answers: true },
            });
            return {
              ...ans,
              correctAnswerIds: (questionnaire?.answers || []).map((a) => a.id),
            };
          }),
        );
        return { ...attempt, attemptAnswers: answersWithCorrect };
      }),
    );

    return {
      message: "Attempts fetched by testId",
      statusCode: 200,
      data: attemptsWithCorrect,
    };
  }
}
