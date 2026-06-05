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
import { SystemReviewService } from "../services/systemReviewService";
import { CreateSystemReviewDto, TUser } from "../utils/interfaces/common";
import { loggerMiddleware } from "../utils/loggers/loggingMiddleware";
import { Request as ExpressRequest } from "express";
import { FilterOptions } from "../utils/filterUtils";

declare module "express" {
  interface Request {
    user?: TUser;
  }
}

@Route("/api/system-reviews")
@Tags("System Reviews")
export class SystemReviewController {
  @Post("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async createSystemReview(
    @Body() body: CreateSystemReviewDto,
    @Request() req: ExpressRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return SystemReviewService.createSystemReview(body, userId);
  }

  /**
   * Get a system review by ID
   */
  @Get("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getSystemReviewById(@Path() id: string) {
    return SystemReviewService.getSystemReviewById(id);
  }

  /**
   * Update a system review by ID
   */
  @Put("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async updateSystemReview(
    @Path() id: string,
    @Body() body: CreateSystemReviewDto,
    @Request() req: ExpressRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return SystemReviewService.updateSystemReview(id, body, userId);
  }

  /**
   * Delete a system review by ID
   */
  @Delete("/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async deleteSystemReview(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return SystemReviewService.deleteSystemReview(id, userId);
  }

  /**
   * Get paginated system reviews with optional search
   */
  @Get("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getSystemReviews(
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
    return SystemReviewService.getSystemReviews(filters);
  }

  /**
   * Get all system reviews (without pagination)
   */
  @Get("/all")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getAllSystemReviews(
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
    return SystemReviewService.getAllSystemReviews(filters);
  }

  /**
   * Get current user's system reviews
   */
  @Get("/my-reviews")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getMySystemReviews(@Request() req: ExpressRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return SystemReviewService.getMySystemReviews(userId);
  }

  /**
   * Get system review statistics
   */
  @Get("/stats/overview")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getSystemReviewStats() {
    return SystemReviewService.getSystemReviewStats();
  }
}
