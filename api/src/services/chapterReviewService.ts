import { prisma } from "../utils/client";
import AppError from "../utils/error";
import {
  CreateChapterReviewDto,
  TChapterReviewResponse,
} from "../utils/interfaces/common";
import { Prisma } from "@prisma/client";
import {
  FilterOptions,
  validateFilterOptions,
  buildPrismaWhereClause,
  getFilterMetadata,
} from "../utils/filterUtils";
import { ExcelExporter } from "../utils/excelExporter";
import { Response } from "express";

export class ChapterReviewService {
  public static async createChapterReview(
    data: CreateChapterReviewDto,
    studentId: string,
  ) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new AppError("Student not found", 404);

    const chapter = await prisma.chapter.findUnique({
      where: { id: data.chapterId },
    });
    if (!chapter) throw new AppError("Chapter not found", 404);

    if (data.rating < 1 || data.rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    for (const cr of data.categoryRatings || []) {
      if (cr.rating < 1 || cr.rating > 5) {
        throw new AppError(
          "Category rating for " + cr.category + " must be between 1 and 5",
          400,
        );
      }
    }

    const existing = await prisma.chapterReview.findFirst({
      where: { studentId, chapterId: data.chapterId },
    });
    if (existing)
      throw new AppError("You have already reviewed this chapter", 409);

    const created = await prisma.chapterReview.create({
      data: {
        studentId,
        chapterId: data.chapterId,
        comment: data.comment,
        rating: data.rating,
        categoryRatings: {
          create: (data.categoryRatings || []).map((r) => ({
            categoryId: r.id,
            category: r.category,
            label: r.label,
            rating: r.rating,
          })),
        },
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullNames: true, photo: true } },
          },
        },
        chapter: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });

    return {
      message: "Chapter review created",
      statusCode: 201,
      data: created,
    } as {
      message: string;
      statusCode: number;
      data: TChapterReviewResponse;
    };
  }

  public static async getChapterReviewById(id: string) {
    const review = await prisma.chapterReview.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullNames: true, photo: true } },
          },
        },
        chapter: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });
    if (!review) throw new AppError("Chapter review not found", 404);
    return { message: "Chapter review fetched", statusCode: 200, data: review };
  }

  public static async updateChapterReview(
    id: string,
    data: CreateChapterReviewDto,
    studentId: string,
  ) {
    const existing = await prisma.chapterReview.findUnique({ where: { id } });
    if (!existing) throw new AppError("Chapter review not found", 404);
    if (existing.studentId !== studentId)
      throw new AppError("You can only update your own reviews", 403);
    if (data.rating < 1 || data.rating > 5)
      throw new AppError("Rating must be between 1 and 5", 400);

    for (const cr of data.categoryRatings || []) {
      if (cr.rating < 1 || cr.rating > 5) {
        throw new AppError(
          "Category rating for " + cr.category + " must be between 1 and 5",
          400,
        );
      }
    }

    // Remove existing category ratings for this review
    await prisma.chapterCategoryRating.deleteMany({
      where: { chapterReviewId: id },
    });

    const updated = await prisma.chapterReview.update({
      where: { id },
      data: {
        comment: data.comment,
        rating: data.rating,
        categoryRatings: {
          create: (data.categoryRatings || []).map((r) => ({
            categoryId: r.id,
            category: r.category,
            label: r.label,
            rating: r.rating,
          })),
        },
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullNames: true, photo: true } },
          },
        },
        chapter: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });

    return {
      message: "Chapter review updated",
      statusCode: 200,
      data: updated,
    } as {
      message: string;
      statusCode: number;
      data: TChapterReviewResponse;
    };
  }

  public static async deleteChapterReview(id: string, studentId: string) {
    const existing = await prisma.chapterReview.findUnique({ where: { id } });
    if (!existing) throw new AppError("Chapter review not found", 404);
    if (existing.studentId !== studentId)
      throw new AppError("You can only delete your own reviews", 403);
    await prisma.chapterReview.delete({ where: { id } });
    return { message: "Chapter review deleted", statusCode: 200 };
  }

  public static async getChapterReviews(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(
      filters || {},
      "student.user",
      "chapter-review",
    );

    const take = filters?.limit ?? 15;
    const skip =
      filters?.currentPage && filters.currentPage > 0
        ? (filters.currentPage - 1) * take
        : 0;

    const reviews = await prisma.chapterReview.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullNames: true,
                phoneNumber: true,
                district: true,
                sector: true,
                cell: true,
                photo: true,
              },
            },
          },
        },
        chapter: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });

    const totalItems = await prisma.chapterReview.count({ where });

    return {
      message: "Chapter reviews fetched",
      statusCode: 200,
      data: reviews,
      totalItems,
      currentPage: filters?.currentPage || 1,
      itemsPerPage: take,
      filters: filters || {},
    };
  }

  public static async getAllChapterReviews(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(
      filters || {},
      "student.user",
      "chapter-review",
    );

    const reviews = await prisma.chapterReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullNames: true,
                phoneNumber: true,
                district: true,
                sector: true,
                cell: true,
                photo: true,
              },
            },
          },
        },
        chapter: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });

    return {
      message: "Chapter reviews fetched",
      statusCode: 200,
      data: reviews,
      totalItems: reviews.length,
      filters: filters || {},
    };
  }

  public static async exportChapterReviewsToExcel(
    filters?: FilterOptions,
    res?: Response,
  ): Promise<Buffer> {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    // Get all reviews with filters
    const result = await this.getAllChapterReviews(filters);
    const reviews = result.data;

    // Create Excel template
    const metadata = getFilterMetadata(filters || {});
    const excelOptions = ExcelExporter.createReviewExcelTemplate(
      reviews,
      "chapter",
      metadata,
    );

    // Export to Excel
    return await ExcelExporter.exportToExcel(excelOptions, res);
  }

  public static async getMyChapterReviews(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new AppError("Student not found", 404);

    const reviews = await prisma.chapterReview.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullNames: true, photo: true } },
          },
        },
        chapter: { select: { id: true, title: true } },
      },
    });

    return {
      message: "Your chapter reviews fetched",
      statusCode: 200,
      data: reviews,
    };
  }

  public static async getChapterReviewsByChapterId(chapterId: string) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) throw new AppError("Chapter not found", 404);

    const reviews = await prisma.chapterReview.findMany({
      where: { chapterId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullNames: true, photo: true } },
          },
        },
        chapter: { select: { id: true, title: true } },
      },
    });

    return {
      message: "Chapter reviews fetched",
      statusCode: 200,
      data: reviews,
    };
  }

  public static async getChapterReviewStats(chapterId?: string) {
    let where: Prisma.ChapterReviewWhereInput = {};
    if (chapterId) where = { chapterId };

    const totalReviews = await prisma.chapterReview.count({ where });
    const averageRating = await prisma.chapterReview.aggregate({
      _avg: { rating: true },
      where,
    });
    const ratingDistribution = await prisma.chapterReview.groupBy({
      by: ["rating"],
      _count: { rating: true },
      where,
      orderBy: { rating: "asc" },
    });

    return {
      message: "Chapter review statistics fetched",
      statusCode: 200,
      data: {
        totalReviews,
        averageRating: Math.round((averageRating._avg.rating || 0) * 10) / 10,
        ratingDistribution: ratingDistribution.map((item) => ({
          rating: item.rating,
          count: item._count.rating,
        })),
      },
    };
  }
}
