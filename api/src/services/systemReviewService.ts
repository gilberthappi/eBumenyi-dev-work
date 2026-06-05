import { prisma } from "../utils/client";
import AppError from "../utils/error";
import {
  CreateSystemReviewDto,
  TSystemReviewResponse,
} from "../utils/interfaces/common";
import {
  FilterOptions,
  validateFilterOptions,
  buildPrismaWhereClause,
  getFilterMetadata,
} from "../utils/filterUtils";
import { ExcelExporter } from "../utils/excelExporter";
import { Response } from "express";

export class SystemReviewService {
  public static async createSystemReview(
    data: CreateSystemReviewDto,
    userId: string,
  ) {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new AppError("User not found", 404);

    // Validate overall rating is between 1 and 5
    if (data.overallRating < 1 || data.overallRating > 5) {
      throw new AppError("Overall rating must be between 1 and 5", 400);
    }

    // Validate category ratings are between 1 and 5
    for (const categoryRating of data.categoryRatings) {
      if (categoryRating.rating < 1 || categoryRating.rating > 5) {
        throw new AppError(
          `Category rating for ${categoryRating.category} must be between 1 and 5`,
          400,
        );
      }
    }

    const created = await prisma.systemReview.create({
      data: {
        userId,
        feedback: data.feedback,
        overallRating: data.overallRating,
        recommendation: data.recommendation,
        categoryRatings: {
          create: data.categoryRatings.map((rating) => ({
            categoryId: rating.id,
            category: rating.category,
            label: rating.label,
            rating: rating.rating,
          })),
        },
      },
      include: {
        categoryRatings: true,
        user: {
          select: {
            id: true,
            fullNames: true,
            photo: true,
          },
        },
      },
    });

    return {
      message: "System review created successfully",
      statusCode: 201,
      data: created,
    } as {
      message: string;
      statusCode: number;
      data: TSystemReviewResponse;
    };
  }

  public static async getSystemReviewById(id: string) {
    const review = await prisma.systemReview.findUnique({
      where: { id },
      include: {
        categoryRatings: true,
        user: {
          select: {
            id: true,
            fullNames: true,
            photo: true,
          },
        },
      },
    });
    if (!review) throw new AppError("System review not found", 404);

    return {
      message: "System review fetched successfully",
      statusCode: 200,
      data: review,
    };
  }

  public static async updateSystemReview(
    id: string,
    data: CreateSystemReviewDto,
    userId: string,
  ) {
    const existing = await prisma.systemReview.findUnique({ where: { id } });
    if (!existing) throw new AppError("System review not found", 404);

    // Check if user owns this review
    if (existing.userId !== userId) {
      throw new AppError("You can only update your own reviews", 403);
    }

    // Validate overall rating is between 1 and 5
    if (data.overallRating < 1 || data.overallRating > 5) {
      throw new AppError("Overall rating must be between 1 and 5", 400);
    }

    // Validate category ratings are between 1 and 5
    for (const categoryRating of data.categoryRatings) {
      if (categoryRating.rating < 1 || categoryRating.rating > 5) {
        throw new AppError(
          `Category rating for ${categoryRating.category} must be between 1 and 5`,
          400,
        );
      }
    }

    // First, delete existing category ratings
    await prisma.categoryRating.deleteMany({
      where: { systemReviewId: id },
    });

    const updated = await prisma.systemReview.update({
      where: { id },
      data: {
        feedback: data.feedback,
        overallRating: data.overallRating,
        recommendation: data.recommendation,
        categoryRatings: {
          create: data.categoryRatings.map((rating) => ({
            categoryId: rating.id,
            category: rating.category,
            label: rating.label,
            rating: rating.rating,
          })),
        },
      },
      include: {
        categoryRatings: true,
        user: {
          select: {
            id: true,
            fullNames: true,
            photo: true,
          },
        },
      },
    });

    return {
      message: "System review updated successfully",
      statusCode: 200,
      data: updated,
    } as {
      message: string;
      statusCode: number;
      data: TSystemReviewResponse;
    };
  }

  public static async deleteSystemReview(id: string, userId: string) {
    const existing = await prisma.systemReview.findUnique({ where: { id } });
    if (!existing) throw new AppError("System review not found", 404);

    // Check if user owns this review
    if (existing.userId !== userId) {
      throw new AppError("You can only delete your own reviews", 403);
    }

    await prisma.systemReview.delete({ where: { id } });
    return { message: "System review deleted successfully", statusCode: 200 };
  }

  public static async getSystemReviews(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(
      filters || {},
      "user",
      "system-review",
    );

    const take = filters?.limit ?? 15;
    const skip =
      filters?.currentPage && filters.currentPage > 0
        ? (filters.currentPage - 1) * take
        : 0;

    const reviews = await prisma.systemReview.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        categoryRatings: true,
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
    });

    const totalItems = await prisma.systemReview.count({ where });

    return {
      message: "System reviews fetched successfully",
      statusCode: 200,
      data: reviews,
      totalItems,
      currentPage: filters?.currentPage || 1,
      itemsPerPage: take,
      filters: filters || {},
    };
  }

  public static async getAllSystemReviews(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(
      filters || {},
      "user",
      "system-review",
    );

    const reviews = await prisma.systemReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        categoryRatings: true,
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
    });

    return {
      message: "System reviews fetched successfully",
      statusCode: 200,
      data: reviews,
      totalItems: reviews.length,
      filters: filters || {},
    };
  }

  public static async exportSystemReviewsToExcel(
    filters?: FilterOptions,
    res?: Response,
  ): Promise<Buffer> {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    // Get all reviews with filters
    const result = await this.getAllSystemReviews(filters);
    const reviews = result.data;

    // Create Excel template
    const metadata = getFilterMetadata(filters || {});
    const excelOptions = ExcelExporter.createReviewExcelTemplate(
      reviews,
      "system",
      metadata,
    );

    // Export to Excel
    return await ExcelExporter.exportToExcel(excelOptions, res);
  }

  public static async getMySystemReviews(userId: string) {
    const reviews = await prisma.systemReview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        categoryRatings: true,
        user: {
          select: {
            id: true,
            fullNames: true,
            photo: true,
          },
        },
      },
    });

    return {
      message: "Your system reviews fetched successfully",
      statusCode: 200,
      data: reviews,
    };
  }

  public static async getSystemReviewStats() {
    const totalReviews = await prisma.systemReview.count();

    const averageRating = await prisma.systemReview.aggregate({
      _avg: {
        overallRating: true,
      },
    });

    const ratingDistribution = await prisma.systemReview.groupBy({
      by: ["overallRating"],
      _count: {
        overallRating: true,
      },
      orderBy: {
        overallRating: "asc",
      },
    });

    return {
      message: "System review statistics fetched successfully",
      statusCode: 200,
      data: {
        totalReviews,
        averageRating:
          Math.round((averageRating._avg?.overallRating || 0) * 10) / 10,
        ratingDistribution: ratingDistribution.map((item) => ({
          rating: item.overallRating,
          count: item._count?.overallRating || 0,
        })),
      },
    };
  }
}
