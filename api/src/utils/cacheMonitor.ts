/**
 * Cache Monitoring Utility
 * Tracks cache hit rates, memory usage, and performance metrics
 * Useful for staging environment testing and optimization
 */

export interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number; // percentage
  averageResponseTime: number; // ms
  memoryUsage: {
    usedMemory: number; // bytes
    maxMemory: number; // bytes
    percentageUsed: number;
  };
  timestamp: Date;
}

export class CacheMonitor {
  private static instance: CacheMonitor;
  private metrics: CacheMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    averageResponseTime: 0,
    memoryUsage: {
      usedMemory: 0,
      maxMemory: 0,
      percentageUsed: 0,
    },
    timestamp: new Date(),
  };

  private responseTimes: number[] = [];
  private readonly maxSamples = 1000; // Keep last 1000 samples

  private constructor() {
    console.log("✅ Cache Monitor initialized");
  }

  public static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }

  /**
   * Record a cache hit
   */
  public recordHit(responseTimeMs: number): void {
    this.metrics.totalRequests++;
    this.metrics.cacheHits++;
    this.recordResponseTime(responseTimeMs);
    this.updateHitRate();
  }

  /**
   * Record a cache miss
   */
  public recordMiss(responseTimeMs: number): void {
    this.metrics.totalRequests++;
    this.metrics.cacheMisses++;
    this.recordResponseTime(responseTimeMs);
    this.updateHitRate();
  }

  /**
   * Record response time
   */
  private recordResponseTime(timeMs: number): void {
    this.responseTimes.push(timeMs);

    // Keep array size manageable
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }

    // Update average
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.responseTimes.length;
  }

  /**
   * Update hit rate percentage
   */
  private updateHitRate(): void {
    if (this.metrics.totalRequests === 0) {
      this.metrics.hitRate = 0;
    } else {
      this.metrics.hitRate =
        (this.metrics.cacheHits / this.metrics.totalRequests) * 100;
    }
  }

  /**
   * Update Redis memory usage
   */
  public updateMemoryUsage(usedMemory: number, maxMemory: number): void {
    this.metrics.memoryUsage = {
      usedMemory,
      maxMemory,
      percentageUsed: (usedMemory / maxMemory) * 100,
    };
  }

  /**
   * Get current metrics
   */
  public getMetrics(): CacheMetrics {
    return {
      ...this.metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Get hit rate percentage
   */
  public getHitRate(): number {
    return this.metrics.hitRate;
  }

  /**
   * Get average response time
   */
  public getAverageResponseTime(): number {
    return this.metrics.averageResponseTime;
  }

  /**
   * Reset metrics (useful for periodic reporting)
   */
  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      memoryUsage: {
        usedMemory: 0,
        maxMemory: 0,
        percentageUsed: 0,
      },
      timestamp: new Date(),
    };
    this.responseTimes = [];
    console.log("📊 Cache metrics reset");
  }

  /**
   * Log metrics to console (for debugging)
   */
  public logMetrics(): void {
    const metrics = this.getMetrics();
    console.log("\n📊 ===== CACHE METRICS =====");
    console.log(`Total Requests: ${metrics.totalRequests}`);
    console.log(`Cache Hits: ${metrics.cacheHits}`);
    console.log(`Cache Misses: ${metrics.cacheMisses}`);
    console.log(`Hit Rate: ${metrics.hitRate.toFixed(2)}%`);
    console.log(
      `Avg Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`,
    );
    console.log(
      `Memory Usage: ${metrics.memoryUsage.percentageUsed.toFixed(2)}%`,
    );
    console.log(
      `Memory: ${metrics.memoryUsage.usedMemory}/${metrics.memoryUsage.maxMemory} bytes`,
    );
    console.log("===========================\n");
  }

  /**
   * Get metrics as JSON for API response
   */
  public getMetricsAsJSON(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
}
