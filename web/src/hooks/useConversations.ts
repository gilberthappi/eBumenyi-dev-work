import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IConversation, IResponse, IMessage } from "@/types";
import {
  getConversations,
  createConversation,
  updateConversation,
  getConversationById,
  getMessages,
} from "@/services/messaging.service";

/**
 * Hook to fetch all conversations for the current user
 */
export const useGetConversations = () => {
  const queryFn = async (): Promise<IConversation[]> => {
    const response = await getConversations();
    // Handle both response.data and direct response
    const data = response.data || response;
    return Array.isArray(data) ? data : [];
  };

  return useQuery(["conversations"], queryFn, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch a specific conversation by ID
 */
export const useGetConversationById = (conversationId: string | null) => {
  const queryFn = async (): Promise<IConversation | null> => {
    if (!conversationId) return null;
    const response = await getConversationById(conversationId);
    const unwrapped = response.data || (response as unknown as IConversation);
    return unwrapped;
  };

  return useQuery(["conversation", conversationId], queryFn, {
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });
};

/**
 * Hook to fetch messages for a conversation
 */
export const useGetMessages = (conversationId: string | null, limit = 50, offset = 0) => {
  const queryFn = async (): Promise<IMessage[]> => {
    if (!conversationId) return [];
    const response = await getMessages(conversationId, limit, offset);
    return response.data || [];
  };

  return useQuery(["messages", conversationId], queryFn, {
    enabled: !!conversationId,
    staleTime: 1000 * 30, // 30 seconds
    cacheTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to create a new conversation (direct, group, or community)
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  const mutationFn = async (data: {
    type: "direct" | "group" | "community";
    name?: string;
    isPublic?: boolean;
    participantIds: string[];
  }): Promise<IConversation> => {
    const response = await createConversation(data);
    // Ensure we always return IConversation
    if (response && typeof response === 'object' && 'data' in response) {
      const typed = response as unknown as IResponse<IConversation>;
      return typed.data || ({} as IConversation);
    }
    return response as unknown as IConversation;
  };

  return useMutation(mutationFn, {
    onSuccess: (newConversation) => {
      // Update conversations list
      queryClient.setQueryData(["conversations"], (oldData: IConversation[] | undefined) => {
        return oldData ? [newConversation, ...oldData] : [newConversation];
      });
    },
  });
};

/**
 * Hook to update a conversation
 */
export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  const mutationFn = async (data: {
    conversationId: string;
    name?: string;
    isPublic?: boolean;
  }): Promise<IConversation> => {
    const response = await updateConversation(data.conversationId, {
      name: data.name,
      isPublic: data.isPublic,
    });
    // Ensure we always return IConversation
    if (response && typeof response === 'object' && 'data' in response) {
      const typed = response as unknown as IResponse<IConversation>;
      return typed.data || ({} as IConversation);
    }
    return response as unknown as IConversation;
  };

  return useMutation(mutationFn, {
    onSuccess: (updatedConversation) => {
      // Update in conversations list
      queryClient.setQueryData(["conversations"], (oldData: IConversation[] | undefined) => {
        return oldData
          ? oldData.map((conv) => (conv.id === updatedConversation.id ? updatedConversation : conv))
          : [updatedConversation];
      });

      // Update individual conversation query
      queryClient.setQueryData(
        ["conversation", updatedConversation.id],
        updatedConversation
      );
    },
  });
};

/**
 * Hook to invalidate conversations cache
 */
export const useInvalidateConversations = () => {
  const queryClient = useQueryClient();

  return {
    invalidateConversations: () =>
      queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    invalidateMessages: (conversationId: string) =>
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  };
};
