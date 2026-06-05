/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Notification } from "@/types";
import { getSocketBaseURL } from "@/config/api.config";
import { getCookieValue } from "@/utils/jwt";

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Get token from localStorage OR cookie — whichever has it
const getToken = (): string | null => {
  const fromStorage = localStorage.getItem("accessToken");
  if (fromStorage) return fromStorage.replace(/^Bearer\s+/i, "");
  
  const fromCookie = getCookieValue("accessToken");
  if (fromCookie) {
    // Sync to localStorage for future reads
    localStorage.setItem("accessToken", fromCookie);
    return fromCookie.replace(/^Bearer\s+/i, "");
  }
  
  return null;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) {
      console.warn("[NotificationsContext] No token available");
      return;
    }

    // If socket exists and is connected, do nothing
    if (socketRef.current?.connected) return;

    // If socket exists but is disconnected/broken, destroy it first
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log("[NotificationsContext] Connecting socket...");

    const socket = io(getSocketBaseURL(), {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[NotificationsContext] Connected:", socket.id);
      setConnected(true);
      socket.emit("get_notifications");
    });

    socket.on("disconnect", (reason: string) => {
      console.log("[NotificationsContext] Disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (error: any) => {
      console.error("[NotificationsContext] Connection error:", error.message);
      setConnected(false);
    });

    socket.on("connected", (data: any) => {
      console.log("[NotificationsContext] Server confirmed connection:", data);
      setConnected(true);
    });

    socket.on("notifications", (initial: Notification[]) => {
      console.log("[NotificationsContext] Initial notifications:", initial.length);
      setNotifications(initial);
      setUnreadCount(initial.filter((n) => !n.isRead).length);
    });

    socket.on("notification", (notification: Notification) => {
      console.log("[NotificationsContext] New notification:", notification.title);
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
      // OS push notifications are handled exclusively by the FCM service worker
      // (firebase-messaging-sw.js). Showing them here too caused triple-popups
      // because socket events arrive faster than FCM, and multiple tabs each
      // had their own handler racing against the 2-second BroadcastChannel debounce.
    });

    socket.on("unread_count_updated", (data: { unreadCount: number }) => {
      setUnreadCount((prev) => {
        if (data.unreadCount === 0 && prev > 0) return prev;
        return data.unreadCount ?? 0;
      });
    });

    socket.on("notification_marked_read", (data: { notificationId: string }) => {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === data.notificationId ? { ...n, isRead: true } : n
        );
        setUnreadCount(updated.filter((n) => !n.isRead).length);
        return updated;
      });
    });

    socket.on("all_notifications_marked_read", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });

    socket.on("notification_deleted", (data: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== data.notificationId)
      );
    });

    socket.on("all_notifications_cleared", () => {
      setNotifications([]);
      setUnreadCount(0);
    });
  }, []);

  useEffect(() => {
    // Initial connection attempt
    connect();

    // Poll every 5 seconds — if not connected and token exists, retry
    const retryInterval = setInterval(() => {
      if (!socketRef.current?.connected && getToken()) {
        console.log("[NotificationsContext] Retry interval: attempting reconnect...");
        connect();
      }
    }, 5000);

    // Listen for storage changes (login sets token in localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken" && e.newValue && !socketRef.current?.connected) {
        console.log("[NotificationsContext] Token detected in storage, connecting...");
        connect();
      }
    };

    // Listen for custom auth events from authSync
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === "login" && !socketRef.current?.connected) {
        console.log("[NotificationsContext] Auth login event detected, connecting...");
        setTimeout(() => connect(), 100);
      }
      if (customEvent.detail === "logout") {
        console.log("[NotificationsContext] Auth logout event detected, disconnecting...");
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
          setConnected(false);
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth_change", handleAuthChange);

    return () => {
      clearInterval(retryInterval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth_change", handleAuthChange);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      setUnreadCount(updated.filter((n) => !n.isRead).length);
      return updated;
    });
    socketRef.current?.emit("mark_as_read", { notificationId });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    socketRef.current?.emit("mark_all_as_read");
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    socketRef.current?.emit("delete_notification", { notificationId });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    socketRef.current?.emit("clear_all_notifications");
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        connected,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotificationsContext must be used within a NotificationsProvider");
  }
  return context;
};
