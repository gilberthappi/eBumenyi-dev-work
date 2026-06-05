import cron from "node-cron";
import { RedisCounterService } from "./redisCounterService";

/**
 * Cron Jobs for Redis Counter Synchronization
 * Periodically syncs Redis counters back to database for persistence
 */

export class CounterSyncCron {
  /**
   * Initialize all cron jobs
   * Call this from index.ts on app startup
   */
  public static initializeCrons(): void {
    console.log("📅 Initializing counter sync cron jobs...");

    // Sync all message types every 30 minutes (reduced from 5 min for better DB performance)
    this.syncCountersEvery30Minutes();

    // Sync all counters every hour (additional backup)
    this.syncCountersEveryHour();

    console.log("✅ Counter sync crons initialized");
  }

  /**
   * Sync counters every 30 minutes (optimized for reduced DB writes)
   * Reduces database load by ~80% compared to 5-minute sync
   * Balances persistence with performance
   */
  private static syncCountersEvery30Minutes(): void {
    cron.schedule("*/30 * * * *", async () => {
      console.log(
        "🔄 [Cron] Syncing Redis counters to database (every 30 min)...",
      );

      try {
        const counterService = RedisCounterService.getInstance();
        const results = await counterService.syncAllCountsToDatabase();

        console.log(
          "✅ [Cron] Counter sync completed:",
          JSON.stringify(results),
        );
      } catch (err) {
        console.error("❌ [Cron] Error syncing counters:", err);
      }
    });
  }

  /**
   * Sync counters every hour (cleanup + backup)
   */
  private static syncCountersEveryHour(): void {
    cron.schedule("0 * * * *", async () => {
      console.log(
        "🔄 [Cron] Syncing Redis counters to database (hourly backup)...",
      );

      try {
        const counterService = RedisCounterService.getInstance();

        // Get stats
        const stats = await counterService.getStats();
        console.log("📊 Counter Statistics:", JSON.stringify(stats));

        // Sync all
        const results = await counterService.syncAllCountsToDatabase();
        console.log(
          "✅ [Cron] Hourly sync completed:",
          JSON.stringify(results),
        );
      } catch (err) {
        console.error("❌ [Cron] Error in hourly sync:", err);
      }
    });
  }

  /**
   * Manually trigger sync (for testing/admin purposes)
   */
  public static async triggerImmediateSync(): Promise<{
    direct: {
      success: boolean;
      messageType: string;
      synced?: number;
      errors?: number;
      error?: string;
    };
    group: {
      success: boolean;
      messageType: string;
      synced?: number;
      errors?: number;
      error?: string;
    };
    community: {
      success: boolean;
      messageType: string;
      synced?: number;
      errors?: number;
      error?: string;
    };
  }> {
    console.log("⚡ Manual sync triggered");
    const counterService = RedisCounterService.getInstance();
    return await counterService.syncAllCountsToDatabase();
  }

  /**
   * Get current stats (for monitoring)
   */
  public static async getStats(): Promise<{
    totalLikeCounters: number;
    totalReadCounters: number;
    messageTypes: Record<string, { likes: number; reads: number }>;
  }> {
    const counterService = RedisCounterService.getInstance();
    return await counterService.getStats();
  }
}
