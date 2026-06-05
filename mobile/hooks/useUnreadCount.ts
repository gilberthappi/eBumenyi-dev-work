import { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SocketService } from '@/services/socket.service';
import * as MessagingAPI from '@/services/messaging.api';
import { useActiveConversation } from './useActiveConversation';

const QUERY_KEYS = {
  direct: ['unread', 'direct'] as const,
  groups: ['unread', 'groups'] as const,
  communities: ['unread', 'communities'] as const,
};

/**
 * Hook for tracking unread message counts across all conversation types.
 * Uses React Query so multiple components share the same cached data.
 *
 * Usage:
 * const { totalAll, totalDirect, getConversationUnread, markConversationRead } = useUnreadCount();
 */
export function useUnreadCount() {
  const queryClient = useQueryClient();

  const { data: directData } = useQuery({
    queryKey: QUERY_KEYS.direct,
    queryFn: () => MessagingAPI.getUnreadCount().catch(() => ({ total: 0, byChat: [] })),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: groupData } = useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: () => MessagingAPI.getGroupUnreadCounts().catch(() => ({ total: 0, byGroup: [] })),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: communityData } = useQuery({
    queryKey: QUERY_KEYS.communities,
    queryFn: () => MessagingAPI.getCommunityUnreadCounts().catch(() => ({ total: 0, byCommunity: [] })),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Build per-conversation lookup from all three types
  const byConversation = useMemo(() => {
    const result: Record<string, number> = {};
    directData?.byChat?.forEach(({ chatId, unreadCount }) => {
      if (unreadCount > 0) result[chatId] = unreadCount;
    });
    groupData?.byGroup?.forEach(({ groupId, unreadCount }) => {
      if (unreadCount > 0) result[groupId] = unreadCount;
    });
    communityData?.byCommunity?.forEach((c: any) => {
      const count = c.unreadCount ?? c.unreadCommentCount ?? 0;
      if (count > 0) result[c.communityId] = count;
    });
    return result;
  }, [directData, groupData, communityData]);

  const totalDirect = directData?.total || 0;
  const totalGroups = groupData?.total || 0;
  const totalCommunities = communityData?.total || 0;
  const totalAll = totalDirect + totalGroups + totalCommunities;

  // Listen to real-time per-conversation unread increments from backend
  useEffect(() => {
    const socket = SocketService.getInstance();
    if (!socket) return () => {};

    const handleNewUnread = (data: { conversationId: string; kind: 'direct' | 'group' | 'community' }) => {
      // 🎯 WhatsApp-style: Don't increment unread if user is actively viewing this conversation
      const { isActive } = useActiveConversation.getState();
      if (isActive(data.conversationId)) {
        console.log(`🎯 [useUnreadCount] Skipping unread increment - user is viewing ${data.kind}:${data.conversationId}`);
        return;
      }

      console.log(`📬 [useUnreadCount] Incrementing unread for ${data.kind}:${data.conversationId}`);

      if (data.kind === 'direct') {
        queryClient.setQueryData(QUERY_KEYS.direct, (old: any) => {
          if (!old) return old;
          const existing = old.byChat?.find((c: any) => c.chatId === data.conversationId);
          if (existing) {
            return {
              total: (old.total || 0) + 1,
              byChat: old.byChat.map((c: any) =>
                c.chatId === data.conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c
              ),
            };
          }
          return {
            total: (old.total || 0) + 1,
            byChat: [...(old.byChat || []), { chatId: data.conversationId, unreadCount: 1 }],
          };
        });
      } else if (data.kind === 'group') {
        queryClient.setQueryData(QUERY_KEYS.groups, (old: any) => {
          if (!old) return old;
          const existing = old.byGroup?.find((g: any) => g.groupId === data.conversationId);
          if (existing) {
            return {
              total: (old.total || 0) + 1,
              byGroup: old.byGroup.map((g: any) =>
                g.groupId === data.conversationId ? { ...g, unreadCount: g.unreadCount + 1 } : g
              ),
            };
          }
          return {
            total: (old.total || 0) + 1,
            byGroup: [...(old.byGroup || []), { groupId: data.conversationId, unreadCount: 1 }],
          };
        });
      } else if (data.kind === 'community') {
        queryClient.setQueryData(QUERY_KEYS.communities, (old: any) => {
          if (!old) return old;
          const existing = old.byCommunity?.find((c: any) => c.communityId === data.conversationId);
          if (existing) {
            return {
              total: (old.total || 0) + 1,
              byCommunity: old.byCommunity.map((c: any) =>
                c.communityId === data.conversationId ? { ...c, unreadCount: (c.unreadCount || 0) + 1, unreadCommentCount: (c.unreadCommentCount || 0) + 1 } : c
              ),
            };
          }
          return {
            total: (old.total || 0) + 1,
            byCommunity: [...(old.byCommunity || []), { communityId: data.conversationId, unreadCount: 1 }],
          };
        });
      }
    };

    socket.on('message:new_unread', handleNewUnread);
    return () => socket.off('message:new_unread', handleNewUnread);
  }, [queryClient]);

  const refreshCounts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['unread'] });
  }, [queryClient]);

  const getConversationUnread = useCallback((conversationId: string): number => {
    return byConversation[conversationId] || 0;
  }, [byConversation]);

  const markConversationRead = useCallback((conversationId: string, kind: 'direct' | 'group' | 'community') => {
    if (kind === 'direct') {
      queryClient.setQueryData(QUERY_KEYS.direct, (old: any) => {
        if (!old?.byChat) return old;
        const current = old.byChat.find((c: any) => c.chatId === conversationId)?.unreadCount || 0;
        if (current === 0) return old;
        return {
          total: Math.max(0, (old.total || 0) - current),
          byChat: old.byChat.map((c: any) =>
            c.chatId === conversationId ? { ...c, unreadCount: 0 } : c
          ),
        };
      });
    } else if (kind === 'group') {
      queryClient.setQueryData(QUERY_KEYS.groups, (old: any) => {
        if (!old?.byGroup) return old;
        const current = old.byGroup.find((g: any) => g.groupId === conversationId)?.unreadCount || 0;
        if (current === 0) return old;
        return {
          total: Math.max(0, (old.total || 0) - current),
          byGroup: old.byGroup.map((g: any) =>
            g.groupId === conversationId ? { ...g, unreadCount: 0 } : g
          ),
        };
      });
    } else if (kind === 'community') {
      queryClient.setQueryData(QUERY_KEYS.communities, (old: any) => {
        if (!old?.byCommunity) return old;
        const current = old.byCommunity.find((c: any) => c.communityId === conversationId);
        const count = current?.unreadCount ?? current?.unreadCommentCount ?? 0;
        if (count === 0) return old;
        return {
          total: Math.max(0, (old.total || 0) - count),
          byCommunity: old.byCommunity.map((c: any) =>
            c.communityId === conversationId ? { ...c, unreadCount: 0, unreadCommentCount: 0 } : c
          ),
        };
      });
    }
  }, [queryClient]);

  return {
    totalAll,
    totalDirect,
    totalGroups,
    totalCommunities,
    byConversation,
    getConversationUnread,
    markConversationRead,
    refreshCounts,
  };
}
