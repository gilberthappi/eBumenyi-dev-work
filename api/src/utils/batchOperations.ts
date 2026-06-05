/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Batch Operations Utility for handling large data operations
 * Helps manage transaction timeouts and large payload handling
 */

import { Prisma } from "@prisma/client";

export interface BatchOperationOptions {
  batchSize?: number;
  delayBetweenBatches?: number; // ms delay between batches to prevent timeout
  maxRetries?: number;
  timeoutPerBatch?: number; // ms timeout per batch operation
}

export interface BatchOperationResult<T> {
  successful: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  data?: T[];
}

/**
 * Execute operations in batches with error handling
 * Useful for large arrays of operations that might exceed transaction timeout
 */
export class BatchOperationExecutor {
  private static readonly DEFAULT_BATCH_SIZE = 50;
  private static readonly DEFAULT_DELAY = 100; // 100ms between batches
  private static readonly DEFAULT_MAX_RETRIES = 2;

  /**
   * Execute callback function for each batch of items
   * Includes automatic retries and error collection
   */
  public static async executeBatches<T, R>(
    items: T[],
    callback: (batch: T[], batchIndex: number) => Promise<R[]>,
    options?: BatchOperationOptions,
  ): Promise<BatchOperationResult<R>> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      delayBetweenBatches = this.DEFAULT_DELAY,
      maxRetries = this.DEFAULT_MAX_RETRIES,
    } = options || {};

    const result: BatchOperationResult<R> = {
      successful: 0,
      failed: 0,
      errors: [],
      data: [],
    };

    const totalBatches = Math.ceil(items.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, items.length);
      const batch = items.slice(startIdx, endIdx);

      let retries = 0;
      let batchSuccessful = false;

      while (retries <= maxRetries && !batchSuccessful) {
        try {
          const batchResult = await callback(batch, batchIndex);
          result.successful += batch.length;
          result.data?.push(...batchResult);
          batchSuccessful = true;
        } catch (error) {
          retries++;

          if (retries > maxRetries) {
            result.failed += batch.length;
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            // Track individual item failures
            for (let i = 0; i < batch.length; i++) {
              result.errors.push({
                index: startIdx + i,
                error: `${errorMessage} (Attempt ${retries}/${maxRetries + 1})`,
              });
            }
          } else {
            // Retry with exponential backoff
            const backoffDelay = delayBetweenBatches * Math.pow(2, retries - 1);
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          }
        }
      }

      // Delay between batches to prevent timeout
      if (batchIndex < totalBatches - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenBatches),
        );
      }
    }

    return result;
  }

  /**
   * Execute transaction-based batch operations with timeout handling
   * Breaks large operations into smaller transaction chunks
   */
  public static async executeInChunkedTransactions<T>(
    items: T[],
    callback: (
      tx: Prisma.TransactionClient,
      batch: T[],
      batchIndex: number,
    ) => Promise<void>,
    prismaClient: any,
    options?: BatchOperationOptions & { transactionTimeout?: number },
  ): Promise<BatchOperationResult<void>> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      delayBetweenBatches = this.DEFAULT_DELAY,
      maxRetries = this.DEFAULT_MAX_RETRIES,
      transactionTimeout = 120000, // 2 minutes per transaction
    } = options || {};

    const result: BatchOperationResult<void> = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    const totalBatches = Math.ceil(items.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, items.length);
      const batch = items.slice(startIdx, endIdx);

      let retries = 0;
      let batchSuccessful = false;

      while (retries <= maxRetries && !batchSuccessful) {
        try {
          await prismaClient.$transaction(
            async (tx: any) => {
              await callback(tx, batch, batchIndex);
            },
            {
              timeout: transactionTimeout,
              maxWait: 30000, // 30 seconds max wait
            },
          );

          result.successful += batch.length;
          batchSuccessful = true;
        } catch (error) {
          retries++;

          if (retries > maxRetries) {
            result.failed += batch.length;
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            // Track individual item failures
            for (let i = 0; i < batch.length; i++) {
              result.errors.push({
                index: startIdx + i,
                error: `${errorMessage} (Transaction failed after ${retries}/${maxRetries + 1} attempts)`,
              });
            }
          } else {
            // Retry with exponential backoff
            const backoffDelay = delayBetweenBatches * Math.pow(2, retries - 1);
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          }
        }
      }

      // Delay between batches
      if (batchIndex < totalBatches - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenBatches),
        );
      }
    }

    return result;
  }

  /**
   * Stream-like processing of large arrays to manage memory
   * Processes items one batch at a time without holding all results in memory
   */
  public static async processInBatches<T, R>(
    items: T[],
    callback: (batch: T[], batchIndex: number) => Promise<R>,
    options?: BatchOperationOptions,
  ): Promise<R[]> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      delayBetweenBatches = this.DEFAULT_DELAY,
    } = options || {};

    const results: R[] = [];
    const totalBatches = Math.ceil(items.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, items.length);
      const batch = items.slice(startIdx, endIdx);

      try {
        const result = await callback(batch, batchIndex);
        results.push(result);
      } catch (error) {
        throw new Error(
          `Batch ${batchIndex} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Delay between batches
      if (batchIndex < totalBatches - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenBatches),
        );
      }
    }

    return results;
  }
}

/**
 * Helper to calculate optimal batch size based on estimated item size
 * Prevents individual batches from being too large
 */
export function calculateOptimalBatchSize(
  totalItems: number,
  estimatedItemSizeKB: number = 50,
  maxBatchSizeKB: number = 1000,
): number {
  const optimalSize = Math.floor(maxBatchSizeKB / estimatedItemSizeKB);
  // Ensure batch size is at least 5 items but not more than total items
  return Math.max(5, Math.min(optimalSize, totalItems));
}
