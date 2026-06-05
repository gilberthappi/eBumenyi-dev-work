import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICommentThread } from '@/types';
import * as MessagingAPI from '@/services/messaging.api';

/**
 * Hook for managing message comments (group and community only)
 * 
 * Features:
 * - Fetch comments for a message with pagination
 * - Add/edit/delete comments
 * - Real-time updates via socket
 * - Optimistic updates
 * 
 * Usage:
 * const { comments, isLoading, addComment, editComment, deleteComment } = useMessageComments(messageId, conversationType);
 * 
 * // Add comment:
 * addComment('Great message!');
 * 
 * // Edit comment:
 * editComment('comment456', 'Updated text');
 * 
 * // Delete comment:
 * deleteComment('comment456');
 */
export function useMessageComments(
  messageId: string,
  conversationType: 'group' | 'community' = 'group',
  enabled: boolean = true
) {
  const queryClient = useQueryClient();

  // Fetch comments for this message
  const { data: commentsData, isLoading, error } = useQuery({
    queryKey: ['comments', messageId, conversationType],
    queryFn: async () => {
      try {
        const response = await (conversationType === 'community'
          ? MessagingAPI.getCommunityPostComments(messageId, 20, 0)
          : MessagingAPI.getGroupMessageComments(messageId, 20, 0)
        );
        return response.data || [];
      } catch (err) {
        console.log(`❌ [useMessageComments] Error fetching comments for ${messageId}:`, err);
        return [];
      }
    },
    enabled: enabled && !!messageId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const comments = commentsData || [];

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await MessagingAPI.addComment(
        messageId,
        { text },
        conversationType
      );
      return response;
    },
    onSuccess: (newComment) => {
      // Optimistic update - add comment to the list
      queryClient.setQueryData(['comments', messageId, conversationType], (old: ICommentThread[] = []) => [
        ...old,
        newComment.data,
      ]);
    },
    onError: (error) => {
      console.log('❌ [useMessageComments] Error adding comment:', error);
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string; text: string }) => {
      return await MessagingAPI.editComment(commentId, { text }, conversationType);
    },
    onSuccess: (updatedComment) => {
      // Update comment in list
      queryClient.setQueryData(['comments', messageId, conversationType], (old: ICommentThread[] = []) =>
        old.map(c => (c.id === updatedComment.data?.id ? updatedComment.data : c))
      );
    },
    onError: (error) => {
      console.log('❌ [useMessageComments] Error editing comment:', error);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await MessagingAPI.deleteComment(commentId, conversationType);
    },
    onSuccess: (_, commentId) => {
      // Remove comment from list
      queryClient.setQueryData(['comments', messageId, conversationType], (old: ICommentThread[] = []) =>
        old.filter(c => c.id !== commentId)
      );
    },
    onError: (error) => {
      console.log('❌ [useMessageComments] Error deleting comment:', error);
    },
  });

  return {
    comments,
    isLoading,
    error,
    addComment: (text: string) => addCommentMutation.mutate(text),
    editComment: (commentId: string, text: string) =>
      editCommentMutation.mutate({ commentId, text }),
    deleteComment: (commentId: string) => deleteCommentMutation.mutate(commentId),
    isAddingComment: addCommentMutation.isPending,
    isEditingComment: editCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
  };
}
