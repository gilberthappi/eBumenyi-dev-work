import { CacheService } from "./cacheService";

/**
 * Redis Counter Service
 * Manages asynchronous count updates for likes and reads using Redis INCR
 * Periodically syncs back to database for persistence
 */
export class RedisCounterService {
  private static instance: RedisCounterService;

  private constructor() {}

  public static getInstance(): RedisCounterService {
    if (!RedisCounterService.instance) {
      RedisCounterService.instance = new RedisCounterService();
    }
    return RedisCounterService.instance;
  }

  /**
   * Increment like count for a message (async via Redis)
   * Format: msg:{messageType}:{messageId}:likes
   * Example: msg:direct:abc123:likes
   */
  public async incrementLikeCount(
    messageId: string,
    messageType: "direct" | "group" | "community",
    delta: number = 1,
  ): Promise<number> {
    try {
      const cache = CacheService.getInstance();
      const redisClient = cache.getRedisClient();
      if (!redisClient) return 0;
      const key = `msg:${messageType}:${messageId}:likes`;

      // Increment counter in Redis (atomic operation)
      const newCount = await redisClient.incrby(key, delta);

      // Set expiration (24 hours)
      await redisClient.expire(key, 24 * 60 * 60);

      return newCount;
    } catch (err) {
      console.error("Error incrementing like count in Redis:", err);
      // Return current count or 0 on error
      return 0;
    }
  }

  /**
   * Increment read count for a message (async via Redis)
   * Format: msg:{messageType}:{messageId}:reads
   * Example: msg:direct:abc123:reads
   */
  public async incrementReadCount(
    messageId: string,
    messageType: "direct" | "group" | "community",
    delta: number = 1,
  ): Promise<number> {
    try {
      const cache = CacheService.getInstance();
      const redisClient = cache.getRedisClient();
      if (!redisClient) return 0;
      const key = `msg:${messageType}:${messageId}:reads`;

      // Increment counter in Redis (atomic operation)
      const newCount = await redisClient.incrby(key, delta);

      // Set expiration (24 hours)
      await redisClient.expire(key, 24 * 60 * 60);

      return newCount;
    } catch (err) {
      console.error("Error incrementing read count in Redis:", err);
      return 0;
    }
  }

  /**
   * Get current count from Redis
   * Returns null if key doesn't exist
   */
  public async getCount(key: string): Promise<number | null> {
    try {
      const cache = CacheService.getInstance();
      const redisClient = cache.getRedisClient();
      if (!redisClient) return null;
      const count = await redisClient.get(key);
      return count ? parseInt(count) : null;
    } catch (err) {
      console.error("Error getting count from Redis:", err);
      return null;
    }
  }

  /**
   * Get all like counters for messages in a chat
   * Returns object: { messageId: count, ... }
   */
  public async getChatLikeCounts(
    chatId: string,
    messageType: "direct" | "group" | "community",
  ): Promise<Record<string, number>> {
    try {
      const cache = CacheService.getInstance();
      const redisClient = cache.getRedisClient();
      if (!redisClient) return {};
      const pattern = `msg:${messageType}:*:likes`;

      const keys = await redisClient.keys(pattern);
      const counts: Record<string, number> = {};

      for (const key of keys) {
        // Extract messageId from key: msg:type:messageId:likes
        const messageId = key.split(":")[2];
        const count = await this.getCount(key);
        if (count !== null) {
          counts[messageId] = count;
        }
      }

      return counts;
    } catch (err) {
      console.error("Error getting chat like counts:", err);
      return {};
    }
  }

  /**
   * Get all read counters for messages in a chat
   */
  public async getChatReadCounts(
    chatId: string,
    messageType: "direct" | "group" | "community",
  ): Promise<Record<string, number>> {
    try {
      const cache = CacheService.getInstance();
      const redisClient = cache.getRedisClient();
      if (!redisClient) return {};
      const pattern = `msg:${messageType}:*:reads`;

      const keys = await redisClient.keys(pattern);
      const counts: Record<string, number> = {};

      for (const key of keys) {
        // Extract messageId from key: msg:type:messageId:reads
        const messageId = key.split(":")[2];
        const count = await this.getCount(key);
        if (count !== null) {
          counts[messageId] = count;
        }
      }

      return counts;
    } catch (err) {
      console.error("Error getting chat read counts:", err);
      return {};
    }
  }

