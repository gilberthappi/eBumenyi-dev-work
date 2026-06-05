import { prisma } from "../utils/client";
import AppError from "../utils/error";
import {
  CreateQuestionnaireDto,
  TQuestionnaireResponse,
} from "../utils/interfaces/common";
import { Prisma } from "@prisma/client";

export class QuestionnaireService {
  public static async createQuestionnaire(data: CreateQuestionnaireDto) {
    const questionnaire = await prisma.questionnaire.create({
      data: {
        question: data.question,
        questionImage: data.questionImage ?? null,
        feedbackStatement: data.feedbackStatement ?? null,
        allowMultiple: data.allowMultiple ?? false,
        courseId: data.courseId ?? null,
        midTestId: data.midTestId ?? null,
      },
    });

    return {
      message: "Questionnaire created successfully",
      statusCode: 201,
      data: questionnaire,
    } as { message: string; statusCode: number; data: TQuestionnaireResponse };
  }

  public static async getQuestionnaireById(id: string) {
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id },
    });
    if (!questionnaire) throw new AppError("Questionnaire not found", 404);

    return {
      message: "Questionnaire fetched successfully",
      statusCode: 200,
      data: questionnaire,
    } as { message: string; statusCode: number; data: TQuestionnaireResponse };
  }

  public static async updateQuestionnaire(
    id: string,
    data: CreateQuestionnaireDto,
  ) {
    const existing = await prisma.questionnaire.findUnique({ where: { id } });
    if (!existing) throw new AppError("Questionnaire not found", 404);

    const updated = await prisma.questionnaire.update({
      where: { id },
      data: {
        question: data.question,
        questionImage: data.questionImage ?? null,
        feedbackStatement: data.feedbackStatement ?? null,
        allowMultiple: data.allowMultiple ?? existing.allowMultiple,
        courseId: data.courseId ?? existing.courseId,
        midTestId: data.midTestId ?? existing.midTestId,
      },
    });

    return {
      message: "Questionnaire updated successfully",
      statusCode: 200,
      data: updated,
    } as { message: string; statusCode: number; data: TQuestionnaireResponse };
  }

  public static async deleteQuestionnaire(id: string) {
    const existing = await prisma.questionnaire.findUnique({ where: { id } });
    if (!existing) throw new AppError("Questionnaire not found", 404);

    // Delete related records first to avoid foreign key constraint violations
    await prisma.attemptAnswer.deleteMany({ where: { questionnaireId: id } });
    await prisma.option.deleteMany({ where: { questionnaireId: id } });
    await prisma.answer.deleteMany({ where: { questionnaireId: id } });

    await prisma.questionnaire.delete({ where: { id } });

    return { message: "Questionnaire deleted successfully", statusCode: 200 };
  }

  public static async getQuestionnaires(
    searchq?: string,
    limit?: number,
    currentPage?: number,
  ) {
    const where: Prisma.QuestionnaireWhereInput = {};
    if (searchq) {
      where.OR = [{ question: { contains: searchq, mode: "insensitive" } }];
    }

    const take = limit ?? 15;
    const skip = currentPage && currentPage > 0 ? (currentPage - 1) * take : 0;

    const questionnaires = await prisma.questionnaire.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
    });

    const totalItems = await prisma.questionnaire.count({ where });

    return {
      message: "Questionnaires fetched successfully",
      statusCode: 200,
      data: questionnaires,
      totalItems,
      currentPage: currentPage || 1,
      itemsPerPage: take,
    };
  }

  public static async getAllQuestionnaires(searchq?: string) {
    const where: Prisma.QuestionnaireWhereInput = {};
    if (searchq) {
      where.OR = [{ question: { contains: searchq, mode: "insensitive" } }];
    }

    const questionnaires = await prisma.questionnaire.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return {
      message: "Questionnaires fetched successfully",
      statusCode: 200,
      data: questionnaires,
    };
  }
}
