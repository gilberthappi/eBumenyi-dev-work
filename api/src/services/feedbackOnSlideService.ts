import { prisma } from "../utils/client";
import AppError from "../utils/error";
import {
  CreateFeedbackOnSlideDto,
  TFeedbackOnSlideResponse,
} from "../utils/interfaces/common";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import {
  FilterOptions,
  validateFilterOptions,
  buildPrismaWhereClause,
  getFilterMetadata,
} from "../utils/filterUtils";
import { ExcelExporter } from "../utils/excelExporter";
import { Response } from "express";

export class FeedbackOnSlideService {
  // Helper: upload a local file path to Cloudinary and return the secure URL
  private static async uploadLocalFileToCloudinary(filePath: string) {
    try {
      const normalized = filePath.replace(/^file:\/\//, "");
      await fs.access(normalized);
      const res = await cloudinary.uploader.upload(normalized, {
        resource_type: "auto",
        folder: "chw",
      });
      return (res.secure_url as string) || (res.url as string) || "";
    } catch (err) {
      throw new AppError(
        `Failed to upload local file to Cloudinary: ${String(err)}`,
        500,
      );
    }
  }

  public static async createFeedback(
    data: CreateFeedbackOnSlideDto,
    userId: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    const slide = await prisma.slide.findUnique({
      where: { id: data.slideId },
    });
    if (!slide) throw new AppError("Slide not found", 404);

    let messageValue =
      typeof data.message === "string" ? data.message : undefined;
    if (messageValue === undefined) {
      throw new AppError("Message is required and must be a string", 400);
    }

    const looksLikeLocal =
      /^file:\/\//.test(messageValue) || messageValue.startsWith("/");
    if (looksLikeLocal) {
      messageValue =
        await FeedbackOnSlideService.uploadLocalFileToCloudinary(messageValue);
    }

    const created = await prisma.feedbackOnSlide.create({
      data: {
        userId: userId,
        slideId: data.slideId,
        message: messageValue,
        isPublished: data.isPublished ?? true,
      },
    });

    return { message: "Feedback created", statusCode: 201, data: created } as {
      message: string;
      statusCode: number;
      data: TFeedbackOnSlideResponse;
    };
  }

  public static async getFeedbackById(id: string) {
    const feedback = await prisma.feedbackOnSlide.findUnique({ where: { id } });
    if (!feedback) throw new AppError("Feedback not found", 404);
    return { message: "Feedback fetched", statusCode: 200, data: feedback } as {
      message: string;
      statusCode: number;
      data: TFeedbackOnSlideResponse;
    };
  }

  public static async updateFeedback(
    id: string,
    data: CreateFeedbackOnSlideDto,
  ) {
    const existing = await prisma.feedbackOnSlide.findUnique({ where: { id } });
    if (!existing) throw new AppError("Feedback not found", 404);

    let messageUpdate: string | undefined = undefined;
    if (data.message !== undefined) {
      if (typeof data.message !== "string") {
        throw new AppError("Message must be a string", 400);
      }
      const looksLikeLocal =
        /^file:\/\//.test(data.message) || data.message.startsWith("/");
      if (looksLikeLocal) {
        messageUpdate =
          await FeedbackOnSlideService.uploadLocalFileToCloudinary(
            data.message,
          );
      } else {
        messageUpdate = data.message;
      }
    }

    const updated = await prisma.feedbackOnSlide.update({
      where: { id },
      data: {
        slideId: data.slideId ?? existing.slideId,
        ...(messageUpdate !== undefined ? { message: messageUpdate } : {}),
        isPublished: data.isPublished ?? existing.isPublished,
      },
    });

    return { message: "Feedback updated", statusCode: 200, data: updated } as {
      message: string;
      statusCode: number;
      data: TFeedbackOnSlideResponse;
    };
  }

  public static async deleteFeedback(id: string) {
    const existing = await prisma.feedbackOnSlide.findUnique({ where: { id } });
    if (!existing) throw new AppError("Feedback not found", 404);
    await prisma.feedbackOnSlide.delete({ where: { id } });
    return { message: "Feedback deleted", statusCode: 200 };
  }

  public static async getFeedbacks(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(filters || {}, "user", "feedback");

    const take = filters?.limit ?? 15;
    const skip =
      filters?.currentPage && filters.currentPage > 0
        ? (filters.currentPage - 1) * take
        : 0;

    const feedbacks = await prisma.feedbackOnSlide.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        slide: {
          include: {
            chapter: {
              include: {
                section: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
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
    const totalItems = await prisma.feedbackOnSlide.count({ where });

    return {
      message: "Feedbacks fetched",
      statusCode: 200,
      data: feedbacks,
      totalItems,
      currentPage: filters?.currentPage || 1,
      itemsPerPage: take,
      filters: filters || {},
    };
  }

  public static async getAllFeedbacks(filters?: FilterOptions) {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    const where = buildPrismaWhereClause(filters || {}, "user", "feedback");

    const feedbacks = await prisma.feedbackOnSlide.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        slide: {
          include: {
            chapter: {
              include: {
                section: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
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
      message: "Feedbacks fetched",
      statusCode: 200,
      data: feedbacks,
      totalItems: feedbacks.length,
      filters: filters || {},
    };
  }

  public static async exportFeedbacksToExcel(
    filters?: FilterOptions,
    res?: Response,
  ): Promise<Buffer> {
    // Validate filters
    const validation = validateFilterOptions(filters || {});
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400);
    }

    // Get all feedbacks with filters
    const result = await this.getAllFeedbacks(filters);
    const feedbacks = result.data;

    // Create Excel template
    const metadata = getFilterMetadata(filters || {});
    const excelOptions = ExcelExporter.createFeedbackExcelTemplate(
      feedbacks,
      metadata,
    );

    // Export to Excel
    return await ExcelExporter.exportToExcel(excelOptions, res);
  }

  public static async getFeedbacksByCourse(
    courseId: string,
    currentUserId?: string,
  ) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError("Course not found", 404);

    if (!currentUserId) {
      // Require authenticated user to fetch "mine" feedbacks
      throw new AppError("Unauthorized", 401);
    }

    const slides = await prisma.slide.findMany({
      where: { chapter: { section: { courseId } } },
      select: { id: true },
    });
    const slideIds = slides.map((s) => s.id);

    const feedbacks = await prisma.feedbackOnSlide.findMany({
      where: { slideId: { in: slideIds }, userId: currentUserId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    const transformed = feedbacks.map((f) => ({
      id: f.id,
      userId: f.userId,
      userFullName: f.user?.fullNames || "",
      avatar: f.user.photo,
      slideId: f.slideId,
      message: f.message,
      isPublished: f.isPublished,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      isMine: true,
    }));

    return {
      message: "Feedbacks fetched by course",
      statusCode: 200,
      data: transformed,
    };
  }
}
