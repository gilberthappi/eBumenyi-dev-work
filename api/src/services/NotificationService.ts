import { prisma } from "../utils/client";
import { TNotification } from "../utils/interfaces/common";

type CooldownOptions = {
  cooldownMs?: number;
  dedupKey?: string;
  /** Minute bucket for dedup; defaults to now. Use scheduled fireAt for reminders. */
  dedupAt?: Date;
};

export class NotificationService {
  /**
   * Create or return existing notification with database-level deduplication.
   * Uses upsert to prevent race conditions across multiple scheduler instances.
   * 
   * Deduplication key: userId + type + entityType + entityId + createdAtMinute
   * Pass options.dedupAt (e.g. reminder fireAt) so the bucket matches the scheduled time.
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: TNotification["type"] = "info",
    actionUrl?: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
    options?: CooldownOptions,
  ): Promise<TNotification> {
    const dedupSource = options?.dedupAt ?? new Date();
    const createdAtMinute = new Date(
      Math.floor(dedupSource.getTime() / 60000) * 60000,
    );

    // Build the where clause for dedup lookup
    const dedupWhere: Record<string, any> = {
      userId,
      type,
      createdAtMinute,
    };
    if (entityType !== undefined) dedupWhere.entityType = entityType;
    if (entityId !== undefined) dedupWhere.entityId = entityId;

    try {
      // Use upsert to atomically create OR return existing notification
      // This prevents race conditions when multiple instances try to create the same notification
      const notification = await prisma.notification.upsert({
        where: {
          // Unique constraint key for lookup
          userId_type_entityType_entityId_createdAtMinute: dedupWhere as any,
        },
        create: {
          userId,
          title,
          message,
          type,
          actionUrl,
          entityType,
          entityId,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
          createdAt: createdAtMinute,
          createdAtMinute,
        },
        update: {
          // If notification already exists, just return it (no update needed)
          updatedAt: new Date(),
        },
      });

      return {
        ...notification,
        metadata:
          notification.metadata === null
            ? undefined
            : (notification.metadata as Record<string, unknown>),
      };
    } catch (error: any) {
      // Fallback: If unique constraint fails (shouldn't happen with upsert, but just in case)
      // try to find existing notification within cooldown window
      const cooldownWindow = options?.cooldownMs ?? 300_000; // 5 minutes default
      const since = new Date(Date.now() - cooldownWindow);
      
      const dedupWhereFallback: Record<string, any> = {
        userId,
        type,
        createdAt: { gte: since },
      };
      if (entityType !== undefined) dedupWhereFallback.entityType = entityType;
      if (entityId !== undefined) dedupWhereFallback.entityId = entityId;

      const recent = await prisma.notification.findFirst({
        where: dedupWhereFallback,
      });
      
      if (recent) {
        return {
          ...recent,
          metadata:
            recent.metadata === null
              ? undefined
              : (recent.metadata as Record<string, unknown>),
        };
      }

      throw error;
    }
  }

  static async getUserNotifications(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<TNotification[]> {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });
    return notifications.map((notification) => ({
      ...notification,
      metadata:
        notification.metadata === null
          ? undefined
          : (notification.metadata as Record<string, unknown>),
    }));
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  static async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });
    return result.count > 0;
  }

  static async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    return result.count;
  }

  static async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
    return result.count > 0;
  }

  static async clearAllNotifications(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  static async getNotificationById(id: string): Promise<TNotification | null> {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) return null;
    return {
      ...notification,
      metadata:
        notification.metadata === null
          ? undefined
          : (notification.metadata as Record<string, unknown>),
    };
  }
}
