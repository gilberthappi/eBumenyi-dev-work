/**
 * Monitoring Controller
 * Exposes metrics endpoints for cache and system monitoring
 */

import { Router, Request, Response } from "express";
import CacheService from "../services/cacheService";
import { CacheMonitor } from "../utils/cacheMonitor";
import { CounterSyncCron } from "../services/counterSyncCron";
import { RedisCounterService } from "../services/redisCounterService";

const router = Router();

/**
 * GET /api/monitoring/cache-metrics
 * Returns cache hit rates and performance metrics
 */
router.get("/cache-metrics", async (req: Request, res: Response) => {
  try {
    const metrics = CacheMonitor.getInstance().getMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching cache metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cache metrics",
    });
  }
});

/**
 * GET /api/monitoring/redis-info
 * Returns Redis server info including memory usage
 */
router.get("/redis-info", async (req: Request, res: Response) => {
  try {
    const stats = await CacheService.getStats();

    if (!stats.connected) {
      return res.status(503).json({
        success: false,
        error: "Redis not connected",
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching Redis info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch Redis info",
    });
  }
});

/**
 * GET /api/monitoring/health
 * Returns overall system health including cache status
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    const cacheMetrics = CacheMonitor.getInstance().getMetrics();
    const redisStats = await CacheService.getStats();

    res.json({
      success: true,
      data: {
        timestamp: new Date(),
        cache: {
          connected: redisStats.connected,
          hitRate: `${cacheMetrics.hitRate.toFixed(2)}%`,
          totalRequests: cacheMetrics.totalRequests,
          averageResponseTime: `${cacheMetrics.averageResponseTime.toFixed(2)}ms`,
        },
        redis: {
          connected: redisStats.connected,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching health status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch health status",
    });
  }
});

/**
 * POST /api/monitoring/reset-metrics
 * Resets cache metrics (admin only)
 */
router.post("/reset-metrics", async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check
    CacheMonitor.getInstance().resetMetrics();

    res.json({
      success: true,
      message: "Cache metrics reset successfully",
    });
  } catch (error) {
    console.error("Error resetting metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset metrics",
    });
  }
});

/**
 * GET /api/monitoring/counter-stats
 * Returns Redis counter statistics (likes, reads tracking)
 */
router.get("/counter-stats", async (req: Request, res: Response) => {
  try {
    const counterService = RedisCounterService.getInstance();
    const stats = await counterService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching counter stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch counter stats",
    });
  }
});

/**
 * POST /api/monitoring/sync-counters
 * Manually trigger Redis counter sync to database (admin only)
 */
router.post("/sync-counters", async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check
    const results = await CounterSyncCron.triggerImmediateSync();

    res.json({
      success: true,
      message: "Counter sync triggered successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error syncing counters:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync counters",
    });
  }
});

export default router;
