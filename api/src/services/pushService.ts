/* eslint-disable @typescript-eslint/no-explicit-any */
import admin, { ServiceAccount } from "firebase-admin";
import fs from "fs";
import path from "path";
import { prisma } from "../utils/client";
import { PushPlatform } from "../utils/interfaces/common";

export type PushPayload = {
  title: string;
  body: string;
  type?: string;
  entityId?: string;
  deepLink?: string;
  data?: Record<string, string>;
};

class PushService {
  private messaging: admin.messaging.Messaging | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  // Lazy initialization - do NOT initialize in constructor
  // Firebase will be initialized on first use (first push notification)
  constructor() {
    // Empty constructor - no blocking operations
  }

  /**
   * Lazy initialization: initialize Firebase on first use
   * This defers Firebase credential loading and admin.initializeApp() call
   * until first push notification is needed, saving ~1s startup time
   */
  private async ensureInitialized(): Promise<void> {
    // If already initialized, return
    if (this.initialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this.initializeFirebase();
    await this.initPromise;
  }

  private async initializeFirebase(): Promise<void> {
    if (this.initialized) return;

    this.initialized = true;
    try {
      const credentials = this.loadCredentials();
      if (!credentials) {
        console.error(
          "[PushService] ❌ Firebase credentials NOT found; push notifications DISABLED.",
        );
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(credentials) });
      }
      this.messaging = admin.messaging();
      console.log(
        "[PushService] ✅ Firebase messaging initialized successfully (lazy)",
      );
    } catch (error) {
      console.error(
        "[PushService] ❌ Failed to initialize Firebase messaging:",
        error,
      );
      this.messaging = null;
    }
  }

  private loadCredentials(): ServiceAccount | null {
    // Try 1: File path (RECOMMENDED)
    const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (filePath) {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (fs.existsSync(resolvedPath)) {
        try {
          const fileContent = fs.readFileSync(resolvedPath, "utf8");
          const parsed = JSON.parse(fileContent);

          // Normalize snake_case keys to camelCase for Firebase Admin SDK
          if (parsed.project_id && !parsed.projectId)
            parsed.projectId = parsed.project_id;
          if (parsed.client_email && !parsed.clientEmail)
            parsed.clientEmail = parsed.client_email;
          if (parsed.private_key && !parsed.privateKey) {
            parsed.privateKey = parsed.private_key.replace(/\\n/g, "\n");
          }

          if (this.isValidServiceAccount(parsed)) {
            console.log(
              `[PushService] Loaded credentials from file: ${resolvedPath}`,
            );
            return parsed as ServiceAccount;
          } else {
            console.warn(
              "[PushService] Invalid service account format in file",
            );
          }
        } catch (err) {
          console.warn(
            `[PushService] Failed to read service account file: ${resolvedPath}`,
            err,
          );
        }
      } else {
        console.warn(
          `[PushService] Service account file not found: ${resolvedPath}`,
        );
      }
    }

    // Try 2: Base64 encoded JSON in environment variable
    const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (inline) {
      try {
        // Clean the string: remove whitespace, newlines, and carriage returns
        const cleaned = inline.replace(/\s/g, "");

        // Check if it's base64
        const isBase64 = /^[A-Za-z0-9+/=]+$/.test(cleaned);

        let jsonString: string;
        if (isBase64) {
          jsonString = Buffer.from(cleaned, "base64").toString("utf-8");
        } else {
          jsonString = cleaned;
        }

        const parsed = JSON.parse(jsonString);
        if (this.isValidServiceAccount(parsed)) {
          console.log(
            "[PushService] Loaded credentials from FIREBASE_SERVICE_ACCOUNT_JSON",
          );
          return parsed as ServiceAccount;
        }
      } catch (err) {
        console.debug(
          "[PushService] Could not parse FIREBASE_SERVICE_ACCOUNT_JSON",
        );
      }
    }

    // Try 3: Individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      privateKey = privateKey.trim();

      // Remove surrounding quotes if present
      if (
        (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))
      ) {
        privateKey = privateKey.slice(1, -1);
      }

      privateKey = privateKey.replace(/\\n/g, "\n");

      const serviceAccount = {
        projectId,
        clientEmail,
        privateKey,
      } as ServiceAccount;

      if (this.isValidServiceAccount(serviceAccount)) {
        console.log(
          "[PushService] Loaded credentials from individual env vars",
        );
        return serviceAccount;
      }
    }

    return null;
  }

  private isValidServiceAccount(account: any): account is ServiceAccount {
    const projectId = account.projectId || account.project_id;
    const clientEmail = account.clientEmail || account.client_email;
    const privateKey = account.privateKey || account.private_key;

    return (
      account &&
      typeof account === "object" &&
      typeof projectId === "string" &&
      typeof clientEmail === "string" &&
      typeof privateKey === "string" &&
      projectId.length > 0 &&
      clientEmail.length > 0 &&
      privateKey.length > 0 &&
      privateKey.includes("BEGIN PRIVATE KEY")
    );
  }

  public isEnabled() {
    return !!this.messaging;
  }

  async registerToken(
    userId: string,
    token: string,
    platform: PushPlatform = "web",
    deviceId?: string | null,
    expiresAt?: Date | null,
  ) {
    if (!token) return;
    await prisma.notificationPushToken.upsert({
      where: {
        userId_token: { userId, token },
      },
      update: {
        platform,
        deviceId: deviceId ?? undefined,
        expiresAt: expiresAt ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        deviceId: deviceId ?? undefined,
        expiresAt: expiresAt ?? undefined,
      },
    });
  }

  async sendToUser(userId: string, payload: PushPayload) {
    // Ensure Firebase is initialized before sending
    await this.ensureInitialized();

    if (!this.messaging) {
      console.warn(
        `[PushService] ⚠️  Firebase NOT initialized - cannot send push to user ${userId}`,
      );
      return { success: false, reason: "push_disabled" };
    }

    const tokens = await prisma.notificationPushToken.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!tokens.length) {
      console.warn(
        `[PushService] ⚠️  No valid tokens found for user ${userId}`,
      );
      return { success: false, reason: "no_tokens" };
    }

    // Group tokens by platform
    const tokensByPlatform = tokens.reduce<Record<PushPlatform, string[]>>(
      (acc, t) => {
        const platform = t.platform as PushPlatform;
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(t.token);
        return acc;
      },
      {} as Record<PushPlatform, string[]>,
    );

    const results: Array<{
      platform: PushPlatform;
      successCount: number;
      failureCount: number;
      error?: any;
    }> = [];

    for (const [platform, platformTokens] of Object.entries(tokensByPlatform)) {
      const link = this.buildLink(payload, platform as PushPlatform);

      // Ensure both deepLink and actionUrl are present as strings (FCM requires all data values to be strings)
      const deepLinkValue = String(payload.deepLink || payload.data?.actionUrl || link || '');
      const actionUrlValue = String(payload.data?.actionUrl || payload.deepLink || link || '');

      // Build base message.
      // Web platform intentionally omits the top-level `notification` field so
      // Chrome does not auto-display a browser notification independently of the
      // service worker. With `notification` present, Chrome shows one popup AND
      // onBackgroundMessage shows another — causing 2 simultaneous duplicates.
      // The service worker reads title/body from data fields as fallback.
      const includeNotification = platform !== "web";
      const message: admin.messaging.MulticastMessage = {
        tokens: platformTokens,
        ...(includeNotification && {
          notification: {
            title: payload.title,
            body: payload.body,
          },
        }),
        data: {
          deepLink: deepLinkValue,
          actionUrl: actionUrlValue,
          entityType: String(payload.type || ''),
          entityId: String(payload.entityId || ''),
          title: String(payload.title || ''),
          body: String(payload.body || ''),
          type: String(payload.type || ''),
          userId: String(userId),
          link: String(link || ''),
          timestamp: Date.now().toString(),
          // Spread any additional data fields (ensure they're strings)
          ...Object.entries(payload.data || {}).reduce((acc, [key, value]) => {
            acc[key] = String(value ?? '');
            return acc;
          }, {} as Record<string, string>),
        },
      };

      // Add platform-specific configurations
      this.addPlatformConfig(message, platform as PushPlatform, link, payload);

      try {
        const result = await this.messaging.sendEachForMulticast(message);
        await this.cleanupFailedTokens(platformTokens, result);

        results.push({
          platform: platform as PushPlatform,
          successCount: result.successCount,
          failureCount: result.failureCount,
        });

        console.log(
          `[PushService] Sent to ${result.successCount}/${platformTokens.length} ${platform} devices`,
        );
      } catch (error) {
        console.error(`[PushService] sendToUser failed for ${platform}`, error);
        results.push({
          platform: platform as PushPlatform,
          successCount: 0,
          failureCount: platformTokens.length,
          error,
        });
      }
    }

    const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0);
    const totalTokens = tokens.length;

    if (totalSuccess > 0) {
      console.log(
        `[PushService] ✅ Successfully sent push to user ${userId}: ${totalSuccess}/${totalTokens} devices`,
      );
    } else {
      console.error(
        `[PushService] ❌ Failed to send push to user ${userId} (0/${totalTokens} devices)`,
      );
    }

    return {
      success: totalSuccess > 0,
      totalTokens,
      totalSuccess,
      totalFailed: totalTokens - totalSuccess,
      results,
    };
  }

  private addPlatformConfig(
    message: admin.messaging.MulticastMessage,
    platform: PushPlatform,
    link: string | undefined,
    payload: PushPayload,
  ) {
    switch (platform) {
      case "android":
        message.android = {
          priority: "high",
          ttl: 3600000, // 1 hour
          notification: {
            sound: "default",
            channelId: "chw_notifications",
            priority: "high",
            ...(link && { clickAction: link }),
          },
        };
        break;

      case "ios":
        message.apns = {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
              "content-available": 1,
              category: payload.type || "general",
            },
          },
          fcmOptions: {
            analyticsLabel: payload.type,
          },
        };
        if (link) {
          message.apns.fcmOptions = {
            ...message.apns.fcmOptions,
            imageUrl: undefined,
          };
        }
        break;

      case "web":
        // No webpush.notification — the service worker owns all display logic.
        // Adding webpush.notification here would trigger a second auto-display.
        message.webpush = {
          headers: {
            Urgency: "high",
          },
          ...(link && { fcmOptions: { link } }),
        };
        break;
    }
  }

  private async cleanupFailedTokens(
    tokens: string[],
    result: admin.messaging.BatchResponse,
  ) {
    const failures: string[] = [];

    result.responses.forEach((r, idx) => {
      if (!r.success) {
        console.log(
          `[PushService DEBUG] Token ${idx} failed: ${JSON.stringify({
            error: r.error?.code,
            message: r.error?.message,
            token: tokens[idx]?.substring(0, 20) + "...",
          })}`,
        );

        if (
          r.error?.code === "messaging/registration-token-not-registered" ||
          r.error?.code === "messaging/invalid-registration-token" ||
          r.error?.code === "messaging/mismatched-credential"
        ) {
          failures.push(tokens[idx]);
        }
      } else {
        console.log(`[PushService DEBUG] Token ${idx} success`);
      }
    });

    if (failures.length) {
      await prisma.notificationPushToken.deleteMany({
        where: { token: { in: failures } },
      });
      console.log(`[PushService] Cleaned up ${failures.length} invalid tokens`);
    }
  }

  private buildLink(
    payload: PushPayload,
    platform: PushPlatform,
  ): string | undefined {
    const appUrl = process.env.WEB_APP_URL || "";
    const basePath =
      payload.deepLink ||
      payload.data?.actionUrl ||
      this.pathFromEntity(payload.data?.entityType, payload.entityId) ||
      this.pathFromEntity(payload.type, payload.entityId);

    if (!basePath) return undefined;

    if (basePath.startsWith("http://") || basePath.startsWith("https://")) {
      return basePath;
    }

    const normalizedPath = basePath.startsWith("/") ? basePath : `/${basePath}`;

    switch (platform) {
      case "android":
      case "ios":
        return `chwapp://${normalizedPath.substring(1)}`;
      case "desktop":
        return `chwdesktop://${normalizedPath.substring(1)}`;
      case "web":
      default:
        return `${appUrl}${normalizedPath}`;
    }
  }

  private pathFromEntity(entityType?: string, entityId?: string) {
    if (!entityType || !entityId) return undefined;
    const type = entityType.toLowerCase();
    if (type.includes("calendar")) return `/calendar/${entityId}`;
    if (type.includes("course")) return `/courses/${entityId}`;
    if (type.includes("chapter")) return `/courses/${entityId}`; // entityId = courseId
    if (type.includes("attempt")) return `/courses/${entityId}`; // entityId = courseId
    if (type.includes("certificate")) return `/certificate`;
    if (type.includes("group")) return `/group/${entityId}`;
    if (type.includes("community")) return `/community/${entityId}`;
    if (type.includes("chat") || type.includes("message"))
      return `/chat/${entityId}`;
    if (type.includes("announcement")) return `/announcements/${entityId}`;
    return undefined;
  }

  async removeUserTokens(userId: string) {
    const result = await prisma.notificationPushToken.deleteMany({
      where: { userId },
    });
    console.log(
      `[PushService] Removed ${result.count} tokens for user ${userId}`,
    );
    return result;
  }

  async getActiveTokens(userId: string) {
    return await prisma.notificationPushToken.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  }

  async cleanupExpiredTokens() {
    const result = await prisma.notificationPushToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    if (result.count > 0) {
      console.log(`[PushService] Cleaned up ${result.count} expired tokens`);
    }
    return result;
  }
}

export const pushService = new PushService();

// Optional: Run cleanup periodically (every hour)
if (process.env.NODE_ENV === "production") {
  setInterval(
    () => {
      pushService.cleanupExpiredTokens().catch(console.error);
    },
    60 * 60 * 1000,
  ); // 1 hour
}
