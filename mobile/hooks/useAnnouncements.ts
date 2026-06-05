/**
 * useAnnouncements Hook - Mobile Version
 * 
 * Manages announcement state and display for React Native
 * Fetches announcements from API and handles socket events
 */

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';
import { getApiBaseURL } from '@/config/api.config';
import Toast from 'react-native-toast-message';

interface Announcement {
  id: string;
  title: string;
  body: string;
  segment: string;
  publishAt: string;
  validUntil?: string | null;
  createdById: string;
}

export const useAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCenter, setShowCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch announcements on mount and when user changes
  useEffect(() => {
    if (!user) return;

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) return;

        const response = await fetch(
          `${getApiBaseURL()}/announcements`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const items = data.data || data;
          const itemsArray = Array.isArray(items) ? items : [];
          setAnnouncements(itemsArray);
          setUnreadCount(itemsArray.length);
          console.log('[useAnnouncements] Loaded', itemsArray.length, 'announcements');
        }
      } catch (error) {
        console.error('[useAnnouncements] Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [user]);

  // Dismiss announcement
  const dismissAnnouncement = async (announcementId: string) => {
    try {
      // Update local state
      setAnnouncements((prev) => {
        const filtered = prev.filter((a) => a.id !== announcementId);
        setUnreadCount(filtered.length);
        return filtered;
      });

      // Optionally mark as read/dismissed on backend
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        await fetch(
          `${getApiBaseURL()}/announcements/${announcementId}/dismiss`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        ).catch(() => {
          // Fail silently
        });
      }
    } catch (error) {
      console.error('[useAnnouncements] Failed to dismiss:', error);
    }
  };

  // Handle announcement action
  const handleAnnouncementAction = async (
    announcementId: string,
    action: string
  ) => {
    console.log(`[useAnnouncements] Action: ${action} for announcement: ${announcementId}`);

    if (action === 'learn-more') {
      setShowCenter(true);
    }
  };

  // Show toast when new announcement arrives
  const showAnnouncementToast = (announcement: Announcement) => {
    Toast.show({
      type: 'info',
      text1: announcement.title,
      text2: announcement.body,
      visibilityTime: 8000,
      position: 'top',
      topOffset: 60,
    });
  };

  return {
    announcements,
    loading,
    showCenter,
    setShowCenter,
    unreadCount,
    dismissAnnouncement,
    handleAnnouncementAction,
    showAnnouncementToast,
  };
};
