import {
  Body,
  Delete,
  Get,
  Middlewares,
  Path,
  Post,
  Put,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { SectionReviewService } from "../services/sectionReviewService";
import { CreateSectionReviewDto, TUser } from "../utils/interfaces/common";
import { loggerMiddleware } from "../utils/loggers/loggingMiddleware";
import { Request as ExpressRequest } from "express";
import { FilterOptions } from "../utils/filterUtils";
import { prisma } from "../utils/client";
import { getCachedOrFetch } from "../utils/requestCache";

declare module "express" {
  interface Request {
    user?: TUser;
  }
}

@Route("/api/section-reviews")
@Tags("Section Reviews")
export class SectionReviewController {
  /**
   * Helper method to get student ID from authenticated user
   * Uses request-scoped cache to prevent N+1 database queries
   */
  private async getStudentId(req: ExpressRequest): Promise<string> {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const cacheKey = `student_${userId}`;

    return getCachedOrFetch(req, cacheKey, async () => {
      let studentId = req.user?.student?.id;

      if (!studentId) {
        const student = await prisma.student.findUnique({ where: { userId } });
        if (!student) throw new Error("Student record not found for this user");

        studentId = student.id;
      }

      return studentId;
    });
  }

  @Post("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async createSectionReview(
    @Body() body: CreateSectionReviewDto,
    @Request() req: ExpressRequest,
  ) {
    const studentId = await this.getStudentId(req);
    return SectionReviewService.createSectionReview(body, studentId);
  }

  @Put("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async updateSectionReview(
    @Path() id: string,
    @Body() body: CreateSectionReviewDto,
    @Request() req: ExpressRequest,
  ) {
    const studentId = await this.getStudentId(req);
    return SectionReviewService.updateSectionReview(id, body, studentId);
  }

  @Delete("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async deleteSectionReview(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ) {
    const studentId = await this.getStudentId(req);
    return SectionReviewService.deleteSectionReview(id, studentId);
  }

  @Get("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getSectionReviews(
    @Query() searchq?: string,
    @Query() district?: string,
    @Query() sector?: string,
    @Query() startDate?: string,
    @Query() endDate?: string,
    @Query() limit?: number,
  ) {
    const filters: FilterOptions = {
      searchq,
      district,
      sector,
      dateRange: startDate && endDate ? { startDate, endDate } : undefined,
      limit,
    };
    return SectionReviewService.getSectionReviews(filters);
  }

  @Get("/all")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getAllSectionReviews(
    @Query() searchq?: string,
    @Query() district?: string,
    @Query() sector?: string,
    @Query() startDate?: string,
    @Query() endDate?: string,
  ) {
    const filters: FilterOptions = {
      searchq,
      district,
      sector,
      dateRange: startDate && endDate ? { startDate, endDate } : undefined,
    };
    return SectionReviewService.getAllSectionReviews(filters);
  }

  @Get("/my-reviews")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getMySectionReviews(@Request() req: ExpressRequest) {
    const studentId = await this.getStudentId(req);
    return SectionReviewService.getMySectionReviews(studentId);
  }

  @Get("/section/{sectionId}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getSectionReviewsBySectionId(@Path() sectionId: string) {
    return SectionReviewService.getSectionReviewsBySectionId(sectionId);
  }

  @Get("/stats/overview")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getSectionReviewStats(@Query() sectionId?: string) {
    return SectionReviewService.getSectionReviewStats(sectionId);
  }

  @Get("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getSectionReviewById(@Path() id: string) {
    return SectionReviewService.getSectionReviewById(id);
  }
}
