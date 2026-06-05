/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response, NextFunction } from "express";

/**
 * Request-scoped cache to store expensive lookups during request lifecycle
 * Usage: Cached values persist for the duration of a single HTTP request
 * Prevents N+1 queries for frequently accessed data like student lookups
 */

declare module "express" {
  interface Request {
    cache?: Record<string, any>;
  }
}

/**
 * Initialize request cache middleware
 * Must be placed early in middleware chain to ensure cache exists on all routes
 */
export const initializeRequestCache = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.cache) {
    req.cache = {};
  }
  next();
};

/**
 * Get cached value or execute async function to populate cache
 * @param req Express request object
 * @param key Cache key
 * @param fetchFn Async function to fetch data if not cached
 * @returns Cached or fetched value
 */
export async function getCachedOrFetch<T>(
  req: Request,
  key: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  // Initialize cache if it doesn't exist
  if (!req.cache) {
    req.cache = {};
  }

  // Return cached value if it exists
  if (req.cache[key] !== undefined) {
    return req.cache[key] as T;
  }

  // Fetch and cache the value
  const value = await fetchFn();
  req.cache[key] = value;
  return value;
}

/**
 * Set cache value directly
 * @param req Express request object
 * @param key Cache key
 * @param value Value to cache
 */
export function setCacheValue(req: Request, key: string, value: any): void {
  if (!req.cache) {
    req.cache = {};
  }
  req.cache[key] = value;
}

/**
 * Get cache value without fetching
 * @param req Express request object
 * @param key Cache key
 * @returns Cached value or undefined
 */
export function getCacheValue<T>(req: Request, key: string): T | undefined {
  return req.cache?.[key] as T | undefined;
}

/**
 * Clear specific cache entry
 * @param req Express request object
 * @param key Cache key to clear
 */
export function clearCacheEntry(req: Request, key: string): void {
  if (req.cache) {
    delete req.cache[key];
  }
}

/**
 * Clear entire request cache
 * @param req Express request object
 */
export function clearCache(req: Request): void {
  req.cache = {};
}
