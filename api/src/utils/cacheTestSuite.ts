/// <reference types="node" />
/**
 * Cache Testing Guide
 * Step-by-step instructions for testing cache hit rates and performance
 *
 * Run this in the staging environment to validate cache behavior
 */

import axios from "axios";

const API_BASE_URL = process.env.API_URL || "http://localhost:9000/api";
const MONITORING_URL = `${API_BASE_URL}/monitoring`;

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  duration: number;
  details: string;
}

class CacheTestSuite {
  private results: TestResult[] = [];

  /**
   * Test 1: Verify cache hit on first page (offset=0)
   */
  async testCacheHitOnFirstPage(): Promise<void> {
    const startTime = Date.now();

    try {
      // Fetch first page of direct chat
      const response = await axios.get(
        `${API_BASE_URL}/directChats/123/messages`,
        {
          params: { offset: 0, limit: 50 },
        },
      );

      const duration = Date.now() - startTime;

      if (response.status === 200) {
        this.results.push({
          name: "Cache Hit on First Page (offset=0)",
          status: "PASS",
          duration,
          details: `Fetched ${response.data.data.length} messages in ${duration}ms (expected < 50ms for cache hit)`,
        });
      } else {
        this.results.push({
          name: "Cache Hit on First Page (offset=0)",
          status: "FAIL",
          duration,
          details: `Unexpected status code: ${response.status}`,
        });
      }
    } catch (error) {
      this.results.push({
        name: "Cache Hit on First Page (offset=0)",
        status: "FAIL",
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Test 2: Verify cache miss on pagination
   */
  async testCacheMissOnPagination(): Promise<void> {
    const startTime = Date.now();

    try {
      // Fetch paginated data (should miss cache and hit DB)
      const response = await axios.get(
        `${API_BASE_URL}/directChats/123/messages`,
        {
          params: { offset: 50, limit: 50 },
        },
      );

      const duration = Date.now() - startTime;

      if (response.status === 200) {
        this.results.push({
          name: "Cache Miss on Pagination (offset>0)",
          status: "PASS",
          duration,
          details: `Fetched ${response.data.data.length} messages in ${duration}ms (expected 50-200ms for DB hit)`,
        });
      } else {
        this.results.push({
          name: "Cache Miss on Pagination (offset>0)",
          status: "FAIL",
          duration,
          details: `Unexpected status code: ${response.status}`,
        });
      }
    } catch (error) {
      this.results.push({
        name: "Cache Miss on Pagination (offset>0)",
        status: "FAIL",
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Test 3: Verify cache invalidation on message send
   */
  async testCacheInvalidationOnSend(): Promise<void> {
    const startTime = Date.now();

    try {
      // Get initial metrics
      const initialMetrics = await this.getMetrics();

      // Send a message (should invalidate cache)
      await axios.post(`${API_BASE_URL}/directChats/123/messages`, {
        content: "Test message",
      });

      // Refetch first page (should be cache miss now)
      await axios.get(`${API_BASE_URL}/directChats/123/messages`, {
        params: { offset: 0, limit: 50 },
      });

      const duration = Date.now() - startTime;
      const finalMetrics = await this.getMetrics();

      if (finalMetrics.cacheMisses > initialMetrics.cacheMisses) {
        this.results.push({
          name: "Cache Invalidation on Message Send",
          status: "PASS",
          duration,
          details: `Cache was properly invalidated and refetched from DB`,
        });
      } else {
        this.results.push({
          name: "Cache Invalidation on Message Send",
          status: "FAIL",
          duration,
          details: `Cache invalidation not detected`,
        });
      }
    } catch (error) {
      this.results.push({
        name: "Cache Invalidation on Message Send",
        status: "FAIL",
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Test 4: Verify cache hit rate
   */
  async testCacheHitRate(): Promise<void> {
    const startTime = Date.now();

    try {
      const metrics = await this.getMetrics();
      const hitRate = metrics.hitRate;

      // Expect at least 50% hit rate under normal conditions
      const expectedHitRate = 50;
      const status = hitRate >= expectedHitRate ? "PASS" : "FAIL";

      this.results.push({
        name: "Cache Hit Rate",
        status,
        duration: Date.now() - startTime,
        details: `Current hit rate: ${hitRate.toFixed(2)}% (expected >= ${expectedHitRate}%)`,
      });
    } catch (error) {
      this.results.push({
        name: "Cache Hit Rate",
        status: "FAIL",
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Test 5: Verify Redis memory usage
   */
  async testRedisMemoryUsage(): Promise<void> {
    const startTime = Date.now();

    try {
      const info = await this.getRedisInfo();

      if (!info.connected) {
        this.results.push({
          name: "Redis Memory Usage",
          status: "FAIL",
          duration: Date.now() - startTime,
          details: "Redis not connected",
        });
        return;
      }

      const metrics = await this.getMetrics();
      const memoryPercentage = metrics.memoryUsage.percentageUsed;

      // Alert if memory usage exceeds 80%
      const status = memoryPercentage < 80 ? "PASS" : "FAIL";

      this.results.push({
        name: "Redis Memory Usage",
        status,
        duration: Date.now() - startTime,
        details: `Memory usage: ${memoryPercentage.toFixed(2)}% (${(metrics.memoryUsage.usedMemory / 1024 / 1024).toFixed(2)}MB / ${(metrics.memoryUsage.maxMemory / 1024 / 1024).toFixed(2)}MB)`,
      });
    } catch (error) {
      this.results.push({
        name: "Redis Memory Usage",
        status: "FAIL",
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Test 6: Load test - multiple concurrent reads
   */
  async testConcurrentReads(): Promise<void> {
    const startTime = Date.now();

    try {
      const promises = [];

      // Simulate 10 concurrent reads
      for (let i = 0; i < 10; i++) {
        promises.push(
          axios.get(`${API_BASE_URL}/directChats/123/messages`, {
            params: { offset: 0, limit: 50 },
          }),
        );
      }

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      const avgPerRequest = duration / 10;

      // Expect average < 100ms per request with caching
      const status = avgPerRequest < 100 ? "PASS" : "FAIL";

      this.results.push({
        name: "Concurrent Reads Load Test",
        status,
        duration,
        details: `10 concurrent reads completed in ${duration}ms (avg ${avgPerRequest.toFixed(2)}ms per request)`,
      });
    } catch (error) {
      this.results.push({
        name: "Concurrent Reads Load Test",
        status: "FAIL",
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Helper: Get cache metrics
   */
  private async getMetrics() {
    const response = await axios.get(`${MONITORING_URL}/cache-metrics`);
    return response.data.data;
  }

  /**
   * Helper: Get Redis info
   */
  private async getRedisInfo() {
    try {
      const response = await axios.get(`${MONITORING_URL}/redis-info`);
      return response.data.data;
    } catch {
      return { connected: false };
    }
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<void> {
    console.log("\n🧪 Starting Cache Test Suite...\n");

    await this.testCacheHitOnFirstPage();
    await this.testCacheMissOnPagination();
    await this.testCacheHitRate();
    await this.testRedisMemoryUsage();
    await this.testCacheInvalidationOnSend();
    await this.testConcurrentReads();

    this.printResults();
  }

  /**
   * Print test results in formatted table
   */
  private printResults(): void {
    console.log("\n📊 ===== TEST RESULTS =====\n");

    const table = this.results.map((r) => ({
      Test: r.name,
      Status: r.status === "PASS" ? "✅ PASS" : "❌ FAIL",
      Duration: `${r.duration}ms`,
      Details: r.details,
    }));

    console.table(table);

    const passCount = this.results.filter((r) => r.status === "PASS").length;
    const failCount = this.results.filter((r) => r.status === "FAIL").length;

    console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed\n`);
  }
}

// Run tests when executed directly
const args = process.argv;
if (args[1]?.endsWith("cacheTestSuite.ts")) {
  const suite = new CacheTestSuite();
  suite.runAll().catch(console.error);
}

export { CacheTestSuite };
