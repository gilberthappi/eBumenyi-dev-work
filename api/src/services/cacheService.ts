/**
 * Redis Cache Service
 * Handles caching of messages using Redis sorted sets
 * Key pattern: chat:${chatId}:messages (sorted by timestamp)
 */

import redis, { Redis } from "ioredis";
import { CacheMonitor } from "../utils/cacheMonitor";

export interface CachedMessage {
  id: string;
  senderId: string;
  content: string;
  type: string;
  attachments?: string;
  readCount?: number;
  likeCount?: number;
  isDeleted?: boolean;
  editedAt?: string;
  timestamp: number;
}

export interface MessageCache {
  message: CachedMessage;
  timestamp: number;
}

export class CacheService {
  private static instance: CacheService;
  private redisClient: Redis | null = null;
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours
  private readonly MESSAGE_CACHE_SIZE = 200; // Keep last 200 messages in cache

  /**
   * Returns true only when Redis is explicitly configured via env vars.
   * This prevents the service from trying to connect to a hardcoded internal
   * IP that is only reachable inside the production network.
   */
  private static isRedisConfigured(): boolean {
    return (
      process.env.REDIS_ENABLED === "true" ||
      (!!process.env.REDIS_HOST && process.env.REDIS_HOST !== "10.10.119.36")
    );
  }

