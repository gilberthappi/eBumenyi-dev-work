import { Get, Put, Route, Security, Tags, Request, Body, Middlewares } from "tsoa";
import { Request as ExpressRequest } from "express";
import { SettingsService } from "../services/settingsService";
import { UpdateSettingsDto, UserSettingsResponse } from "../utils/interfaces/common";
import { loggerMiddleware } from "../utils/loggers/loggingMiddleware";
import AppError from "../utils/error";

@Route("/api/settings")
@Tags("Settings")
export class SettingsController {
  private ensureUserId(req: ExpressRequest): string {
    const userId = req.user?.id;
    if (!userId) throw new AppError("User not authenticated", 401);
    return userId;
  }

  @Get("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getSettings(
    @Request() req: ExpressRequest,
  ): Promise<{ statusCode: number; message: string; data: UserSettingsResponse }> {
    const userId = this.ensureUserId(req);
    const data = await SettingsService.getSettings(userId);
    return { statusCode: 200, message: "Settings retrieved successfully", data };
  }

  @Put("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async updateSettings(
    @Request() req: ExpressRequest,
    @Body() body: UpdateSettingsDto,
  ): Promise<{ statusCode: number; message: string; data: UserSettingsResponse }> {
    const userId = this.ensureUserId(req);
    const data = await SettingsService.updateSettings(userId, body);
    return { statusCode: 200, message: "Settings updated successfully", data };
  }
}
