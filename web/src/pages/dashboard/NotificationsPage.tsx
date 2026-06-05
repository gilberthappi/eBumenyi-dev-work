import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Bell, CheckCheck, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import { Notification } from "@/types";

const typeColors: Record<Notification["type"], string> = {
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

const NotificationItem: React.FC<{
  n: Notification;
  autoOpen?: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ n, autoOpen, onMarkAsRead, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoOpen) {
      setExpanded(true);
      if (!n.isRead) onMarkAsRead(n.id);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [autoOpen]);

  const handleExpand = () => {
    if (!n.isRead) onMarkAsRead(n.id);
    setExpanded((v) => !v);
  };

  return (
    <div
      ref={ref}
      className={`rounded-xl border transition-colors ${
        n.isRead ? "bg-white border-gray-100" : "bg-blue-50 border-blue-100"
      }`}
    >
      {/* Row — always visible */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={handleExpand}
      >
        {/* Type dot */}
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[n.type]}`} />

        {/* Content preview */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{n.title}</p>
          {!expanded && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {n.createdAt
              ? new Date(n.createdAt).toLocaleString("en-RW", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {!n.isRead && (
            <button
              onClick={() => onMarkAsRead(n.id)}
              title="Mark as read"
              className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500 transition-colors"
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            onClick={() => onDelete(n.id)}
            title="Delete"
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <div className="p-1.5 text-gray-400">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded full message */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{n.message}</p>
        </div>
      )}
    </div>
  );
};

const NotificationsPage: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get("id");
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotificationsContext();

  return (
    <div className={embedded ? "space-y-6" : "max-w-2xl mx-auto space-y-6"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs text-[#3363AD] hover:text-[#2a52a0] font-medium px-3 py-1.5 border border-[#3363AD]/30 rounded-lg hover:bg-[#3363AD]/5 transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="text-xs mt-1">You'll see updates from your courses and platform here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              autoOpen={n.id === targetId}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
