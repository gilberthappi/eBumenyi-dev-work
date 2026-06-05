import { useEffect } from 'react';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';

/**
 * Component that listens for real-time notifications via Socket.IO
 * Must be mounted in the root layout to receive notifications
 */
export const NotificationListener = () => {
  const { notifications, unreadCount, connected } = useNotificationsSocket();

  useEffect(() => {
    if (connected) {
      console.log('📢 [NotificationListener] Socket connected - listening for notifications');
    }
  }, [connected]);

  useEffect(() => {
    if (notifications.length > 0) {
      console.log(`📬 [NotificationListener] Notifications updated: ${notifications.length} total, ${unreadCount} unread`);
    }
  }, [notifications, unreadCount]);

  // This component doesn't render anything, it just listens
  return null;
};

export default NotificationListener;
