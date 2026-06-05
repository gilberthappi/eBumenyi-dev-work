import { useMemo, useState, useEffect } from 'react';
import { INotification } from '@/types';

export function useNotificationSearch(
  notifications: INotification[],
  searchQuery: string
) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchedNotifications = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return notifications;
    }

    const query = debouncedQuery.toLowerCase();

    return notifications.filter((notification) => {
      // Search in title
      if (notification.title.toLowerCase().includes(query)) {
        return true;
      }

      // Search in message
      if (notification.message.toLowerCase().includes(query)) {
        return true;
      }

      // Search in metadata
      if (notification.metadata) {
        const metadataString = JSON.stringify(notification.metadata).toLowerCase();
        if (metadataString.includes(query)) {
          return true;
        }
      }

      return false;
    });
  }, [notifications, debouncedQuery]);

  return { searchedNotifications, debouncedQuery };
}
