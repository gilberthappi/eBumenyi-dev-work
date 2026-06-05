/**
 * Announcement Toast Component - iOS Style for Web
 * 
 * Beautiful announcement banner with iOS-inspired design
 * Features:
 * - Sticky banner at top of screen
 * - Smooth animations
 * - Action buttons
 * - Auto-dismiss with progress bar
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  segment: string;
  publishAt: string;
  validUntil?: string | null;
  createdById: string;
}

interface AnnouncementToastProps {
  announcement: Announcement;
  onDismiss: (announcementId: string) => void;
  onAction?: (announcementId: string, action: string) => void;
  autoHideDuration?: number; // milliseconds, 0 = no auto-hide
}

export const AnnouncementToast: React.FC<AnnouncementToastProps> = ({
  announcement,
  onDismiss,
  onAction,
  autoHideDuration = 8000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (autoHideDuration <= 0 || !isVisible) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoHideDuration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        setIsVisible(false);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [autoHideDuration, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss(announcement.id);
  };

  const handleAction = (action: string) => {
    onAction?.(announcement.id, action);
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 animate-slide-down"
      style={{
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      {/* Announcement Banner */}
      <div className="mx-auto max-w-4xl">
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg">
          {/* Header with dismiss */}
          <div className="flex items-start justify-between p-4 pb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{announcement.title}</h3>
              <p className="text-sm text-blue-100 leading-relaxed">{announcement.body}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => handleAction('learn-more')}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Learn More
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-blue-100 hover:text-white font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>

          {/* Progress Bar */}
          {autoHideDuration > 0 && (
            <div className="h-1 bg-white/20">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: `${progress}%`,
                  transition: 'width 0.05s linear',
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Announcements Center - iOS Style Modal
 * Displays all announcements in a beautiful modal
 */

interface AnnouncementsCenterProps {
  announcements: Announcement[];
  isOpen: boolean;
  onClose: () => void;
  onDismiss: (announcementId: string) => void;
}

export const AnnouncementsCenter: React.FC<AnnouncementsCenterProps> = ({
  announcements,
  isOpen,
  onClose,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          style={{
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Announcements</h2>
              <p className="text-sm text-blue-100 mt-1">
                {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {announcements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="font-medium">No announcements yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-4 hover:bg-gray-50 transition-colors border-l-4 border-blue-500"
                  >
                    <h3 className="font-bold text-gray-900">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{announcement.body}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {new Date(announcement.publishAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => onDismiss(announcement.id)}
                        className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t px-6 py-3 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
