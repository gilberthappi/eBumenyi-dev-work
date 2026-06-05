/**
 * useAnnouncements Hook - Web Version
 * 
 * Manages announcement state and display
 * Fetches announcements from API and handles socket events
 */

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getApiBaseURL } from '@/config/api.config';
import toast from 'react-hot-toast';

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

  // Fetch announcements on mount and when user changes
  useEffect(() => {
    if (!user) return;

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${getApiBaseURL()}/announcements`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const items = data.data || data;
          setAnnouncements(Array.isArray(items) ? items : []);
          console.log('[useAnnouncements] Loaded', items.length, 'announcements');
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
      setAnnouncements((prev) =>
        prev.filter((a) => a.id !== announcementId)
      );

      // Optionally mark as read/dismissed on backend
      // await fetch(`${getApiBaseURL()}/announcements/${announcementId}/dismiss`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      //   },
      // });
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

    // Could implement custom actions here
    // - Show detailed view
    // - Log analytics
    // - Navigate to specific page
  };

  // Show toast when new announcement arrives
  const showAnnouncementToast = (announcement: Announcement) => {
    toast.custom(() => (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <h3 className="font-bold mb-1">{announcement.title}</h3>
        <p className="text-sm opacity-90">{announcement.body}</p>
        <button
          onClick={() => setShowCenter(true)}
          className="mt-2 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
        >
          View All Announcements
        </button>
      </div>
    ), { duration: 8000 });
  };

  return {
    announcements,
    loading,
    showCenter,
    setShowCenter,
    dismissAnnouncement,
    handleAnnouncementAction,
    showAnnouncementToast,
  };
};
