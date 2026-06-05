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
import { CourseReviewService } from "../services/courseReviewService";
import { CreateCourseReviewDto, TUser } from "../utils/interfaces/common";
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

@Route("/api/course-reviews")
@Tags("Course Reviews")
export class CourseReviewController {
  /**
   * Helper method to get student ID from authenticated user
   * Uses request-scoped cache to prevent N+1 database queries
   */
  private async getStudentId(req: ExpressRequest): Promise<string> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const cacheKey = `student_${userId}`;

    return getCachedOrFetch(req, cacheKey, async () => {
      // Try to get student ID from the user's student relationship first
      let studentId = req.user?.student?.id;

      if (!studentId) {
        // If no direct student relationship, try to find student by userId
        const student = await prisma.student.findUnique({
          where: { userId: userId },
        });

        if (!student) {
          throw new Error("Student record not found for this user");
        }

        studentId = student.id;
      }

      return studentId;
    });
  }
  @Post("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async createCourseReview(
    @Body() body: CreateCourseReviewDto,
    @Request() req: ExpressRequest,
  ) {
    const studentId = await this.getStudentId(req);
    return CourseReviewService.createCourseReview(body, studentId);
  }

  @Get("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getCourseReviewById(@Path() id: string) {
    return CourseReviewService.getCourseReviewById(id);
  }

  @Put("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async updateCourseReview(
    @Path() id: string,
    @Body() body: CreateCourseReviewDto,
    @Request() req: ExpressRequest,
  ) {
    const studentId = await this.getStudentId(req);
    return CourseReviewService.updateCourseReview(id, body, studentId);
  }

  @Delete("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async deleteCourseReview(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ) {
    const studentId = await this.getStudentId(req);
    return CourseReviewService.deleteCourseReview(id, studentId);
  }

  @Get("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getCourseReviews(
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
    return CourseReviewService.getCourseReviews(filters);
  }

  @Get("/all")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getAllCourseReviews(
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
    return CourseReviewService.getAllCourseReviews(filters);
  }

  @Get("/my-reviews")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getMyCourseReviews(@Request() req: ExpressRequest) {
    const studentId = await this.getStudentId(req);
    return CourseReviewService.getMyCourseReviews(studentId);
  }

  @Get("/course/{courseId}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getCourseReviewsByCourseId(@Path() courseId: string) {
    return CourseReviewService.getCourseReviewsByCourseId(courseId);
  }

  @Get("/stats/overview")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getCourseReviewStats(@Query() courseId?: string) {
    return CourseReviewService.getCourseReviewStats(courseId);
  }
}
