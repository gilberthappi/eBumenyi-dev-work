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
import { ChapterReviewService } from "../services/chapterReviewService";
import { CreateChapterReviewDto, TUser } from "../utils/interfaces/common";
import { loggerMiddleware } from "../utils/loggers/loggingMiddleware";
import { Request as ExpressRequest } from "express";
import { FilterOptions } from "../utils/filterUtils";
import { prisma } from "../utils/client";

declare module "express" {
  interface Request {
    user?: TUser;
  }
}

@Route("/api/chapter-reviews")
@Tags("Chapter Reviews")
export class ChapterReviewController {
  private async getStudentId(req: ExpressRequest): Promise<string> {
    let studentId = req.user?.student?.id;

    if (!studentId) {
      const userId = req.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new Error("Student record not found for this user");

      studentId = student.id;
    }

    return studentId;
  }

  @Post("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async createChapterReview(
    @Body() body: CreateChapterReviewDto,
    @Request() req: ExpressRequest,
  ) {
    const studentId = await this.getStudentId(req);
    return ChapterReviewService.createChapterReview(body, studentId);
  }

  @Put("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async updateChapterReview(
    @Path() id: string,
    @Body() body: CreateChapterReviewDto,
    @Request() req: ExpressRequest,
  ) {
    const studentId = await this.getStudentId(req);
    return ChapterReviewService.updateChapterReview(id, body, studentId);
  }

  @Delete("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async deleteChapterReview(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ) {
    const studentId = await this.getStudentId(req);
    return ChapterReviewService.deleteChapterReview(id, studentId);
  }

  @Get("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getChapterReviews(
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
    return ChapterReviewService.getChapterReviews(filters);
  }

  @Get("/all")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getAllChapterReviews(
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
    return ChapterReviewService.getAllChapterReviews(filters);
  }

  @Get("/my-reviews")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getMyChapterReviews(@Request() req: ExpressRequest) {
    const studentId = await this.getStudentId(req);
    return ChapterReviewService.getMyChapterReviews(studentId);
  }

  @Get("/chapter/{chapterId}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getChapterReviewsByChapterId(@Path() chapterId: string) {
    return ChapterReviewService.getChapterReviewsByChapterId(chapterId);
  }

  @Get("/stats/overview")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getChapterReviewStats(@Query() chapterId?: string) {
    return ChapterReviewService.getChapterReviewStats(chapterId);
  }

  @Get("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getChapterReviewById(@Path() id: string) {
    return ChapterReviewService.getChapterReviewById(id);
  }
}
