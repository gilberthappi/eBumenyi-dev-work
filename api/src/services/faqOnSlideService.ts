import { prisma } from "../utils/client";
import AppError from "../utils/error";
import {
  CreateFAQOnSlideDto,
  TFAQOnSlideResponse,
} from "../utils/interfaces/common";
import { Prisma } from "@prisma/client";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

export class FAQOnSlideService {
  // Helper: upload a local file path to Cloudinary and return the secure URL
  private static async uploadLocalFileToCloudinary(filePath: string) {
    try {
      // Normalize file URI like file:///path/to/file
      const normalized = filePath.replace(/^file:\/\//, "");
      // Ensure file exists and is readable
      await fs.access(normalized);
      // Upload using cloudinary (resource_type auto)
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

  public static async createFAQ(data: CreateFAQOnSlideDto, userId: string) {
    // validate student and slide
    const student = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!student) throw new AppError("User not found", 404);

    const slide = await prisma.slide.findUnique({
      where: { id: data.slideId },
    });
    if (!slide) throw new AppError("Slide not found", 404);

    // Validate message is a string (non-null)
    let messageValue =
      typeof data.message === "string" ? data.message : undefined;
    if (messageValue === undefined) {
      throw new AppError("Message is required and must be a string", 400);
    }

    // If message looks like a local file URI or path, try to upload it to Cloudinary
    const looksLikeLocal =
      /^file:\/\//.test(messageValue) || messageValue.startsWith("/");
    if (looksLikeLocal) {
      // Attempt upload; if it fails, propagate error to caller
      messageValue =
        await FAQOnSlideService.uploadLocalFileToCloudinary(messageValue);
    }

    const created = await prisma.fAQOnSlide.create({
      data: {
        userId: userId,
        slideId: data.slideId,
        message: messageValue,
        isPublished: data.isPublished ?? true,
      },
    });

    return { message: "FAQ created", statusCode: 201, data: created } as {
      message: string;
      statusCode: number;
      data: TFAQOnSlideResponse;
    };
  }

  public static async getFAQById(id: string) {
    const faq = await prisma.fAQOnSlide.findUnique({ where: { id } });
    if (!faq) throw new AppError("FAQ not found", 404);
    return { message: "FAQ fetched", statusCode: 200, data: faq } as {
      message: string;
      statusCode: number;
      data: TFAQOnSlideResponse;
    };
  }

  public static async updateFAQ(id: string, data: CreateFAQOnSlideDto) {
    const existing = await prisma.fAQOnSlide.findUnique({ where: { id } });
    if (!existing) throw new AppError("FAQ not found", 404);

    // If message provided, validate type (null not allowed)
    let messageUpdate: string | undefined = undefined;
    if (data.message !== undefined) {
      if (typeof data.message !== "string") {
        throw new AppError("Message must be a string", 400);
      }
      // If provided value looks like a local file, upload it
      const looksLikeLocal =
        /^file:\/\//.test(data.message) || data.message.startsWith("/");
      if (looksLikeLocal) {
        messageUpdate = await FAQOnSlideService.uploadLocalFileToCloudinary(
          data.message,
        );
      } else {
        messageUpdate = data.message;
      }
    }

    const updated = await prisma.fAQOnSlide.update({
      where: { id },
      data: {
        slideId: data.slideId ?? existing.slideId,
        ...(messageUpdate !== undefined ? { message: messageUpdate } : {}),
        isPublished: data.isPublished ?? existing.isPublished,
      },
    });

    return { message: "FAQ updated", statusCode: 200, data: updated } as {
      message: string;
      statusCode: number;
      data: TFAQOnSlideResponse;
    };
  }

  public static async deleteFAQ(id: string) {
    const existing = await prisma.fAQOnSlide.findUnique({ where: { id } });
    if (!existing) throw new AppError("FAQ not found", 404);
    await prisma.fAQOnSlide.delete({ where: { id } });
    return { message: "FAQ deleted", statusCode: 200 };
  }

  public static async getFAQs(
    searchq?: string,
    limit?: number,
    currentPage?: number,
  ) {
    const where: Prisma.FAQOnSlideWhereInput = {};
    if (searchq) {
      where.OR = [{ message: { contains: searchq, mode: "insensitive" } }];
    }

    const take = limit ?? 15;
    const skip = currentPage && currentPage > 0 ? (currentPage - 1) * take : 0;

    const faqs = await prisma.fAQOnSlide.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
    });
    const totalItems = await prisma.fAQOnSlide.count({ where });

    return {
      message: "FAQs fetched",
      statusCode: 200,
      data: faqs,
      totalItems,
      currentPage: currentPage || 1,
      itemsPerPage: take,
    };
  }

  public static async getAllFAQs(searchq?: string) {
    const where: Prisma.FAQOnSlideWhereInput = {};
    if (searchq)
      where.OR = [{ message: { contains: searchq, mode: "insensitive" } }];

    const faqs = await prisma.fAQOnSlide.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return { message: "FAQs fetched", statusCode: 200, data: faqs };
  }

  public static async getFAQsByCourse(
    courseId: string,
    currentUserId?: string,
  ) {
    // ensure course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError("Course not found", 404);

    // find slides for the course
    const slides = await prisma.slide.findMany({
      where: { chapter: { section: { courseId } } },
      select: { id: true },
    });
    const slideIds = slides.map((s) => s.id);

    const faqs = await prisma.fAQOnSlide.findMany({
      where: { slideId: { in: slideIds } },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    const transformed = faqs.map((f) => ({
      id: f.id,
      userId: f.userId,
      userFullName: f.user?.fullNames || "",
      avatar: f.user.photo,
      slideId: f.slideId,
      message: f.message,
      isPublished: f.isPublished,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      isMine: currentUserId ? f.userId === currentUserId : false,
    }));

    return {
      message: "FAQs fetched by course",
      statusCode: 200,
      data: transformed,
    };
  }
}
