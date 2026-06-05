import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requestFcmToken } from "@/lib/firebase";
import ApiClient from "@/services/api";
import { onMessage, getMessaging } from "firebase/messaging";
import { getApp } from "firebase/app";

export async function registerPushToken(): Promise<"granted" | "denied" | "default" | "error"> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return permission;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const fcmToken = await requestFcmToken(registration);
    if (!fcmToken) return "error";

    await ApiClient.post("/notifications/push-token", { token: fcmToken, platform: "web" });
    return "granted";
  } catch (err) {
    console.error("[PushNotifications] Registration failed", err);
    return "error";
  }
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    // Respect the user's push notification preference
    const pushEnabled = JSON.parse(localStorage.getItem("st_push") ?? "true");
    if (!pushEnabled) return;

    let active = true;

    const register = async () => {
      const result = await registerPushToken();
      if (!active) return;

      if (result === "granted") {
        // Token is registered — nothing more to do here
      } else if (result === "denied") {
        console.warn("[PushNotifications] Permission denied by user");
      } else if (result === "error") {
        setError("Unable to get FCM token");
      } else {
        console.warn("[PushNotifications] Permission not granted:", result);
      }
    };

    register();

    // Handle foreground push messages (app is open and focused)
    let unsubscribeMessage: (() => void) | null = null;
    try {
      const messaging = getMessaging(getApp());
      unsubscribeMessage = onMessage(messaging, (payload) => {
        if (!active) return;

        const title = payload.notification?.title || payload.data?.title || 'Notification';
        const body = payload.notification?.body || payload.data?.body || '';
        const deepLink = payload.data?.deepLink || payload.data?.actionUrl || '';
        const entityType = payload.data?.entityType || '';
        const entityId = payload.data?.entityId || '';

        console.log('[PushNotifications] Foreground message:', title, deepLink);

        // Dispatch a custom event so other components can react
        window.dispatchEvent(new CustomEvent('fcm:foreground', {
          detail: { title, body, deepLink, entityType, entityId, data: payload.data }
        }));
      });
    } catch (err) {
      console.warn('[PushNotifications] Could not set up foreground listener:', err);
    }

    return () => {
      active = false;
      if (unsubscribeMessage) unsubscribeMessage();
    };
  }, [user]);

  return { token, error };
};

export default usePushNotifications;
