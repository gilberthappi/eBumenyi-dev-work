import { useNotificationsContext } from '@/contexts/NotificationsContext';

/**
 * Hook for real-time notifications via Socket.IO
 * 
 * This hook now delegates to the global NotificationsContext
 * which handles all socket communication and state management
 * 
 * Usage:
 * const { notifications, unreadCount, connected, markAsRead } = useNotificationsSocket();
 */
export const useNotificationsSocket = () => {
  return useNotificationsContext();
};
