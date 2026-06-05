import { prisma } from "../utils/client";
import AppError from "../utils/error";
import {
  CreateSectionReviewDto,
  TSectionReviewResponse,
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

export class SectionReviewService {
  public static async createSectionReview(
    data: CreateSectionReviewDto,
    studentId: string,
  ) {
    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new AppError("Student not found", 404);

    // Validate section exists
    const section = await prisma.section.findUnique({
      where: { id: data.sectionId },
    });
    if (!section) throw new AppError("Section not found", 404);

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    // validate categoryRatings if provided
    for (const cr of data.categoryRatings || []) {
      if (cr.rating < 1 || cr.rating > 5) {
        throw new AppError(
          "Category rating for " + cr.category + " must be between 1 and 5",
          400,
        );
      }
    }

    // Ensure student hasn't reviewed this section before
    const existingReview = await prisma.sectionReview.findFirst({
      where: { studentId, sectionId: data.sectionId },
    });
    if (existingReview)
      throw new AppError("You have already reviewed this section", 409);

    const created = await prisma.sectionReview.create({
      data: {
        studentId,
        sectionId: data.sectionId,
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
        section: {
          select: { id: true, title: true },
        },
        categoryRatings: true,
      },
    });

    return {
      message: "Section review created successfully",
      statusCode: 201,
      data: created,
    } as { message: string; statusCode: number; data: TSectionReviewResponse };
  }

  public static async getSectionReviewById(id: string) {
    const review = await prisma.sectionReview.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullNames: true, photo: true } },
          },
        },
        section: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });
    if (!review) throw new AppError("Section review not found", 404);
    return {
      message: "Section review fetched successfully",
      statusCode: 200,
      data: review,
    };
  }

  public static async updateSectionReview(
    id: string,
    data: CreateSectionReviewDto,
    studentId: string,
  ) {
    const existing = await prisma.sectionReview.findUnique({ where: { id } });
    if (!existing) throw new AppError("Section review not found", 404);

    if (existing.studentId !== studentId) {
      throw new AppError("You can only update your own reviews", 403);
    }

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

    // Remove existing category ratings for this review
    await prisma.sectionCategoryRating.deleteMany({
      where: { sectionReviewId: id },
    });

    const updated = await prisma.sectionReview.update({
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
        section: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });

    return {
      message: "Section review updated successfully",
      statusCode: 200,
      data: updated,
    } as {
      message: string;
      statusCode: number;
      data: TSectionReviewResponse;
    };
  }

  public static async deleteSectionReview(id: string, studentId: string) {
    const existing = await prisma.sectionReview.findUnique({ where: { id } });
    if (!existing) throw new AppError("Section review not found", 404);

    if (existing.studentId !== studentId) {
      throw new AppError("You can only delete your own reviews", 403);
    }

    await prisma.sectionReview.delete({ where: { id } });

    return { message: "Section review deleted successfully", statusCode: 200 };
  }

  public static async getSectionReviews(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(
      filters || {},
      "student.user",
      "section-review",
    );

    const take = filters?.limit ?? 15;
    const skip =
      filters?.currentPage && filters.currentPage > 0
        ? (filters.currentPage - 1) * take
        : 0;

    const reviews = await prisma.sectionReview.findMany({
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
        section: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });

    const totalItems = await prisma.sectionReview.count({ where });

    return {
      message: "Section reviews fetched successfully",
      statusCode: 200,
      data: reviews,
      totalItems,
      currentPage: filters?.currentPage || 1,
      itemsPerPage: take,
      filters: filters || {},
    };
  }

  public static async getAllSectionReviews(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(
      filters || {},
      "student.user",
      "section-review",
    );

    const reviews = await prisma.sectionReview.findMany({
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
        section: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });

    return {
      message: "Section reviews fetched successfully",
      statusCode: 200,
      data: reviews,
      totalItems: reviews.length,
      filters: filters || {},
    };
  }

  public static async exportSectionReviewsToExcel(
    filters?: FilterOptions,
    res?: Response,
  ): Promise<Buffer> {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    // Get all reviews with filters
    const result = await this.getAllSectionReviews(filters);
    const reviews = result.data;

    // Create Excel template
    const metadata = getFilterMetadata(filters || {});
    const excelOptions = ExcelExporter.createReviewExcelTemplate(
      reviews,
      "section",
      metadata,
    );

    // Export to Excel
    return await ExcelExporter.exportToExcel(excelOptions, res);
  }

  public static async getMySectionReviews(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new AppError("Student not found", 404);

    const reviews = await prisma.sectionReview.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullNames: true, photo: true } },
          },
        },
        section: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });

    return {
      message: "Your section reviews fetched successfully",
      statusCode: 200,
      data: reviews,
    };
  }

  public static async getSectionReviewsBySectionId(sectionId: string) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new AppError("Section not found", 404);

    const reviews = await prisma.sectionReview.findMany({
      where: { sectionId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullNames: true, photo: true } },
          },
        },
        section: { select: { id: true, title: true } },
        categoryRatings: true,
      },
    });

    return {
      message: "Section reviews fetched successfully",
      statusCode: 200,
      data: reviews,
    };
  }

  public static async getSectionReviewStats(sectionId?: string) {
    let where: Prisma.SectionReviewWhereInput = {};
    if (sectionId) where = { sectionId };

    const totalReviews = await prisma.sectionReview.count({ where });
    const averageRating = await prisma.sectionReview.aggregate({
      _avg: { rating: true },
      where,
    });
    const ratingDistribution = await prisma.sectionReview.groupBy({
      by: ["rating"],
      _count: { rating: true },
      where,
      orderBy: { rating: "asc" },
    });

    return {
      message: "Section review statistics fetched successfully",
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
