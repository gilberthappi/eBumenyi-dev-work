/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Conditional Logger Utility
 * Enables/disables verbose logging based on DEBUG environment variable
 * Reduces console spam in production while maintaining debugging capability
 */

// @ts-ignore
// eslint-disable-next-line no-undef
const DEBUG_ENABLED =
  // @ts-ignore
  (typeof globalThis !== "undefined" && (globalThis as any).DEBUG === "true") ||
  false;

export class Logger {
  /**
   * Log if DEBUG is enabled
   * Usage: Logger.debug("[TAG]", "message", data)
   */
  static debug(tag: string, message: string, data?: unknown): void {
    if (DEBUG_ENABLED) {
      if (data !== undefined) {
        console.log(`${tag} ${message}`, data);
      } else {
        console.log(`${tag} ${message}`);
      }
    }
  }

  /**
   * Always log (for important info)
   * Usage: Logger.info("[TAG]", "message", data)
   */
  static info(tag: string, message: string, data?: unknown): void {
    if (data !== undefined) {
      console.log(`${tag} ${message}`, data);
    } else {
      console.log(`${tag} ${message}`);
    }
  }

  /**
   * Always log warnings
   * Usage: Logger.warn("[TAG]", "message", data)
   */
  static warn(tag: string, message: string, data?: unknown): void {
    if (data !== undefined) {
      console.warn(`${tag} ${message}`, data);
    } else {
      console.warn(`${tag} ${message}`);
    }
  }

  /**
   * Always log errors
   * Usage: Logger.error("[TAG]", "message", error)
   */
  static error(tag: string, message: string, error?: unknown): void {
    if (error !== undefined) {
      console.error(`${tag} ${message}`, error);
    } else {
      console.error(`${tag} ${message}`);
    }
  }

  /**
   * Check if debug logging is enabled
   */
  static isDebugEnabled(): boolean {
    return DEBUG_ENABLED;
  }
}

export default Logger;
