import { useEffect, useState, useCallback, useMemo } from 'react';
import { SocketService } from '@/services/socket.service';

interface OnlineUser {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

// Module-level cache shared across all hook instances.
// Prevents the chat header from showing "Offline" right after mount while the
// chat list already knows the user is online — new instances seed their local
// state from here instead of defaulting to false.
const _statusCache = new Map<string, OnlineUser>();

/**
 * Hook for tracking user online status
 * 
 * Features:
 * - Track single user or multiple users online status
 * - Real-time updates via socket events (user:online, user:offline)
 * - Last seen timestamp tracking
 * - Automatic refresh on socket connection
 * 
 * Usage:
 * // Single user:
 * const { isOnline, lastSeen } = useOnlineStatus('userId123');
 * 
 * // Multiple users:
 * const { onlineUsers, isUserOnline } = useOnlineStatus(['userId1', 'userId2']);
 * 
 * // Display:
 * <View style={isOnline ? styles.online : styles.offline}>
 *   <Text>{isOnline ? '🟢 Online' : '⚫ Offline'}</Text>
 * </View>
 */
export function useOnlineStatus(userIds: string | string[]) {
  const userIdArray = useMemo(() => Array.isArray(userIds) ? userIds : [userIds], [userIds]);
  const isSingleUser = typeof userIds === 'string';

  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const initializeUsers = useCallback(() => {
    setOnlineUsers(prev => {
      const updated = new Map(prev);
      userIdArray.forEach(id => {
        if (!updated.has(id)) {
          // Seed from shared cache so a freshly-mounted component (e.g. ChatHeader)
          // starts with whatever the chat list already knows rather than defaulting
          // to false and showing a contradictory "Offline" status.
          updated.set(id, _statusCache.get(id) ?? { userId: id, isOnline: false, lastSeen: undefined });
        }
      });
      return updated;
    });
  }, [userIdArray]);

  // Setup socket listeners
  useEffect(() => {
    initializeUsers();

    const socket = SocketService.getInstance();
    if (!socket) return;

    if (userIdArray.length === 0) return;

    // Handle user coming online — preserve existing lastSeen (it means "last time offline")
    const handleUserOnline = (data: { userId: string }) => {
      if (userIdArray.includes(data.userId)) {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          const existing = _statusCache.get(data.userId) ?? prev.get(data.userId);
          const status: OnlineUser = {
            userId: data.userId,
            isOnline: true,
            lastSeen: existing?.lastSeen, // keep real lastSeen, don't overwrite with now
          };
          _statusCache.set(data.userId, status);
          updated.set(data.userId, status);
          return updated;
        });
      }
    };

    // Handle user going offline — server provides the real lastSeen timestamp
    const handleUserOffline = (data: { userId: string; lastSeen?: string }) => {
      if (userIdArray.includes(data.userId)) {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          const status: OnlineUser = {
            userId: data.userId,
            isOnline: false,
            lastSeen: data.lastSeen ?? undefined,
          };
          _statusCache.set(data.userId, status);
          updated.set(data.userId, status);
          return updated;
        });
      }
    };

    // Handle bulk status response from server (initial fetch on mount)
    const handleStatusResponse = (statuses: Array<{ userId: string; isOnline: boolean; lastSeen?: string | null }>) => {
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        statuses.forEach(s => {
          if (userIdArray.includes(s.userId)) {
            const status: OnlineUser = {
              userId: s.userId,
              isOnline: s.isOnline,
              lastSeen: s.lastSeen ?? undefined, // null → undefined, never fake current time
            };
            _statusCache.set(s.userId, status);
            updated.set(s.userId, status);
          }
        });
        return updated;
      });
    };

    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('user:status_response', handleStatusResponse);

    // Request current status immediately on mount
    socket.emit('user:get_status', { userIds: userIdArray });

    setIsLoading(false);

    return () => {
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('user:status_response', handleStatusResponse);
    };
  }, [userIdArray, initializeUsers]);

  // Get online status for a specific user
  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.get(userId)?.isOnline || false;
  }, [onlineUsers]);

  // Get all online user info
  const getOnlineStatus = useCallback((userId: string): OnlineUser | null => {
    return onlineUsers.get(userId) || null;
  }, [onlineUsers]);

  // For single user query, return simplified interface
  if (isSingleUser) {
    const userStatus = onlineUsers.get(userIdArray[0]);
    return {
      isOnline: userStatus?.isOnline || false,
      lastSeen: userStatus?.lastSeen,
      onlineUsers,
      isUserOnline,
      getOnlineStatus,
      isLoading,
    };
  }

  // For multiple users query, return detailed interface
  return {
    onlineUsers,
    isUserOnline,
    getOnlineStatus,
    isLoading,
    isOnline: false, // Not applicable for multiple users
    lastSeen: undefined,
  };
}
