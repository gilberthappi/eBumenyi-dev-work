import { useEffect, useMemo } from 'react';
import {
  useQueryClient,
  useMutation,
  useInfiniteQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { IMessage } from '@/types';
import * as MessagingAPI from '@/services/messaging.api';
import { Socket } from 'socket.io-client';
import { SocketService } from '@/services/socket.service';
import { useOfflineQueue } from './useOfflineQueue';

export type ChatType = 'direct' | 'group' | 'community';

export interface SendMessagePayload {
  content?: string;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video';
  attachmentUrl?: string;
  attachmentName?: string;
  isAudio?: boolean;
}

interface MessagesResponse {
  data: IMessage[];
}

/**
 * Unified Chat Hook - Works for Direct, Group, and Community chats
 * Uses React Query for caching + Socket.IO for real-time invalidation
 *
 * Features:
 * - Single hook for all chat types (no duplication)
 * - Infinite scroll pagination with useInfiniteQuery
 * - Automatic caching with React Query
 * - Real-time updates via socket invalidation
 * - Loading/error states included
 *
 * Usage:
 * const { messages, isLoading, sendMessage, editMessage, hasNextPage, fetchNextPage } = useChat({
 *   chatId: 'abc123',
 *   type: 'direct'
 * });
 */
export function useChat({
  chatId,
  type,
  pageSize = 50,
  senderId,
}: {
  chatId: string | null;
  type: ChatType;
  pageSize?: number;
  senderId?: string;
}) {
  const queryClient = useQueryClient();

  // Create stable queryKey that doesn't include null
  const queryKeyArray = useMemo<[string, string, ChatType]>(
    () => ['chat', chatId || 'none', type],
    [chatId, type],
  );

  // 1️⃣ FETCH MESSAGES - Infinite scroll with pagination
  const {
    data: messagesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    MessagesResponse,
    Error,
    InfiniteData<MessagesResponse>,
    [string, string, ChatType],
    number
  >({
    queryKey: queryKeyArray,
    queryFn: async ({ pageParam }) => {
      if (!chatId) throw new Error('No chat ID');

      // Use type-specific functions instead of generic wrapper
      let result;
      if (type === 'direct') {
        result = await MessagingAPI.getDirectChatMessages(
          chatId,
          pageSize,
          pageParam,
        );
      } else if (type === 'group') {
        result = await MessagingAPI.getGroupMessages(
          chatId,
          pageSize,
          pageParam,
        );
      } else {
        result = await MessagingAPI.getCommunityPosts(
          chatId,
          pageSize,
          pageParam,
        );
      }

      return result as MessagesResponse;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: MessagesResponse): number | undefined => {
      // If we got less than pageSize messages, there are no more pages
      if (!lastPage.data || lastPage.data.length < pageSize) {
        return undefined;
      }
      // Estimate next offset based on message count
      const allMessages =
        messagesData?.pages.reduce(
          (sum: number, page: MessagesResponse) => sum + page.data.length,
          0,
        ) || 0;
      return allMessages;
    },
    enabled: !!chatId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Merge server data with current cached like state so refetches
    // don't overwrite optimistic like updates
    structuralSharing: (oldData: any, newData: any) => {
      if (!oldData?.pages || !newData?.pages) return newData;
      return {
        ...newData,
        pages: newData.pages.map((newPage: any, pageIndex: number) => {
          const oldPage = oldData.pages?.[pageIndex];
          if (!oldPage?.data) return newPage;
          return {
            ...newPage,
            data: newPage.data?.map((newMsg: any) => {
              const oldMsg = oldPage.data?.find((m: any) => m.id === newMsg.id);
              if (!oldMsg) return newMsg;
              return {
                ...newMsg,
                likeCount: newMsg.likeCount ?? 0,
                // NEVER set likes to a number — CommunityPostCard reads Array.isArray(likes).
                // Server returns a per-user filtered array from DB.
                // Cache hits return undefined (cache has no user-specific data);
                // in that case fall back to the old value so optimistic updates survive.
                likes: Array.isArray(newMsg.likes)
                  ? newMsg.likes
                  : Array.isArray(oldMsg.likes)
                  ? oldMsg.likes
                  : [],
              };
            }),
          };
        }),
      };
    },
  });

  // Flatten all pages into a single array of messages (newest first for chat UI)
  const messages = useMemo<IMessage[]>(() => {
    if (!messagesData?.pages) return [];
    const all = messagesData.pages.flatMap(
      (page: MessagesResponse) => page.data ?? [],
    );
    // Deduplicate by id — keep the last occurrence (most recent from server)
    const seen = new Map<string, IMessage>();
    for (const msg of all) {
      if (msg?.id) seen.set(msg.id, msg);
    }
    return Array.from(seen.values());
  }, [messagesData?.pages]);

  // 2️⃣ SETUP SOCKET LISTENERS - Only for invalidation, not state management
  useEffect(() => {
    if (!chatId) return;

    let isMounted = true;
    const getNamespaceSocket = (): Socket | null => {
      if (type === 'direct') return SocketService.getDirectSocket();
      if (type === 'group') return SocketService.getGroupSocket();
      if (type === 'community') return SocketService.getCommunitySocket();
      return SocketService.getInstance();
    };

    let socket = getNamespaceSocket();
    // Namespace sockets (/direct, /group, /community) only need the bare chatId —
    // the backend join handler adds the type prefix itself.
    // Only include the prefixed form when falling back to the main namespace socket.
    const isNamespaceSocket = type === 'direct' || type === 'group' || type === 'community';
    const rooms = isNamespaceSocket ? [chatId] : [chatId, `${type}:${chatId}`];

    const handleMessageCreated = (message: IMessage & Record<string, any>) => {
      console.log(`💬 [${type}] New message:`, message.id, message);

      const targetIds = [
        message.conversationId,
        message.chatId,
        message.groupId,
        message.communityId,
        message.roomId,
      ].filter(Boolean);

      if (targetIds.includes(chatId)) {
        queryClient.invalidateQueries({ queryKey: queryKeyArray });
        
        // 🔄 CRITICAL: Also update conversation list when message arrives
        // This ensures the list shows the latest message when user navigates back
        console.log(`🔄 [${type}] Updating conversation list for new message`);
        if (type === 'direct') {
          queryClient.invalidateQueries({ queryKey: ['directChats'] });
        } else if (type === 'group') {
          queryClient.invalidateQueries({ queryKey: ['groupChats'] });
        } else if (type === 'community') {
          queryClient.invalidateQueries({ queryKey: ['communities'] });
        }
      }
    };
    const handleMessageEdited = (message: IMessage) => {
      console.log(`✏️ [${type}] Message edited:`, message.id);
      if (message.conversationId === chatId) {
        queryClient.invalidateQueries({ queryKey: queryKeyArray });
        if (type === 'direct') {
          queryClient.invalidateQueries({ queryKey: ['directChats'] });
        } else if (type === 'group') {
          queryClient.invalidateQueries({ queryKey: ['groupChats'] });
        } else if (type === 'community') {
          queryClient.invalidateQueries({ queryKey: ['communities'] });
        }
      }
    };

    const handleMessageDeleted = (data: {
      messageId: string;
      chatId?: string;
    }) => {
      console.log(`🗑️ [${type}] Message deleted:`, data.messageId);
      if (!data.chatId || data.chatId === chatId) {
        queryClient.invalidateQueries({ queryKey: queryKeyArray });
        if (type === 'direct') {
          queryClient.invalidateQueries({ queryKey: ['directChats'] });
        } else if (type === 'group') {
          queryClient.invalidateQueries({ queryKey: ['groupChats'] });
        } else if (type === 'community') {
          queryClient.invalidateQueries({ queryKey: ['communities'] });
        }
      }
    };

    const handleMessageLiked = (data: {
      messageId: string;
      chatId?: string;
      groupId?: string;
      postId?: string;
      liked?: boolean;
      likeCount?: number;
      userId?: string;
      userLiked?: boolean;
    }) => {
      const targetId = data.chatId ?? data.groupId ?? data.postId;
      if (targetId && targetId !== chatId) return;

      console.log(`❤️ [${type}] Message liked:`, data.messageId, 'likeCount:', data.likeCount);

      if (data.likeCount !== undefined) {
        // Update cache directly from socket payload — no refetch needed
        queryClient.setQueryData(queryKeyArray, (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data?.map((msg: any) => {
                if (msg.id !== data.messageId) return msg;
                // likeCount updates for everyone (it's a global counter)
                // likes array stays as-is — it's per-user and only updated
                // by the mutation onSuccess for the user who acted
                return {
                  ...msg,
                  likeCount: data.likeCount ?? msg.likeCount,
                  // DO NOT update likes array here — it would wrongly mark
                  // other users as having liked the post
                };
              }),
            })),
          };
        });
      } else {
        // Fallback: payload has no likeCount, invalidate to refetch
        queryClient.invalidateQueries({ queryKey: queryKeyArray });
      }
    };

    // 🔵 WhatsApp-style: Real-time read status updates
    // When recipient reads message, sender sees checkmarks update immediately
    const handleMessageRead = (data: { messageId: string; userId: string }) => {
      console.log(`✓✓ [${type}] Message read:`, data.messageId, 'by user:', data.userId);
      
      // Update readCount in cache
      queryClient.setQueryData(queryKeyArray, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data?.map((msg: any) => {
              if (msg.id !== data.messageId) return msg;
              return {
                ...msg,
                readCount: (msg.readCount || 0) + 1,
              };
            }),
          })),
        };
      });
    };

    const joinRoom = () => {
      const activeSocket = socket;
      if (!activeSocket || !activeSocket.connected) return;
      rooms.forEach((room) => {
        console.log(`📡 [useChat] Joining room ${room}`);
        activeSocket.emit('join', room);
      });
    };

    const setupListeners = async () => {
      if (!socket) {
        await SocketService.initializeNamespaces();
        socket = getNamespaceSocket();
      }
      if (!socket) {
        socket = await SocketService.initialize();
      }
      if (!isMounted || !socket) return;

      console.log(
        `📡 [useChat] Setting up socket listeners for ${type}:${chatId}`,
      );
      socket.onAny((event, ...args: any[]) => {
        const payload = args[0] as any;
        const userName = payload?.userName || payload?.userId;
        if (event === 'typing') {
          console.log(`📡 [useChat] onAny typing from ${userName}:`, payload);
        } else {
          console.log(`📡 [useChat] onAny event=${event}`, payload);
        }
      });

      socket.on('message:created', handleMessageCreated);
      socket.on('message:edited', handleMessageEdited);
      socket.on('message:deleted', handleMessageDeleted);
      socket.on('message:liked', handleMessageLiked);
      socket.on('message:read', handleMessageRead);
      socket.on('connect', joinRoom);

      // Community-specific events
      if (type === 'community') {
        socket.on('post:created', handleMessageCreated);
        socket.on('post:edited', handleMessageEdited);
        socket.on('post:deleted', handleMessageDeleted);
        socket.on('post:liked', handleMessageLiked);
        socket.on('comment:created', (data: any) => {
          console.log(`💬 [community] New comment:`, data);
          // Update commentCount directly in cache if server sent it
          if (data?.postId && data?.commentCount !== undefined) {
            queryClient.setQueryData(queryKeyArray, (old: any) => {
              if (!old?.pages) return old;
              return {
                ...old,
                pages: old.pages.map((page: any) => ({
                  ...page,
                  data: page.data?.map((msg: any) => {
                    if (msg.id !== data.postId) return msg;
                    return { ...msg, commentCount: data.commentCount };
                  }),
                })),
              };
            });
          } else {
            queryClient.invalidateQueries({ queryKey: queryKeyArray });
          }
        });
        socket.on('comment:edited', () => {
          queryClient.invalidateQueries({ queryKey: queryKeyArray });
        });
        socket.on('comment:deleted', (data: any) => {
          console.log(`🗑️ [community] Comment deleted:`, data);
          // Update commentCount directly in cache if server sent it
          if (data?.postId && data?.commentCount !== undefined) {
            queryClient.setQueryData(queryKeyArray, (old: any) => {
              if (!old?.pages) return old;
              return {
                ...old,
                pages: old.pages.map((page: any) => ({
                  ...page,
                  data: page.data?.map((msg: any) => {
                    if (msg.id !== data.postId) return msg;
                    return { ...msg, commentCount: data.commentCount };
                  }),
                })),
              };
            });
          } else {
            queryClient.invalidateQueries({ queryKey: queryKeyArray });
          }
        });
      }

      // Join immediately if connected now
      joinRoom();
    };

    setupListeners();

    // Cleanup listeners on unmount
    return () => {
      isMounted = false;
      if (!socket) return;

      console.log(
        `🧹 [useChat] Cleaning up socket listeners for ${type}:${chatId}`,
      );
      socket.off('message:created', handleMessageCreated);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:liked', handleMessageLiked);
      socket.off('message:read', handleMessageRead);
      socket.off('connect', joinRoom);

      // Community-specific cleanup
      if (type === 'community') {
        socket.off('post:created', handleMessageCreated);
        socket.off('post:edited', handleMessageEdited);
        socket.off('post:deleted', handleMessageDeleted);
        socket.off('post:liked', handleMessageLiked);
        socket.off('comment:created');
        socket.off('comment:edited');
        socket.off('comment:deleted');
      }

      socket.offAny();

      const activeSocket = socket;
      if (activeSocket.connected) {
        rooms.forEach((room) => {
          console.log(`📡 [useChat] Leaving room ${room}`);
          activeSocket.emit('leave', room);
        });
      }
    };
  }, [chatId, type, queryKeyArray, queryClient]);

  // 🔄 POLLING EFFECT - Periodically refetch to catch any missed messages
  useEffect(() => {
    if (!chatId) return;

    // Poll every 60 seconds as a safety net (reduced from 5s to prevent audio interruption)
    const pollInterval = setInterval(() => {
      console.log(
        `📡 [useChat] Safety polling: refetching messages for ${type}:${chatId}`,
      );
      queryClient.invalidateQueries({ queryKey: queryKeyArray });
    }, 60000);

    return () => clearInterval(pollInterval);
  }, [chatId, type, queryKeyArray, queryClient]);

  // 🔌 OFFLINE SUPPORT - Queue messages when offline
  const {
    queuedMessages,
    isOnline,
    addToQueue: addMessageToOfflineQueue,
  } = useOfflineQueue({
    chatId: chatId || 'unknown',
    chatType: type,
    onQueueChange: (queue) => {
      console.log(
        `📤 [useChat] Offline queue updated (${queue.length} pending)`,
      );
    },
  });

  // 3️⃣ MUTATIONS - Actions that update data on server

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      if (!chatId) throw new Error('No chat ID');
      if (!senderId) throw new Error('No sender ID');

      const msgType = payload.type || 'text';
      const content = payload.content || payload.attachmentUrl || '';

      console.log(`📨 [useChat] Sending message`, {
        chatId,
        type,
        senderId,
        msgType,
        preview: content?.slice(0, 120),
      });

      // If offline, queue the message
      if (!isOnline) {
        await addMessageToOfflineQueue({
          conversationId: chatId,
          senderId: senderId,
          type: msgType,
          content,
          timestamp: new Date().toISOString(),
        });
        // Return a fake message response for optimistic update
        return {
          data: {
            id: `temp_${Date.now()}`,
            conversationId: chatId,
            senderId: senderId,
            type: msgType,
            content,
            timestamp: new Date().toISOString(),
            isRead: false,
            ...(payload.attachmentUrl
              ? {
                  attachments: JSON.stringify([
                    {
                      url: payload.attachmentUrl,
                      type: payload.isAudio
                        ? 'audio'
                        : msgType === 'image'
                          ? 'image'
                          : 'file',
                      name: payload.attachmentName || '',
                    },
                  ]),
                }
              : {}),
          },
        };
      }

      // If online, send normally
      const messageData: any = {
        type: msgType,
        content,
      };

      if (payload.attachmentUrl) {
        // Backend stores attachments as a JSON string (String? field), not an array
        messageData.attachments = JSON.stringify([
          {
            url: payload.attachmentUrl,
            type: payload.isAudio
              ? 'audio'
              : msgType === 'image'
                ? 'image'
                : 'file',
            name: payload.attachmentName || '',
          },
        ]);
      }

      if (type === 'community') {
        messageData.title = content.substring(0, 100) || 'Post';
      }

      return MessagingAPI.sendMessage(chatId, messageData, type);
    },
    onSuccess: (newMessage) => {
      const messagePayload = (newMessage as any)?.data ?? newMessage;

      console.log(`✅ [useChat] Message send success`, {
        chatId,
        type,
        raw: newMessage,
        messageId: messagePayload?.id,
      });

      // Optimistically update cache
      queryClient.setQueryData(queryKeyArray, (old: any) => {
        if (!messagePayload) return old;

        if (!old)
          return { pages: [{ data: [messagePayload] }], pageParams: [0] };
        return {
          ...old,
          pages: old.pages.map((page: MessagesResponse, index: number) =>
            index === old.pages.length - 1
              ? { ...page, data: [...page.data, messagePayload] }
              : page,
          ),
        };
      });

      // 🔄 Update conversation list for sender (WhatsApp-style)
      // This ensures the sender sees their message preview immediately
      console.log('🔄 [useChat] Updating conversation list for sender');
      if (type === 'direct') {
        queryClient.invalidateQueries({ queryKey: ['directChats'] });
      } else if (type === 'group') {
        queryClient.invalidateQueries({ queryKey: ['groupChats'] });
      } else if (type === 'community') {
        queryClient.invalidateQueries({ queryKey: ['communities'] });
      }

      // 🔄 MULTI-STRATEGY DELIVERY CONFIRMATION
      console.log(
        `🔄 [useChat] Triggering multi-strategy delivery confirmation (messageId: ${messagePayload?.id})`,
      );

      // Strategy 1: Immediate refetch (50ms)
      setTimeout(() => {
        console.log(`📡 [useChat] Strategy 1: Immediate refetch`);
        queryClient.invalidateQueries({ queryKey: queryKeyArray });
      }, 50);

      // Strategy 2: Emit socket "force_sync" event (150ms)
      setTimeout(async () => {
        try {
          const socket =
            type === 'direct'
              ? SocketService.getDirectSocket()
              : type === 'group'
                ? SocketService.getGroupSocket()
                : type === 'community'
                  ? SocketService.getCommunitySocket()
                  : SocketService.getInstance();
          if (socket?.connected) {
            console.log(`📡 [useChat] Strategy 2: Emitting force_sync event`);
            socket.emit('force_sync', {
              chatId,
              type,
              messageId: messagePayload?.id,
              room: `${type}:${chatId}`,
            });
          }
        } catch (error) {
          console.warn(`⚠️ [useChat] Strategy 2 failed:`, error);
        }
      }, 150);

      // Strategy 3: Second refetch (300ms - accounts for network delay)
      setTimeout(() => {
        console.log(
          `📡 [useChat] Strategy 3: Delayed refetch for network sync`,
        );
        queryClient.invalidateQueries({ queryKey: queryKeyArray });
      }, 300);

      // Strategy 4: Manual socket room re-join (500ms)
      setTimeout(async () => {
        try {
          const socket =
            type === 'direct'
              ? SocketService.getDirectSocket()
              : type === 'group'
                ? SocketService.getGroupSocket()
                : type === 'community'
                  ? SocketService.getCommunitySocket()
                  : SocketService.getInstance();
          if (socket?.connected) {
            console.log(
              `📡 [useChat] Strategy 4: Re-joining room for message sync`,
            );
            socket.emit('join', chatId);
          }
        } catch (error) {
          console.warn(`⚠️ [useChat] Strategy 4 failed:`, error);
        }
      }, 500);

      // Strategy 5: Final aggressive refetch (750ms)
      setTimeout(() => {
        console.log(`📡 [useChat] Strategy 5: Final aggressive refetch`);
        queryClient.invalidateQueries({ queryKey: queryKeyArray });
      }, 750);
    },
    onError: (error) => {
      console.log('Failed to send message:', error);
      // React Query will show error state
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: async (params: { messageId: string; content: string }) => {
      if (!chatId) throw new Error('No chat ID');
      return MessagingAPI.editMessage(
        params.messageId,
        { content: params.content },
        chatId,
        type,
      );
    },
    onSuccess: () => {
      // Refetch to get updated message
      queryClient.invalidateQueries({ queryKey: queryKeyArray });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!chatId) throw new Error('No chat ID');
      return MessagingAPI.deleteMessage(messageId, chatId, type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyArray });
    },
  });

  const likeMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!chatId) throw new Error('No chat ID');
      return MessagingAPI.toggleLikeMessage(chatId, messageId, type);
    },
    onMutate: async (messageId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeyArray });
      const previous = queryClient.getQueryData(queryKeyArray);
      // Optimistic toggle — flips immediately for instant UI response
      queryClient.setQueryData(queryKeyArray, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data?.map((msg: any) => {
              if (msg.id !== messageId) return msg;
              const currentCount = msg.likeCount ?? 0;
              // isCurrentlyLiked: check likes array (per-user data from DB)
              const isCurrentlyLiked = Array.isArray(msg.likes) && msg.likes.length > 0;
              const newCount = isCurrentlyLiked
                ? Math.max(0, currentCount - 1)
                : currentCount + 1;
              return {
                ...msg,
                likeCount: newCount,
                // Toggle likes array optimistically
                likes: isCurrentlyLiked ? [] : [{ id: 'optimistic' }],
              };
            }),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _messageId, context: any) => {
      // Rollback optimistic update on failure
      if (context?.previous) {
        queryClient.setQueryData(queryKeyArray, context.previous);
      }
    },
    onSuccess: (response: any, messageId: string) => {
      // Use the server's exact likeCount to settle the cache — no refetch needed
      const serverLikeCount = response?.data?.likeCount ?? response?.likeCount ?? 0;
      queryClient.setQueryData(queryKeyArray, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data?.map((msg: any) => {
              if (msg.id !== messageId) return msg;
              // liked: true means current user just liked, false means unliked
              const serverLiked = response?.data?.liked ?? response?.liked ?? false;
              return {
                ...msg,
                likeCount: serverLikeCount,
                // Only update likes array for the person who performed the action
                // [{id:'liked'}] = current user liked, [] = current user unliked
                likes: serverLiked ? [{ id: 'liked' }] : [],
              };
            }),
          })),
        };
      });
    },
  });

  // 4️⃣ HELPER FUNCTIONS - Wrapped mutations for easy use

  const sendMessage = (content: string) => {
    sendMessageMutation.mutate({ content, type: 'text' });
  };

  const sendAttachment = (
    url: string,
    attachmentType: 'image' | 'file' | 'audio' | 'video',
    fileName: string,
  ) => {
    sendMessageMutation.mutate({
      content: fileName,
      type: attachmentType,
      attachmentUrl: url,
      attachmentName: fileName,
      isAudio: attachmentType === 'audio',
    });
  };

  const editMessage = (messageId: string, content: string) => {
    editMessageMutation.mutate({ messageId, content });
  };

  const deleteMessage = (messageId: string) => {
    deleteMessageMutation.mutate(messageId);
  };

  const toggleLike = (messageId: string) => {
    if (likeMessageMutation.isPending) return;
    likeMessageMutation.mutate(messageId);
  };

  const markMessagesRead = async () => {
    if (!chatId || !senderId) return;
    try {
      const unreadMessages = messages.filter(
        (m) => m.senderId !== senderId && !(m as any).readCount
      );
      const readType = type === 'community' ? undefined : type as 'direct' | 'group';
      await Promise.all(
        unreadMessages.map((m) =>
          MessagingAPI.markMessageAsRead(chatId, m.id, readType)
        )
      );
      if (unreadMessages.length > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeyArray });
        
        // 🔄 CRITICAL: Also update conversation list and unread counts
        // This ensures the list shows correct state when user navigates back
        console.log(`🔄 [useChat] Marked ${unreadMessages.length} messages as read, updating lists`);
        if (type === 'direct') {
          queryClient.invalidateQueries({ queryKey: ['directChats'] });
          queryClient.invalidateQueries({ queryKey: ['unread', 'direct'] });
        } else if (type === 'group') {
          queryClient.invalidateQueries({ queryKey: ['groupChats'] });
          queryClient.invalidateQueries({ queryKey: ['unread', 'groups'] });
        } else if (type === 'community') {
          queryClient.invalidateQueries({ queryKey: ['communities'] });
          queryClient.invalidateQueries({ queryKey: ['unread', 'communities'] });
        }
      }
    } catch (err) {
      console.warn('[useChat] markMessagesRead failed:', err);
    }
  };

  return {
    // Data
    messages,

    // States
    isLoading,
    error,
    isSending: sendMessageMutation.isPending,
    isEditing: editMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
    isLiking: likeMessageMutation.isPending,

    // Offline support
    queuedMessages,
    isOnline,

    // Infinite scroll
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,

    // Actions
    sendMessage,
    sendAttachment,
    editMessage,
    deleteMessage,
    toggleLike,
    markMessagesRead,

    // Utilities
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeyArray }),
  };
}
