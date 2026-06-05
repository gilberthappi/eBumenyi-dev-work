/**
 * Calendar Reminder Scheduler
 *
 * Architecture:
 * - 1-minute polling cron: Reliable reminder delivery (works on all databases)
 * - Deduplication: FiredReminder table (unique per event/user/fireAt/offset)
 *   coordinates all replicas — only the first insert sends notify + push
 *
 * Performance:
 * - Requires database index: calendarEvent(startAt, reminderMinutesBefore)
 * - Queries only 24-hour window to limit database load
 * - Fetches only necessary fields via Prisma select
 */

import { Prisma } from "@prisma/client";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "../utils/client";
import { NotificationService } from "./NotificationService";
import { pushService } from "./pushService";
import {
  CalendarEventType,
  MeetingType,
  EventPriority,
} from "../utils/interfaces/common";
import cron from "node-cron";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** How far back (ms) a due fireAt may still be picked up by the cron tick. */
const DUE_LOOKBACK_MS = 90_000;

export class ReminderScheduler {
  private static io: SocketIOServer | null = null;
  private static cronJob: any = null;
  private static isRunning = false;

  static start(io: SocketIOServer): void {
    this.io = io;

    if (this.cronJob || this.isRunning) {
      console.log(
        "📅 [ReminderScheduler] Cron already running — skipping duplicate start",
      );
      return;
    }
    this.isRunning = true;

    console.log("📅 Initializing calendar reminder scheduler...");
    this.start1MinuteCron();
    console.log(
      "✅ Calendar reminder scheduler initialized (1-min cron polling)",
    );
  }

  private static start1MinuteCron(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("⏰ [ReminderScheduler] Stopped existing cron before restart");
    }

    this.cronJob = cron.schedule("* * * * *", async () => {
      await this.checkDueReminders();
    });
    console.log("⏰ 1-minute reminder cron started");
  }

  /**
   * Find events with a reminder fire time in (now - 90s, now].
   * FiredReminder ensures only one delivery per user across replicas and cron ticks.
   */
  private static async checkDueReminders(): Promise<void> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - DUE_LOOKBACK_MS);

      const events = await prisma.calendarEvent.findMany({
        where: {
          startAt: {
            gt: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
          reminderMinutesBefore: { isEmpty: false },
        },
        select: {
          id: true,
          title: true,
          startAt: true,
          reminderMinutesBefore: true,
          type: true,
          meetingType: true,
          priority: true,
          location: true,
          timezone: true,
          createdById: true,
          participants: { select: { userId: true } },
          createdBy: { select: { id: true, fullNames: true } },
        },
      });

      for (const event of events) {
        for (const minutes of event.reminderMinutesBefore) {
          const fireAt = new Date(
            event.startAt.getTime() - minutes * 60 * 1000,
          );

          if (fireAt > windowStart && fireAt <= now) {
            console.log(
              `[ReminderScheduler] Due reminder: "${event.title}" (${minutes}min before) fires at ${fireAt.toISOString()}`,
            );
            await this.fireReminderForEvent(event, minutes, fireAt);
          }
        }
      }
    } catch (error) {
      console.error("[ReminderScheduler] Error in checkDueReminders:", error);
    }
  }

  /**
   * Atomically claim this reminder for a user. Returns true only for the
   * first successful insert (across all API replicas and cron ticks).
   */
  private static async claimReminderDelivery(
    eventId: string,
    userId: string,
    fireAt: Date,
    minutesBefore: number,
  ): Promise<boolean> {
    try {
      await prisma.firedReminder.create({
        data: {
          eventId,
          userId,
          fireAt,
          minutesBefore,
        },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return false;
      }
      throw error;
    }
  }

  private static async fireReminderForEvent(
    event: any,
    minutesBefore: number,
    fireAt: Date,
  ): Promise<void> {
    if (!this.io) {
      console.error("[ReminderScheduler] Socket.IO not initialized");
      return;
    }

    const notificationTitle = "Ukwibutsa";
    const notificationBody = `Igikorwa «${event.title}» gitangira mu minota ${minutesBefore}.`;

    const metadata = {
      eventType: event.type as CalendarEventType,
      meetingType: event.meetingType as MeetingType | null,
      startTime: event.startAt,
      location: event.location,
      priority: event.priority as EventPriority,
      reminderOffsetMinutes: minutesBefore,
      timezone: event.timezone,
    } as Record<string, unknown>;

    const recipientIds = new Set<string>();
    recipientIds.add(event.createdById);
    for (const p of event.participants) {
      recipientIds.add(p.userId);
    }

    // Dedup key includes offset so 45/30/15 min reminders never collide
    const dedupEntityId = `${event.id}:${minutesBefore}`;

    for (const userId of recipientIds) {
      try {
        const claimed = await this.claimReminderDelivery(
          event.id,
          userId,
          fireAt,
          minutesBefore,
        );
        if (!claimed) {
          continue;
        }

        const notification = await NotificationService.createNotification(
          userId,
          notificationTitle,
          notificationBody,
          "warning",
          `/calendar/${event.id}`,
          "calendar_reminder",
          dedupEntityId,
          metadata,
          { dedupAt: fireAt },
        );

        const userRoom = `user:${userId}`;

        this.io.to(userRoom).emit("notification", {
          id: notification.id,
          title: notificationTitle,
          message: notificationBody,
          type: "warning",
          entityType: "calendar_reminder",
          entityId: event.id,
          actionUrl: `/calendar/${event.id}`,
          isRead: false,
          createdAt: notification.createdAt,
        });

        const unreadCount = await NotificationService.getUnreadCount(userId);
        this.io.to(userRoom).emit("unread_count_updated", { unreadCount });

        await pushService.sendToUser(userId, {
          title: notificationTitle,
          body: notificationBody,
          type: "calendar_reminder",
          entityId: event.id,
          deepLink: `/calendar/${event.id}`,
          data: {
            eventType: event.type,
            startTime: event.startAt.toISOString(),
            reminderOffsetMinutes: String(minutesBefore),
          },
        });

        console.log(
          `[ReminderScheduler] Notified user ${userId} for event: "${event.title}" (${minutesBefore}min)`,
        );
      } catch (err) {
        console.error(
          `[ReminderScheduler] Error notifying user ${userId}:`,
          err,
        );
      }
    }
  }

  static async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      console.log("🛑 Reminder cron stopped");
    }
  }

  static async initializeOnStartup(): Promise<void> {
    console.log(
      "[ReminderScheduler] initializeOnStartup() — 1-min cron handles all delivery",
    );
  }
}