  private constructor() {
    if (!CacheService.isRedisConfigured()) {
      console.log(
        "ℹ️  Redis not configured — cache layer disabled (set REDIS_ENABLED=true to enable)",
      );
      return;
    }

    this.redisClient = new redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      db: parseInt(process.env.REDIS_DB || "0"),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USER || "default", // Support Railway's username
      // Stop retrying after a short backoff to avoid log spam
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 500, 2000);
      },
      reconnectOnError: (err) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      // Prevent pending commands from hanging forever when offline
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.redisClient.on("connect", () => {
      console.log("✅ Redis Cache Connected");
    });

    this.redisClient.on("error", (err) => {
      // Only log the first error to avoid flooding the console
      if (
        (err as NodeJS.ErrnoException).code === "ETIMEDOUT" ||
        (err as NodeJS.ErrnoException).code === "ECONNREFUSED"
      ) {
        console.warn(
          "⚠️  Redis unavailable — running without cache:",
          err.message,
        );
      } else {
        console.error("❌ Redis Cache Error:", err);
      }
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Whether Redis is currently available for use.
   */
  public isAvailable(): boolean {
    return this.redisClient !== null && this.redisClient.status === "ready";
  }

  /**
   * Add message to cache (sorted set by timestamp)
   * Called after message creation
   */
  async cacheMessage(
    chatId: string,
    message: CachedMessage & { createdAt?: Date },
    chatType: "direct" | "group" | "community",
  ): Promise<void> {
    if (!this.redisClient) return;
    try {
      const key = `chat:${chatType}:${chatId}:messages`;
      const serialized = JSON.stringify({
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        attachments: message.attachments,
        readCount: message.readCount || 0,
        likeCount: message.likeCount || 0,
        isDeleted: message.isDeleted || false,
        editedAt: message.editedAt,
        timestamp: message.timestamp || message.createdAt,
      });

      // Add to sorted set with score = timestamp
      const timestampValue =
        message.timestamp || message.createdAt || new Date();
      const timestamp = new Date(timestampValue).getTime();
      await this.redisClient.zadd(key, timestamp, serialized);

      // Trim to keep only last N messages
      const size = await this.redisClient.zcard(key);
      if (size > this.MESSAGE_CACHE_SIZE) {
        await this.redisClient.zremrangebyrank(
          key,
          0,
          size - this.MESSAGE_CACHE_SIZE - 1,
        );
      }

      // Set expiration
      await this.redisClient.expire(key, this.CACHE_TTL);
    } catch (error) {
      console.error("Cache error (cacheMessage):", error);
      // Don't throw - cache failures shouldn't break the app
    }
  }

  /**
   * Get messages from cache
   * Returns last N messages, ordered from oldest to newest
   * OPTIMIZED: Uses ZRANGE with negative indices instead of ZREVRANGE + reverse
   * Performance: O(N) with 1 operation instead of 2 operations
   */
  async getMessages(
    chatId: string,
    chatType: "direct" | "group" | "community",
    limit: number = 50,
  ): Promise<CachedMessage[] | null> {
    if (!this.redisClient) return null;
    const startTime = Date.now();

    try {
      const key = `chat:${chatType}:${chatId}:messages`;

      // Get last 'limit' messages using ZRANGE with negative indices
      // ZRANGE key -limit -1 = last 'limit' items (oldest to newest, no reverse needed)
      const cached = await this.redisClient.zrange(key, -limit, -1);

      if (!cached || cached.length === 0) {
        const responseTime = Date.now() - startTime;
        CacheMonitor.getInstance().recordMiss(responseTime);
        return null; // Not in cache, fetch from DB
      }

      const responseTime = Date.now() - startTime;
      CacheMonitor.getInstance().recordHit(responseTime);

      // No reverse needed - ZRANGE with negative indices already returns in ascending order
      return cached.map((item) => JSON.parse(item));
    } catch (error) {
      console.error("Cache error (getMessages):", error);
      const responseTime = Date.now() - startTime;
      CacheMonitor.getInstance().recordMiss(responseTime);
      return null; // Fall back to database
    }
  }

  /**
   * Get paginated messages from cache
   * Returns messages from offset with limit
   */
  async getPaginatedMessages(
    chatId: string,
    chatType: "direct" | "group" | "community",
    offset: number = 0,
    limit: number = 50,
  ): Promise<CachedMessage[] | null> {
    if (!this.redisClient) return null;
    try {
      const key = `chat:${chatType}:${chatId}:messages`;
      const totalCount = await this.redisClient.zcard(key);

      // If offset is beyond cache, return null to fetch from DB
      if (offset >= totalCount) {
        return null;
      }

      // Calculate reverse range
      const start = totalCount - offset - limit;
      const end = totalCount - offset - 1;

      if (start < 0) {
        // Partial result - some from cache, some from DB
        return null;
      }

      const cached = await this.redisClient.zrange(key, start, end);

      if (!cached || cached.length === 0) {
        return null;
      }

      return cached.map((item) => JSON.parse(item));
    } catch (error) {
      console.error("Cache error (getPaginatedMessages):", error);
      return null;
    }
  }

  /**
   * Update message in cache (edit/like/read)
   */
  async updateMessage(
    chatId: string,
    messageId: string,
    updates: Partial<CachedMessage>,
    chatType: "direct" | "group" | "community",
  ): Promise<void> {
    if (!this.redisClient) return;
    try {
      const key = `chat:${chatType}:${chatId}:messages`;

      // Get the message by scanning (since we don't have direct access by messageId)
      const all = await this.redisClient.zrange(key, 0, -1);

      for (let i = 0; i < all.length; i++) {
        const cached = JSON.parse(all[i]);

        if (cached.id === messageId) {
          // Update the message
          const updated = { ...cached, ...updates };
          const serialized = JSON.stringify(updated);

          // Remove old entry and add updated
          await this.redisClient.zrem(key, all[i]);
          const timestamp = updated.timestamp || new Date().getTime();
          await this.redisClient.zadd(key, timestamp, serialized);

          break;
        }
      }
    } catch (error) {
      console.error("Cache error (updateMessage):", error);
    }
  }

  /**
   * Delete message from cache (soft delete)
   */
  async deleteMessage(
    chatId: string,
    messageId: string,
    chatType: "direct" | "group" | "community",
  ): Promise<void> {
    if (!this.redisClient) return;
    try {
      const key = `chat:${chatType}:${chatId}:messages`;
      const all = await this.redisClient.zrange(key, 0, -1);

      for (const item of all) {
        const cached = JSON.parse(item);

        if (cached.id === messageId) {
          cached.isDeleted = true;
          const serialized = JSON.stringify(cached);

          // Remove old entry and add updated
          await this.redisClient.zrem(key, item);
          const timestamp = cached.timestamp || new Date().getTime();
          await this.redisClient.zadd(key, timestamp, serialized);

          break;
        }
      }
    } catch (error) {
      console.error("Cache error (deleteMessage):", error);
    }
  }

  /**
   * Increment like count for a message
   */
  async incrementLikeCount(
    chatId: string,
    messageId: string,
    delta: number = 1,
    chatType: "direct" | "group" | "community",
  ): Promise<void> {
    if (!this.redisClient) return;
    try {
      const key = `chat:${chatType}:${chatId}:messages`;
      const all = await this.redisClient.zrange(key, 0, -1);

      for (const item of all) {
        const cached = JSON.parse(item);

        if (cached.id === messageId) {
          cached.likeCount = (cached.likeCount || 0) + delta;
          const serialized = JSON.stringify(cached);

          await this.redisClient.zrem(key, item);
          const timestamp = cached.timestamp || new Date().getTime();
          await this.redisClient.zadd(key, timestamp, serialized);

          break;
        }
      }
    } catch (error) {
      console.error("Cache error (incrementLikeCount):", error);
    }
  }

  /**
   * Increment read count for a message
   */
  async incrementReadCount(
    chatId: string,
    messageId: string,
    delta: number = 1,
    chatType: "direct" | "group" | "community",
  ): Promise<void> {
    if (!this.redisClient) return;
    try {
      const key = `chat:${chatType}:${chatId}:messages`;
      const all = await this.redisClient.zrange(key, 0, -1);

      for (const item of all) {
        const cached = JSON.parse(item);

        if (cached.id === messageId) {
          cached.readCount = (cached.readCount || 0) + delta;
          const serialized = JSON.stringify(cached);

          await this.redisClient.zrem(key, item);
          const timestamp = cached.timestamp || new Date().getTime();
          await this.redisClient.zadd(key, timestamp, serialized);

          break;
        }
      }
    } catch (error) {
      console.error("Cache error (incrementReadCount):", error);
    }
  }

  /**
   * Clear all messages for a chat
   */
  async clearChat(
    chatId: string,
    chatType: "direct" | "group" | "community",
  ): Promise<void> {
    if (!this.redisClient) return;
    try {
      const key = `chat:${chatType}:${chatId}:messages`;
      await this.redisClient.del(key);
    } catch (error) {
      console.error("Cache error (clearChat):", error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    info: string;
    uptime: number;
  }> {
    if (!this.redisClient) {
      return { connected: false, info: "Redis disabled", uptime: 0 };
    }
    try {
      const info = await this.redisClient.info();
      return {
        connected: true,
        info,
        uptime: 0,
      };
    } catch (error) {
      return {
        connected: false,
        info: "Redis not connected",
        uptime: 0,
      };
    }
  }

  /**
   * Get Redis client instance for direct operations
   * Used by RedisCounterService for counter operations
   */
  public getRedisClient() {
    return this.redisClient; // May be null when Redis is disabled
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redisClient && this.redisClient.status !== "end") {
      await this.redisClient.quit();
    }
  }
}

export default CacheService.getInstance();
