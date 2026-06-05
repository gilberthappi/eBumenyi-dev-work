import { prisma } from "../utils/client";
import AppError from "../utils/error";
import {
  CreateCourseReviewDto,
  TCourseReviewResponse,
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

export class CourseReviewService {
  public static async createCourseReview(
    data: CreateCourseReviewDto,
    studentId: string,
  ) {
    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new AppError("Student not found", 404);

    // Validate course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course) throw new AppError("Course not found", 404);

    // Validate rating is between 1 and 5
    if (data.rating < 1 || data.rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    // Validate categoryRatings
    for (const cr of data.categoryRatings || []) {
      if (cr.rating < 1 || cr.rating > 5) {
        throw new AppError(
          "Category rating for " + cr.category + " must be between 1 and 5",
          400,
        );
      }
    }

    // Check if student already reviewed this course
    const existingReview = await prisma.courseReview.findFirst({
      where: {
        studentId,
        courseId: data.courseId,
      },
    });
    if (existingReview) {
      throw new AppError("You have already reviewed this course", 409);
    }

    const created = await prisma.courseReview.create({
      data: {
        studentId,
        courseId: data.courseId,
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
            user: {
              select: {
                id: true,
                fullNames: true,
                photo: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
          },
        },
        categoryRatings: true,
      },
    });

    // Update course average rating
    await this.updateCourseAverageRating(data.courseId);

    return {
      message: "Course review created successfully",
      statusCode: 201,
      data: created,
    } as {
      message: string;
      statusCode: number;
      data: TCourseReviewResponse;
    };
  }

  public static async getCourseReviewById(id: string) {
    const review = await prisma.courseReview.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullNames: true,
                photo: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
          },
        },
        categoryRatings: true,
      },
    });
    if (!review) throw new AppError("Course review not found", 404);

    return {
      message: "Course review fetched successfully",
      statusCode: 200,
      data: review,
    };
  }

  public static async updateCourseReview(
    id: string,
    data: CreateCourseReviewDto,
    studentId: string,
  ) {
    const existing = await prisma.courseReview.findUnique({
      where: { id },
    });
    if (!existing) throw new AppError("Course review not found", 404);

    // Check if student owns this review
    if (existing.studentId !== studentId) {
      throw new AppError("You can only update your own reviews", 403);
    }

    // Validate rating is between 1 and 5
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
    await prisma.courseCategoryRating.deleteMany({
      where: { courseReviewId: id },
    });

    const updated = await prisma.courseReview.update({
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
            user: {
              select: {
                id: true,
                fullNames: true,
                photo: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
          },
        },
        categoryRatings: true,
      },
    });

    // Update course average rating
    await this.updateCourseAverageRating(data.courseId);

    return {
      message: "Course review updated successfully",
      statusCode: 200,
      data: updated,
    } as {
      message: string;
      statusCode: number;
      data: TCourseReviewResponse;
    };
  }

  public static async deleteCourseReview(id: string, studentId: string) {
    const existing = await prisma.courseReview.findUnique({
      where: { id },
    });
    if (!existing) throw new AppError("Course review not found", 404);

    // Check if student owns this review
    if (existing.studentId !== studentId) {
      throw new AppError("You can only delete your own reviews", 403);
    }

    const courseId = existing.courseId;
    await prisma.courseReview.delete({ where: { id } });

    // Update course average rating after deletion
    await this.updateCourseAverageRating(courseId);

    return { message: "Course review deleted successfully", statusCode: 200 };
  }

  public static async getCourseReviews(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(
      filters || {},
      "student.user",
      "course-review",
    );

    const take = filters?.limit ?? 15;
    const skip =
      filters?.currentPage && filters.currentPage > 0
        ? (filters.currentPage - 1) * take
        : 0;

    const reviews = await prisma.courseReview.findMany({
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
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
          },
        },
        categoryRatings: true,
      },
    });

    const totalItems = await prisma.courseReview.count({ where });

    return {
      message: "Course reviews fetched successfully",
      statusCode: 200,
      data: reviews,
      totalItems,
      currentPage: filters?.currentPage || 1,
      itemsPerPage: take,
      filters: filters || {},
    };
  }

  public static async getAllCourseReviews(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(
      filters || {},
      "student.user",
      "course-review",
    );

    const reviews = await prisma.courseReview.findMany({
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
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
          },
        },
        categoryRatings: true,
      },
    });

    return {
      message: "Course reviews fetched successfully",
      statusCode: 200,
      data: reviews,
      totalItems: reviews.length,
      filters: filters || {},
    };
  }

  public static async exportCourseReviewsToExcel(
    filters?: FilterOptions,
    res?: Response,
  ): Promise<Buffer> {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    // Get all reviews with filters
    const result = await this.getAllCourseReviews(filters);
    const reviews = result.data;

    // Create Excel template
    const metadata = getFilterMetadata(filters || {});
    const excelOptions = ExcelExporter.createReviewExcelTemplate(
      reviews,
      "course",
      metadata,
    );

    // Export to Excel
    return await ExcelExporter.exportToExcel(excelOptions, res);
  }

  public static async getMyCourseReviews(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new AppError("Student not found", 404);

    const reviews = await prisma.courseReview.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullNames: true,
                photo: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
          },
        },
        categoryRatings: true,
      },
    });

    return {
      message: "Your course reviews fetched successfully",
      statusCode: 200,
      data: reviews,
    };
  }

  public static async getCourseReviewsByCourseId(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError("Course not found", 404);

    const reviews = await prisma.courseReview.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullNames: true,
                photo: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
          },
        },
        categoryRatings: true,
      },
    });

    return {
      message: "Course reviews fetched successfully",
      statusCode: 200,
      data: reviews,
    };
  }

  public static async getCourseReviewStats(courseId?: string) {
    let where: Prisma.CourseReviewWhereInput = {};
    if (courseId) {
      where = { courseId };
    }

    const totalReviews = await prisma.courseReview.count({ where });

    const averageRating = await prisma.courseReview.aggregate({
      _avg: {
        rating: true,
      },
      where,
    });

    const ratingDistribution = await prisma.courseReview.groupBy({
      by: ["rating"],
      _count: {
        rating: true,
      },
      where,
      orderBy: {
        rating: "asc",
      },
    });

    return {
      message: "Course review statistics fetched successfully",
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

  private static async updateCourseAverageRating(courseId: string) {
    const averageRating = await prisma.courseReview.aggregate({
      _avg: {
        rating: true,
      },
      where: { courseId },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: {
        rating: Math.round((averageRating._avg.rating || 0) * 10) / 10,
      },
    });
  }
}
