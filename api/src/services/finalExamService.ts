import { prisma } from "../utils/client";
import AppError from "../utils/error";
import {
  CreateFinalExamDto,
  TFinalExamResponse,
} from "../utils/interfaces/common";
import { Prisma } from "@prisma/client";

export class FinalExamService {
  public static async createFinalExam(data: CreateFinalExamDto) {
    // ensure course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course) throw new AppError("Course not found", 404);

    const finalExam = await prisma.finalExam.create({
      data: {
        courseId: data.courseId,
        questionToBeAnswered: data.questionToBeAnswered,
        marksToPass: data.marksToPass,
        description: data.description,
        isPublished: data.isPublished ?? undefined,
      },
    });

    return {
      message: "FinalExam created successfully",
      statusCode: 201,
      data: finalExam,
    } as { message: string; statusCode: number; data: TFinalExamResponse };
  }

  public static async getFinalExamById(id: string) {
    const finalExam = await prisma.finalExam.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            questionnaires: {
              include: {
                options: true,
                answers: true,
              },
            },
          },
        },
      },
    });
    if (!finalExam) throw new AppError("FinalExam not found", 404);

    // Randomize questionnaires and options
    const questionCount = finalExam.questionToBeAnswered || 0;
    let questionnaires = finalExam.course?.questionnaires || [];
    questionnaires = questionnaires
      .map((q) => ({ q, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ q }) => q)
      .slice(0, questionCount)
      .map((q) => ({
        ...q,
        options: (q.options || [])
          .map((o) => ({ o, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ o }) => o),
      }));

    const response = {
      ...finalExam,
      course: {
        ...finalExam.course,
        questionnaires,
      },
    };

    return {
      message: "FinalExam fetched successfully",
      statusCode: 200,
      data: response,
    } as { message: string; statusCode: number; data: TFinalExamResponse };
  }

  public static async updateFinalExam(id: string, data: CreateFinalExamDto) {
    const existing = await prisma.finalExam.findUnique({ where: { id } });
    if (!existing) throw new AppError("FinalExam not found", 404);

    // If courseId changed, ensure course exists
    if (data.courseId && data.courseId !== existing.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: data.courseId },
      });
      if (!course) throw new AppError("Course not found", 404);
    }

    const updated = await prisma.finalExam.update({
      where: { id },
      data: {
        courseId: data.courseId,
        questionToBeAnswered:
          data.questionToBeAnswered ?? existing.questionToBeAnswered,
        marksToPass: data.marksToPass ?? existing.marksToPass,
        description: data.description ?? existing.description,
        isPublished: data.isPublished ?? existing.isPublished,
      },
    });

    return {
      message: "FinalExam updated successfully",
      statusCode: 200,
      data: updated,
    } as { message: string; statusCode: number; data: TFinalExamResponse };
  }

  public static async deleteFinalExam(id: string) {
    const existing = await prisma.finalExam.findUnique({ where: { id } });
    if (!existing) throw new AppError("FinalExam not found", 404);

    await prisma.finalExam.delete({ where: { id } });

    return { message: "FinalExam deleted successfully", statusCode: 200 };
  }

  public static async getFinalExams(
    searchq?: string,
    limit?: number,
    currentPage?: number,
  ) {
    const where: Prisma.FinalExamWhereInput = {};
    if (searchq) {
      where.OR = [{ id: { contains: searchq, mode: "insensitive" } }];
    }

    const take = limit ?? 15;
    const skip = currentPage && currentPage > 0 ? (currentPage - 1) * take : 0;

    const finalExams = await prisma.finalExam.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
    });

    const totalItems = await prisma.finalExam.count({ where });

    return {
      message: "FinalExams fetched successfully",
      statusCode: 200,
      data: finalExams,
      totalItems,
      currentPage: currentPage || 1,
      itemsPerPage: take,
    };
  }

  public static async getAllFinalExams(searchq?: string) {
    const where: Prisma.FinalExamWhereInput = {};
    if (searchq) {
      where.OR = [{ id: { contains: searchq, mode: "insensitive" } }];
    }

    const finalExams = await prisma.finalExam.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return {
      message: "FinalExams fetched successfully",
      statusCode: 200,
      data: finalExams,
    };
  }
}
