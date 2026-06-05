/* eslint-disable @typescript-eslint/no-unused-vars */
import { Get, Route, Tags, Middlewares } from "tsoa";
import { CacheMonitor } from "../utils/cacheMonitor";
import { loggerMiddleware } from "../utils/loggers/loggingMiddleware";
import CacheService from "../services/cacheService";

@Tags("Cache Management")
@Route("/api/cache")
export class CacheController {
  /**
   * Get cache performance metrics
   * Shows hit rate, miss rate, average response times, memory usage
   */
  @Get("/stats")
  @Middlewares(loggerMiddleware)
  public async getCacheStats() {
    const metrics = CacheMonitor.getInstance().getMetrics();
    return {
      success: true,
      message: "Cache metrics retrieved",
      data: metrics,
    };
  }

  /**
   * Get Redis connection status
   */
  @Get("/status")
  @Middlewares(loggerMiddleware)
  public async getCacheStatus() {
    const stats = await CacheService.getStats();
    return {
      success: stats.connected,
      message: stats.connected ? "Redis connected" : "Redis disconnected",
      data: {
        connected: stats.connected,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    };
  }

  /**
   * Reset cache metrics
   * Useful for performance testing
   */
  @Get("/reset")
  @Middlewares(loggerMiddleware)
  public async resetMetrics() {
    CacheMonitor.getInstance().resetMetrics();
    return {
      success: true,
      message: "Cache metrics reset",
      data: CacheMonitor.getInstance().getMetrics(),
    };
  }
}