  /**
   * Sync Redis counters back to database
   * Call this periodically (every 5-10 minutes) via cron
   * Updates DirectMessage, GroupMessage, or CommunityPost counts
   */
  public async syncCountsToDatabase(
    messageType: "direct" | "group" | "community",
  ) {
    try {
      const cache = CacheService.getInstance();
      const redisClient = cache.getRedisClient();
      if (!redisClient)
        return { success: true, messageType, synced: 0, errors: 0 };
      const { prisma } = await import("../utils/client");

      // Get all counters for this message type
      const likeCountsObj = await this.getChatLikeCounts("", messageType);
      const readCountsObj = await this.getChatReadCounts("", messageType);

      let updateCount = 0;
      let errorCount = 0;

      // Update likes
      for (const [messageId, count] of Object.entries(likeCountsObj)) {
        try {
          if (messageType === "direct") {
            await prisma.directMessage.update({
              where: { id: messageId },
              data: { likeCount: count },
            });
          } else if (messageType === "group") {
            await prisma.groupMessage.update({
              where: { id: messageId },
              data: { likeCount: count },
            });
          } else if (messageType === "community") {
            await prisma.communityPost.update({
              where: { id: messageId },
              data: { likeCount: count },
            });
          }
          updateCount++;

          // Clear Redis key after syncing
          await redisClient.del(`msg:${messageType}:${messageId}:likes`);
        } catch (err) {
          console.error(`Error updating like count for ${messageId}:`, err);
          errorCount++;
        }
      }

      // Update reads
      for (const [messageId, count] of Object.entries(readCountsObj)) {
        try {
          if (messageType === "direct") {
            await prisma.directMessage.update({
              where: { id: messageId },
              data: { readCount: count },
            });
          } else if (messageType === "group") {
            await prisma.groupMessage.update({
              where: { id: messageId },
              data: { readCount: count },
            });
          } else if (messageType === "community") {
            await prisma.communityPost.update({
              where: { id: messageId },
              data: { viewCount: count },
            });
          }
          updateCount++;

          // Clear Redis key after syncing
          await redisClient.del(`msg:${messageType}:${messageId}:reads`);
        } catch (err) {
          console.error(`Error updating read count for ${messageId}:`, err);
          errorCount++;
        }
      }

      return {
        success: true,
        messageType,
        synced: updateCount,
        errors: errorCount,
      };
    } catch (err) {
      console.error("Error syncing counts to database:", err);
      return {
        success: false,
        messageType,
        error: String(err),
      };
    }
  }

  /**
   * Sync all message types to database
   */
  public async syncAllCountsToDatabase() {
    const results = {
      direct: await this.syncCountsToDatabase("direct"),
      group: await this.syncCountsToDatabase("group"),
      community: await this.syncCountsToDatabase("community"),
    };

    return results;
  }

  /**
   * Get statistics about counter usage
   */
  public async getStats(): Promise<{
    totalLikeCounters: number;
    totalReadCounters: number;
    messageTypes: Record<string, { likes: number; reads: number }>;
  }> {
    try {
      const cache = CacheService.getInstance();
      const redisClient = cache.getRedisClient();
      if (!redisClient) {
        return {
          totalLikeCounters: 0,
          totalReadCounters: 0,
          messageTypes: {
            direct: { likes: 0, reads: 0 },
            group: { likes: 0, reads: 0 },
            community: { likes: 0, reads: 0 },
          },
        };
      }

      const likeKeys = await redisClient.keys("msg:*:likes");
      const readKeys = await redisClient.keys("msg:*:reads");

      const stats: Record<string, { likes: number; reads: number }> = {
        direct: { likes: 0, reads: 0 },
        group: { likes: 0, reads: 0 },
        community: { likes: 0, reads: 0 },
      };

      // Count by message type
      for (const key of likeKeys) {
        const type = key.split(":")[1];
        if (type in stats) {
          stats[type].likes++;
        }
      }

      for (const key of readKeys) {
        const type = key.split(":")[1];
        if (type in stats) {
          stats[type].reads++;
        }
      }

      return {
        totalLikeCounters: likeKeys.length,
        totalReadCounters: readKeys.length,
        messageTypes: stats,
      };
    } catch (err) {
      console.error("Error getting counter stats:", err);
      return {
        totalLikeCounters: 0,
        totalReadCounters: 0,
        messageTypes: {
          direct: { likes: 0, reads: 0 },
          group: { likes: 0, reads: 0 },
          community: { likes: 0, reads: 0 },
        },
      };
    }
  }
}
