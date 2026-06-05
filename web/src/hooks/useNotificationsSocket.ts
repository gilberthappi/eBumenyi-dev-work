/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Notification } from "@/types";
import { useAuth } from "./useAuth";
import { getSocketBaseURL } from "@/config/api.config";

// Helper function to decode JWT payload (without verification)
const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (e) {
    return null;
  }
};

export const useNotificationsSocket = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const rawToken = localStorage.getItem("accessToken");

    if (!user || !rawToken) {
      console.warn("Socket: No user or token available");
      return;
    }

    // Clean token - remove Bearer prefix if present
    const cleanToken = rawToken.replace(/^Bearer\s+/i, "");
    console.log("Socket: Attempting connection with token");
    console.log("Token first 50 chars:", cleanToken.substring(0, 50));
    console.log("Token is JWT format:", cleanToken.split('.').length === 3);
    
    // Decode and log JWT payload
    const jwtPayload = decodeJWT(cleanToken);
    console.log("JWT Payload:", jwtPayload);
    console.log("User info:", { userId: user?.id, email: user?.email });

    const socket = io(getSocketBaseURL(), {
      auth: {
        token: cleanToken,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected successfully with ID:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);
      console.log("Disconnect reason details:", {
        reason,
        connected: socket.connected,
        disconnected: socket.disconnected,
        active: socket.active
      });
      setConnected(false);
    });

    socket.on("connect_error", (error: any) => {
      console.error("Socket connection error:", error);
      console.error("Error message:", error.message);
      console.error("Error type:", error.type);
      console.error("Error data:", error.data);
      console.error("Socket ID:", socket.id);
      console.error("Connected:", socket.connected);
      
      // Log token info for debugging
      const token = localStorage.getItem("accessToken");
      console.warn("Token exists:", !!token);
      console.warn("Token length:", token?.length);
      
      const jwtPayload = token ? decodeJWT(token.replace(/^Bearer\s+/i, "")) : null;
      console.warn("JWT Payload (on error):", jwtPayload);
      
      setConnected(false);
    });

    socket.on("error", (error: any) => {
      console.error("Socket error event:", error);
      console.error("Full error object:", JSON.stringify(error));
    });

    socket.on("connected", (data: any) => {
      console.log("Socket 'connected' event received:", data);
      setConnected(true);
    });

    socket.on("authentication_error", (error: any) => {
      console.error("Socket authentication error:", error);
      setConnected(false);
    });

    socket.on("reconnect_attempt", () => {
      console.log("Attempting to reconnect...");
    });

    socket.on("reconnect", () => {
      console.log("Reconnected successfully");
      setConnected(true);
    });

    socket.on("reconnect_error", (error: any) => {
      console.error("Reconnection error:", error);
    });

    socket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("notifications", (initial: Notification[]) => {
      setNotifications(initial);
      const unread = initial.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    });

    socket.on("unread_count_updated", (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount ?? 0);
    });

    socket.on("notification_marked_read", (data: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === data.notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    });

    socket.on("all_notifications_marked_read", () => {
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Mark a specific notification as read
  const markAsRead = useCallback((notificationId: string) => {
    // Optimistically update local state first
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Send to server via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("mark_as_read", { notificationId });
    } else {
      console.warn(" Socket not connected, cannot mark notification as read");
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    // Optimistically update local state first
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    );
    setUnreadCount(0);

    // Send to server via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("mark_all_as_read");
    } else {
      console.warn("Socket not connected, cannot mark all notifications as read");
    }
  }, []);

  // Delete a notification (bonus feature)
  const deleteNotification = useCallback((notificationId: string) => {
    // Optimistically update local state first
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Send to server via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("delete_notification", { notificationId });
    } else {
      console.warn("Socket not connected, cannot delete notification");
    }
  }, []);

  // Clear all notifications (bonus feature)
  const clearAllNotifications = useCallback(() => {
    // Optimistically update local state first
    setNotifications([]);
    setUnreadCount(0);

    // Send to server via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("clear_all_notifications");
    } else {
      console.warn("Socket not connected, cannot clear all notifications");
    }
  }, []);

  return {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    socket: socketRef.current,
  };
};

export default useNotificationsSocket;
