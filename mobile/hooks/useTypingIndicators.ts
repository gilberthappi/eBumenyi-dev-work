import { useEffect, useRef, useCallback, useState } from 'react';
import { SocketService } from '@/services/socket.service';
import { Socket } from 'socket.io-client';

interface TypingUser {
  userId: string;
  userName?: string;
  userPhoto?: string;
  startedAt: number;
}

/** Clear typing indicator after 5 s — ChatInput stops emitting after 2 s anyway */
const TYPING_TIMEOUT_MS = 5000;
/** Throttle outbound typing events — don't spam the server */
const TYPING_DEBOUNCE_MS = 500;

/**
 * Typing indicators for direct, group, and community chats.
 *
 * Architecture:
 *  - direct   → /direct  namespace socket  | emits "typing" { chatId, isTyping, userName, userPhoto }
 *  - group    → /group   namespace socket  | emits "typing" { groupId, isTyping, userName, userPhoto }
 *  - community→ /community namespace socket| emits "typing" { communityId, isTyping, userName, userPhoto }
 *
 * All three namespaces re-broadcast as "user:typing" { userId, isTyping, userName, userPhoto }
 * to the relevant room, so we listen for "user:typing" on the same namespace socket.
 */
export function useTypingIndicators({
  chatId,
  currentUserId,
  type,
  currentUserName,
  currentUserPhoto,
}: {
  chatId: string;
  currentUserId: string;
  type: 'direct' | 'group' | 'community';
  currentUserName?: string;
  currentUserPhoto?: string;
}) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const typingEmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Get the correct namespace socket for this chat type */
  const getSocket = useCallback(async (): Promise<Socket | null> => {
    await SocketService.initializeNamespaces();
    if (type === 'direct') return SocketService.getDirectSocket();
    if (type === 'group') return SocketService.getGroupSocket();
    return SocketService.getCommunitySocket();
  }, [type]);

  /** Build the payload the server expects for each namespace */
  const buildEmitPayload = useCallback(
    (isTyping: boolean) => {
      const payload = type === 'direct' 
        ? { chatId, isTyping, userName: currentUserName, userPhoto: currentUserPhoto }
        : type === 'group'
        ? { groupId: chatId, isTyping, userName: currentUserName, userPhoto: currentUserPhoto }
        : { communityId: chatId, isTyping, userName: currentUserName, userPhoto: currentUserPhoto };
      
      console.log(`⌨️ [TypingIndicators] buildEmitPayload for ${type}:`, {
        userName: currentUserName,
        userPhoto: currentUserPhoto,
        hasPhoto: !!currentUserPhoto,
        payload
      });
      
      return payload;
    },
    [chatId, type, currentUserName, currentUserPhoto],
  );

  // ── Socket listener setup ─────────────────────────────────────────────────

  useEffect(() => {
    if (!chatId || !currentUserId) {
      setTypingUsers([]);
      return;
    }

    let isMounted = true;
    let socket: Socket | null = null;
    const timeoutsMap = typingTimeoutsRef.current;

    const clearUserTimeout = (userId: string) => {
      const t = timeoutsMap.get(userId);
      if (t) clearTimeout(t);
      timeoutsMap.delete(userId);
    };

    const scheduleUserTimeout = (userId: string) => {
      clearUserTimeout(userId);
      const t = setTimeout(() => {
        setTypingUsers(p => p.filter(u => u.userId !== userId));
        timeoutsMap.delete(userId);
      }, TYPING_TIMEOUT_MS);
      timeoutsMap.set(userId, t);
    };

    /** Handles "user:typing" events from all three namespaces */
    const handleUserTyping = (data: {
      userId: string;
      isTyping: boolean;
      userName?: string;
      userPhoto?: string;
    }) => {
      console.log(`⌨️ [TypingIndicators] handleUserTyping received for ${type}:${chatId}:`, {
        userId: data.userId,
        isTyping: data.isTyping,
        userName: data.userName,
        userPhoto: data.userPhoto,
        hasPhoto: !!data.userPhoto,
        currentUserId,
        isOwnEcho: data.userId === currentUserId
      });

      if (data.userId === currentUserId) return; // ignore own echo

      if (!data.isTyping) {
        // Explicit stop
        clearUserTimeout(data.userId);
        setTypingUsers(p => p.filter(u => u.userId !== data.userId));
        return;
      }

      // Start / refresh
      scheduleUserTimeout(data.userId);
      setTypingUsers(prev => {
        const exists = prev.find(u => u.userId === data.userId);
        if (exists) {
          // Refresh name/photo in case it changed, keep position
          const updated = prev.map(u =>
            u.userId === data.userId
              ? { ...u, userName: data.userName ?? u.userName, userPhoto: data.userPhoto ?? u.userPhoto }
              : u,
          );
          console.log(`⌨️ [TypingIndicators] Updated existing typing user:`, updated.find(u => u.userId === data.userId));
          return updated;
        }
        const newUser = {
          userId: data.userId,
          userName: data.userName,
          userPhoto: data.userPhoto,
          startedAt: Date.now(),
        };
        console.log(`⌨️ [TypingIndicators] Added new typing user:`, newUser);
        return [...prev, newUser];
      });
    };

    const setup = async () => {
      socket = await getSocket();
      if (!isMounted || !socket) return;

      console.log(`⌨️ [TypingIndicators] Listening on ${type} socket for ${chatId}`);
      socket.on('user:typing', handleUserTyping);
    };

    setup();

    return () => {
      isMounted = false;
      socket?.off('user:typing', handleUserTyping);
      // Clear all pending timeouts
      Array.from(timeoutsMap.values()).forEach(clearTimeout);
      timeoutsMap.clear();
    };
  }, [chatId, currentUserId, type, getSocket]);

  // ── Outbound typing events ────────────────────────────────────────────────

  const startTyping = useCallback(() => {
    if (isTypingRef.current) return; // already emitted, wait for debounce
    isTypingRef.current = true;

    if (typingEmitTimeoutRef.current) clearTimeout(typingEmitTimeoutRef.current);

    void (async () => {
      const socket = await getSocket();
      if (!socket) return;
      console.log(`⌨️ [TypingIndicators] emit typing start — ${type}:${chatId}`);
      socket.emit('typing', buildEmitPayload(true));
    })();

    // Allow next emit after debounce window
    typingEmitTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, TYPING_DEBOUNCE_MS);
  }, [chatId, type, getSocket, buildEmitPayload]);

  const stopTyping = useCallback(() => {
    isTypingRef.current = false;
    if (typingEmitTimeoutRef.current) clearTimeout(typingEmitTimeoutRef.current);

    void (async () => {
      const socket = await getSocket();
      if (!socket) return;
      console.log(`⌨️ [TypingIndicators] emit typing stop — ${type}:${chatId}`);
      socket.emit('typing', buildEmitPayload(false));
    })();
  }, [chatId, type, getSocket, buildEmitPayload]);

  // Emit stop on unmount
  useEffect(() => {
    return () => {
      stopTyping();
      if (typingEmitTimeoutRef.current) clearTimeout(typingEmitTimeoutRef.current);
    };
  }, [stopTyping]);

  return { typingUsers, startTyping, stopTyping };
}
