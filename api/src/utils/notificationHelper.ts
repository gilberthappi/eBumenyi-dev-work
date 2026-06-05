import { UserService } from "../services/userService";
import { NotificationService } from "../services/NotificationService";
import { DashboardService } from "../services/dashboardService";
import { RoleType, TNotification } from "./interfaces/common";
import { Server as SocketIOServer } from "socket.io";
import { pushService } from "../services/pushService";

export class NotificationHelper {
  static async sendToUser(
    io: SocketIOServer,
    userId: string,
    title: string,
    message: string,
    type: TNotification["type"] = "info",
    actionUrl?: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
    cooldownMs = 30_000,
    dedupKey?: string,
  ): Promise<TNotification> {
    try {
      const notification = await NotificationService.createNotification(
        userId,
        title,
        message,
        type,
        actionUrl,
        entityType,
        entityId,
        metadata,
        { cooldownMs, dedupKey },
      );

      // Emit BOTH the full notification object AND the unread count
      // Full notification is needed for the bell panel to update in real-time
      const userRoom = `user:${userId}`;
      io.to(userRoom).emit("notification", notification);
      
      // Also emit unread count for badge updates
      const unreadCount = await NotificationService.getUnreadCount(userId);
      io.to(userRoom).emit("unread_count_updated", { unreadCount });

      pushService
        .sendToUser(userId, {
          title,
          body: message,
          type,
          entityId: entityId ?? notification.id,
          deepLink: actionUrl,
          data: {
            entityType: entityType ?? "",
            actionUrl: actionUrl ?? "",
          },
        })
        .catch((err) =>
          console.error("[NotificationHelper] push send failed:", err),
        );

      return notification;
    } catch (error) {
      console.error("❌ Error sending notification:", error);
      throw error;
    }
  }

  static async sendToUsers(
    io: SocketIOServer,
    userIds: string[],
    title: string,
    message: string,
    type: TNotification["type"] = "info",
    actionUrl?: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
    cooldownMs = 30_000,
    dedupKeyPrefix?: string,
  ): Promise<TNotification[]> {
    const notifications: TNotification[] = [];

    for (const userId of userIds) {
      const notification = await this.sendToUser(
        io,
        userId,
        title,
        message,
        type,
        actionUrl,
        entityType,
        entityId,
        metadata,
        cooldownMs,
        dedupKeyPrefix ? `${dedupKeyPrefix}:${userId}` : undefined,
      );
      notifications.push(notification);
    }

    return notifications;
  }

  static async sendToRole(
    io: SocketIOServer,
    roleName: string,
    title: string,
    message: string,
    type: TNotification["type"] = "info",
    actionUrl?: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const userIds = await UserService.getUserIdsByRole(roleName as RoleType);
    for (const userId of userIds) {
      const notification = await NotificationService.createNotification(
        userId,
        title,
        message,
        type,
        actionUrl,
        entityType,
        entityId,
        metadata,
      );

      // Emit BOTH the full notification object AND the unread count
      const userRoom = `user:${userId}`;
      io.to(userRoom).emit("notification", notification);
      
      // Also emit unread count for badge updates
      const unreadCount = await NotificationService.getUnreadCount(userId);
      io.to(userRoom).emit("unread_count_updated", { unreadCount });

      // Send push notification
      pushService
        .sendToUser(userId, {
          title,
          body: message,
          type,
          entityId: entityId ?? notification.id,
          deepLink: actionUrl,
          data: {
            entityType: entityType ?? "",
            actionUrl: actionUrl ?? "",
          },
        })
        .catch((err) => {
          console.error(
            `[NotificationHelper] push send failed for role ${roleName}, user ${userId}:`,
            err,
          );
        });
    }
  }

  static async broadcast(
    io: SocketIOServer,
    title: string,
    message: string,
    type: TNotification["type"] = "info",
    actionUrl?: string,
  ): Promise<void> {
    io.emit("notification", {
      title,
      message,
      type,
      actionUrl,
      createdAt: new Date(),
      isRead: false,
    });
  }

  /**
   * Send course enrollment notification and trigger dashboard update
   */
  static async notifyCourseEnrollment(
    io: SocketIOServer,
    studentId: string,
    courseId: string,
    courseName: string,
  ): Promise<void> {
    try {
      // Send notification to student
      await this.sendToUser(
        io,
        studentId,
        "Kwiyandikisha mu isomo byagenze neza",
        `Wiyandikishije neza mu isomo rya ${courseName}. Tangira kwiga ubu!`,
        "success",
        `/courses/${courseId}`,
        "course",
        courseId,
      );

      // Trigger dashboard real-time update
      await DashboardService.onStudentEnrollment(io, studentId, courseId);
    } catch (error) {
      console.error("Error notifying course enrollment:", error);
    }
  }

  /**
   * Send course completion notification and trigger dashboard update
   */
  static async notifyCourseCompletion(
    io: SocketIOServer,
    studentId: string,
    courseId: string,
    courseName: string,
  ): Promise<void> {
    try {
      // Send notification to student
      await this.sendToUser(
        io,
        studentId,
        "Wakoze neza! Warangije isomo",
        `Warangije isomo rya ${courseName} neza. Komeza usome!`,
        "success",
        `/courses/${courseId}/certificate`,
        "course",
        courseId,
      );

      // Trigger dashboard real-time update
      await DashboardService.onCourseCompletion(io, studentId, courseId);
    } catch (error) {
      console.error("Error notifying course completion:", error);
    }
  }

  /**
   * Send new course creation notification and trigger dashboard update
   */
  static async notifyNewCourseCreated(
    io: SocketIOServer,
    courseId: string,
    courseName: string,
  ): Promise<void> {
    try {
      // Notify all students about new course
      await this.sendToRole(
        io,
        "STUDENT",
        "Hari isomo rishya",
        `Isomo rishya "${courseName}" ryongeweho. Reba usome!`,
        "info",
        `/courses/${courseId}`,
        "course",
        courseId,
      );

      // Trigger dashboard real-time update
      await DashboardService.onCourseCreated(io, courseId);
    } catch (error) {
      console.error("Error notifying new course creation:", error);
    }
  }
}
