import {
  Get,
  Middlewares,
  Post,
  Put,
  Delete,
  Route,
  Security,
  Tags,
  Path,
  Request,
  Query,
  Body,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { NotificationService } from "../services/NotificationService";
import { loggerMiddleware } from "../utils/loggers/loggingMiddleware";
import AppError from "../utils/error";
import { RegisterPushTokenDto } from "../utils/interfaces/common";
import { pushService } from "../services/pushService";

@Route("/api/notifications")
@Tags("Notifications")
export class NotificationController {
  private ensureUserId(req: ExpressRequest): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }
    return userId;
  }

  @Get("/")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public getUserNotifications(
    @Request() req: ExpressRequest,
    @Query() limit?: number,
    @Query() offset?: number,
  ) {
    const userId = this.ensureUserId(req);
    return NotificationService.getUserNotifications(userId, limit, offset);
  }

  @Get("/unread-count")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public getUnreadCount(@Request() req: ExpressRequest) {
    const userId = this.ensureUserId(req);
    return NotificationService.getUnreadCount(userId).then((count) => ({
      statusCode: 200,
      message: "Unread count retrieved successfully",
      data: { unreadCount: count },
    }));
  }

  @Put("/{notificationId}/read")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public markAsRead(
    @Request() req: ExpressRequest,
    @Path() notificationId: string,
  ) {
    const userId = this.ensureUserId(req);
    return NotificationService.markAsRead(notificationId, userId).then(
      (success) => {
        if (!success) {
          throw new AppError("Notification not found or access denied", 404);
        }
        return {
          statusCode: 200,
          message: "Notification marked as read",
        };
      },
    );
  }

  @Put("/mark-all-read")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public markAllAsRead(@Request() req: ExpressRequest) {
    const userId = this.ensureUserId(req);
    return NotificationService.markAllAsRead(userId).then((count) => ({
      statusCode: 200,
      message: `${count} notifications marked as read`,
      data: { markedAsRead: count },
    }));
  }

  @Delete("/{notificationId}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public deleteNotification(
    @Request() req: ExpressRequest,
    @Path() notificationId: string,
  ) {
    const userId = this.ensureUserId(req);
    return NotificationService.deleteNotification(notificationId, userId).then(
      (success) => {
        if (!success) {
          throw new AppError("Notification not found or access denied", 404);
        }
        return {
          statusCode: 200,
          message: "Notification deleted successfully",
        };
      },
    );
  }

  @Delete("/clear-all")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public clearAllNotifications(@Request() req: ExpressRequest) {
    const userId = this.ensureUserId(req);
    return NotificationService.clearAllNotifications(userId).then((count) => ({
      statusCode: 200,
      message: `${count} notifications cleared`,
      data: { cleared: count },
    }));
  }

  @Post("/push-token")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async registerPushToken(
    @Request() req: ExpressRequest,
    @Body() body: RegisterPushTokenDto,
  ) {
    const userId = this.ensureUserId(req);
    await pushService.registerToken(
      userId,
      body.token,
      body.platform || "web",
      body.deviceId,
      body.expiresAt ? new Date(body.expiresAt) : null,
    );

    return {
      statusCode: pushService.isEnabled() ? 200 : 202,
      message: pushService.isEnabled()
        ? "Push token registered"
        : "Token stored; push not configured",
    };
  }

  @Post("/test-push")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async testPush(@Request() req: ExpressRequest) {
    const userId = this.ensureUserId(req);

    const result = await pushService.sendToUser(userId, {
      title: "Ibutsa ry'ikiganiro",
      body: "Iyi ni igerageza rya notification.",
      type: "calendar_reminder",
      entityId: "test",
      deepLink: "/calendar/test",
      data: {
        eventType: "TRAINING",
        startTime: new Date().toISOString(),
      },
    });

    return {
      statusCode: 200,
      message: "Test push sent",
      data: result,
    };
  }
}
