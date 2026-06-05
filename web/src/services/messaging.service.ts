import {
  IMessage,
  IConversation,
  IMeeting,
  IResponse,
  IPaged,
  ICommentThread,
  IConversationParticipant,
} from "@/types";
import api from "./api";

// ==================== CONVERSATIONS ====================

/**
 * Create a new conversation (direct, group, or community)
 */
export const createConversation = async (
  data: {
    type: "direct" | "group" | "community";
    name?: string;
    isPublic?: boolean;
    participantIds: string[];
  }
): Promise<IResponse<IConversation>> => {
  return (await api.post("/messaging/conversations", data)).data;
};

/**
 * Get all conversations for the current user
 */
export const getConversations = async (): Promise<IResponse<IConversation[]>> => {
  return (await api.get("/messaging/conversations"));
};

/**
 * Get a specific conversation by ID with full details
 */
export const getConversationById = async (
  conversationId: string
): Promise<IResponse<IConversation>> => {
  return (await api.get(`/messaging/conversations/${conversationId}`)).data;
};

/**
 * Update conversation settings (name, isPublic)
 */
export const updateConversation = async (
  conversationId: string,
  data: { name?: string; isPublic?: boolean }
): Promise<IResponse<IConversation>> => {
  return (await api.patch(`/messaging/conversations/${conversationId}`, data)).data;
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<
  IResponse<{
    unreadCount: number;
    unreadByConversation: Record<string, number>;
  }>
> => {
  return (await api.get("/messaging/unread-count")).data;
};

// ==================== MESSAGES ====================

/**
 * Get messages from a conversation with pagination
 */
export const getMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<IPaged<IMessage[]>> => {
  return (
    await api.get(
      `/messaging/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
    )
  );
};

/**
 * Send a new message
 */
export const sendMessage = async (
  conversationId: string,
  data: {
    type: "text" | "image" | "video" | "audio" | "file" | "blog";
    content?: string;
    title?: string;
    attachments?: Array<{ url: string; type: string }>;
  }
): Promise<IResponse<IMessage>> => {
  return (await api.post(`/messaging/conversations/${conversationId}/messages`, {
    conversationId,
    ...data,
  })).data;
};

/**
 * Edit a message (only by sender)
 */
export const editMessage = async (
  messageId: string,
  data: { content?: string; title?: string }
): Promise<IResponse<IMessage>> => {
  return (await api.put(`/messaging/messages/${messageId}`, data)).data;
};

/**
 * Delete a message (only by sender)
 */
export const deleteMessage = async (messageId: string): Promise<IResponse<{ success: boolean; messageId: string }>> => {
  return (await api.delete(`/messaging/messages/${messageId}`)).data;
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (
  messageId: string
): Promise<IResponse<{ messageId: string; userId: string; readAt: string }>> => {
  return (await api.post(`/messaging/messages/${messageId}/read`, {})).data;
};

/**
 * Like or unlike a message (toggle)
 */
export const toggleLikeMessage = async (
  messageId: string
): Promise<IResponse<{ messageId: string; liked: boolean; likeCount: number; userId: string }>> => {
  return (await api.post(`/messaging/messages/${messageId}/like`, {})).data;
};

/**
 * Search messages across conversations
 */
export const searchMessages = async (
  query: string,
  conversationId?: string,
  limit: number = 20,
  offset: number = 0
): Promise<
  IResponse<{
    messages: IMessage[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }>
> => {
  let url = `/messaging/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
  if (conversationId) {
    url += `&conversationId=${conversationId}`;
  }
  return (await api.get(url)).data;
};

// ==================== COMMENTS ====================

/**
 * Add a comment to a message (or reply to a comment)
 */
export const addComment = async (
  messageId: string,
  data: {
    text: string;
    parentId?: string; // For nested replies
  }
): Promise<IResponse<ICommentThread>> => {
  return (
    await api.post(`/messaging/messages/${messageId}/comments`, data)
  ).data;
};

/**
 * Edit a comment (only by author)
 */
export const editComment = async (
  commentId: string,
  data: { text: string }
): Promise<IResponse<ICommentThread>> => {
  return (await api.put(`/messaging/comments/${commentId}`, data)).data;
};

/**
 * Delete a comment (only by author)
 */
export const deleteComment = async (
  commentId: string
): Promise<IResponse<{ success: boolean; commentId: string }>> => {
  return (await api.delete(`/messaging/comments/${commentId}`)).data;
};

// ==================== PARTICIPANTS ====================

/**
 * Add a participant to a group or community
 */
export const addParticipant = async (
  conversationId: string,
  data: { userId: string }
): Promise<IResponse<IConversationParticipant>> => {
  return (
    await api.post(
      `/messaging/conversations/${conversationId}/participants`,
      data
    )
  ).data;
};

/**
 * Remove a participant from a group or community
 */
export const removeParticipant = async (
  conversationId: string,
  userId: string
): Promise<IResponse<{ success: boolean; userId: string }>> => {
  return (
    await api.delete(
      `/messaging/conversations/${conversationId}/participants/${userId}`
    )
  ).data;
};

// ==================== MEETINGS ====================

export const getAllMeetings = async (params?: string): Promise<IPaged<IMeeting[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/meetings${queryParams}`)).data;
};

export const getMeetingById = async (id: string): Promise<IResponse<IMeeting>> => {
  return (await api.get(`/meetings/${id}`)).data;
};

export const createMeeting = async (
  data: Partial<IMeeting>
): Promise<IResponse<IMeeting>> => {
  return (await api.post("/meetings", data)).data;
};

export const updateMeeting = async (
  id: string,
  data: Partial<IMeeting>
): Promise<IResponse<IMeeting>> => {
  return (await api.put(`/meetings/${id}`, data)).data;
};

export const deleteMeeting = async (id: string): Promise<IResponse<null>> => {
  return (await api.delete(`/meetings/${id}`)).data;
};

export const joinMeeting = async (
  id: string
): Promise<IResponse<{ meetingUrl: string }>> => {
  return (await api.post(`/meetings/${id}/join`, {})).data;
};

