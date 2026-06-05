import cron from "node-cron";
import { prisma } from "../utils/client";
import AppError from "../utils/error";
import { normalizeRwandaPhone } from "../utils/normalizeRwandaPhone";
import { WeltelService } from "./weltelService";

export type WeltelBackfillResult = {
  message: string;
  statusCode: number;
  data: {
    total: number;
    linked: number;
    failed: number;
    skipped: number;
    alreadyRunning?: boolean;
    errors: Array<{ userId: string; fullNames: string; error: string }>;
  };
};

let backfillInProgress = false;

export class WeltelBackfillService {
  public static initializeCron(): void {
    if (!WeltelService.isConfigured()) {
      console.log(
        "ℹ️  WelTel backfill cron disabled (WELTEL_* env not configured)",
      );
      return;
    }

    cron.schedule(
      "0 6 * * *",
      async () => {
        console.log(
          "\n[WELTEL BACKFILL] Running scheduled sync (06:00 Africa/Kigali)...",
        );
        try {
          const result = await WeltelBackfillService.backfillUnlinkedUsers();
          console.log(
            "[WELTEL BACKFILL] Completed:",
            JSON.stringify(result.data),
          );
        } catch (err) {
          console.error("[WELTEL BACKFILL] Scheduled run failed:", err);
        }
      },
      { timezone: "Africa/Kigali" },
    );

    console.log(
      "✅ WelTel backfill cron scheduled daily at 06:00 Africa/Kigali",
    );
  }

  public static async backfillUnlinkedUsers(): Promise<WeltelBackfillResult> {
    if (!WeltelService.isConfigured()) {
      throw new AppError(
        "WelTel is not configured (WELTEL_API_BASE_URL, WELTEL_USERNAME, WELTEL_PASSWORD)",
        503,
      );
    }

    if (backfillInProgress) {
      return {
        message: "WelTel backfill is already running",
        statusCode: 409,
        data: {
          total: 0,
          linked: 0,
          failed: 0,
          skipped: 0,
          alreadyRunning: true,
          errors: [],
        },
      };
    }

    backfillInProgress = true;

    const errors: WeltelBackfillResult["data"]["errors"] = [];
    let linked = 0;
    let failed = 0;
    let skipped = 0;

    try {
      const users = await prisma.user.findMany({
        where: { weltelUserId: null },
        select: {
          id: true,
          fullNames: true,
          phoneNumber: true,
          email: true,
        },
        orderBy: { createdAt: "asc" },
      });

      for (const user of users) {
        if (!user.fullNames?.trim() || !user.phoneNumber?.trim()) {
          skipped++;
          errors.push({
            userId: user.id,
            fullNames: user.fullNames ?? "",
            error: "Missing fullNames or phoneNumber",
          });
          continue;
        }

        try {
          const phone = normalizeRwandaPhone(user.phoneNumber);
          const email =
            user.email ?? (await WeltelService.generateUniqueYopmailEmail());

          const weltel = await WeltelService.provisionHealthcareProvider({
            name: user.fullNames,
            phone,
            email,
          });

          const taken = await prisma.user.findFirst({
            where: {
              weltelUserId: weltel.weltelUserId,
              id: { not: user.id },
            },
          });
          if (taken) {
            failed++;
            errors.push({
              userId: user.id,
              fullNames: user.fullNames,
              error: `WelTel user id ${weltel.weltelUserId} already linked to another account`,
            });
            continue;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              weltelUserId: weltel.weltelUserId,
              phoneNumber: phone,
              ...(!user.email ? { email: weltel.email } : {}),
            },
          });

          linked++;
        } catch (err) {
          failed++;
          const message =
            err instanceof AppError
              ? err.message
              : err instanceof Error
                ? err.message
                : String(err);
          errors.push({
            userId: user.id,
            fullNames: user.fullNames,
            error: message,
          });
        }
      }

      return {
        message: "WelTel backfill completed",
        statusCode: 200,
        data: {
          total: users.length,
          linked,
          failed,
          skipped,
          errors,
        },
      };
    } finally {
      backfillInProgress = false;
    }
  }
}
