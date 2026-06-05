import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second initial delay

export async function connectWithRetry(
  retries = MAX_RETRIES,
  attempt = 1,
): Promise<PrismaClient> {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    return prisma;
  } catch (error) {
    if (retries > 0) {
      // OPTIMIZATION: Exponential backoff with jitter
      // Retry delay = baseDelay * (2 ^ attemptNumber) + random jitter
      // Attempt 1: ~1000ms, Attempt 2: ~2000ms, Attempt 3: ~4000ms
      const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 100; // Add random 0-100ms jitter
      const totalDelay = exponentialDelay + jitter;

      console.log(
        `🔄 Database connection failed. Retrying in ${totalDelay.toFixed(0)}ms... (${retries} attempts left)`,
      );
      await new Promise((res) => setTimeout(res, totalDelay));
      return connectWithRetry(retries - 1, attempt + 1);
    }
    console.error(
      "❌ Failed to connect to database after multiple attempts:",
      error,
    );
    throw error;
  }
}

export { prisma };
