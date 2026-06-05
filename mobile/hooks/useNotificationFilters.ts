import { useMemo } from 'react';
import { INotification } from '@/types';

type FilterType = 'all' | 'unread' | 'read';
type NotificationType = 'all' | 'calendar' | 'course' | 'message' | 'alert' | 'system';

export function useNotificationFilters(
  notifications: INotification[],
  filterType: FilterType,
  notificationType: NotificationType
) {
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Apply read/unread filter
    if (filterType === 'unread') {
      filtered = filtered.filter((n) => !n.isRead);
    } else if (filterType === 'read') {
      filtered = filtered.filter((n) => n.isRead);
    }

    // Apply notification type filter
    if (notificationType !== 'all') {
      filtered = filtered.filter((n) => {
        switch (notificationType) {
          case 'calendar':
            return (
              n.metadata?.meetingType ||
              n.metadata?.eventType ||
              n.entityType === 'calendar' ||
              n.title.toLowerCase().includes('meeting') ||
              n.title.toLowerCase().includes('inama')
            );
          case 'course':
            return (
              n.entityType === 'course' ||
              n.entityType === 'chapter' ||
              n.entityType === 'attempt' ||
              n.entityType === 'certificate' ||
              n.title.toLowerCase().includes('course') ||
              n.title.toLowerCase().includes('isomo') ||
              n.title.toLowerCase().includes('igice') ||
              n.title.toLowerCase().includes('icyemezo') ||
              n.title.toLowerCase().includes('ibizamini')
            );
          case 'message':
            return (
              n.entityType === 'message' ||
              n.title.toLowerCase().includes('message') ||
              n.title.toLowerCase().includes('ubutumwa')
            );
          case 'alert':
            return n.type === 'warning' || n.type === 'error';
          case 'system':
            return n.type === 'info' || n.entityType === 'system';
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [notifications, filterType, notificationType]);

  return { filteredNotifications };
}
