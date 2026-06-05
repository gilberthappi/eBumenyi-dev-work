import {
  IMessage,
  IConversation,
  IResponse,
  IPaged,
  ICommentThread,
  IConversationParticipant,
} from "@/types";
import httpClient from "./httpClient";
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== CONVERSATIONS ====================

/**
 * Create or get a direct chat conversation
 * POST /direct-chats
 */
export const createDirectChat = async (otherUserId: string): Promise<IConversation> => {
  const response = await httpClient.post<IResponse<IConversation>>("/direct-chats", {
    otherUserId,
  });
  return (response as any).data?.data || (response as any).data;
};

/**
 * Create a new group chat conversation
 * POST /group-chats
 */
export const createGroupChat = async (data: {
  name: string;
  participantIds: string[];
  description?: string;
  photo?: string;
}): Promise<IConversation> => {
  const response = await httpClient.post<IResponse<IConversation>>("/group-chats", data);
  return (response as any).data?.data || (response as any).data;
};

/**
 * Create a new community
 * POST /communities
 */
export const createCommunity = async (data: {
  name: string;
  isPublic?: boolean;
  participantIds?: string[];
  description?: string;
  photo?: string;
}): Promise<IConversation> => {
  const response = await httpClient.post<IResponse<IConversation>>("/communities", data);
  return (response as any).data?.data || (response as any).data;
};

/**
 * Generic create conversation (legacy wrapper)
 */
export const createConversation = async (data: {
  type: "direct" | "group" | "community";
  name?: string;
  isPublic?: boolean;
  participantIds?: string[];
  otherUserId?: string;
  photo?: string;
  description?: string;
}): Promise<IConversation> => {
  if (data.type === "direct") {
    return createDirectChat(data.otherUserId || data.participantIds?.[0] || "");
  } else if (data.type === "group") {
    return createGroupChat({
      name: data.name || "Group",
      participantIds: data.participantIds || [],
      description: data.description,
      photo: data.photo,
    });
  } else {
    return createCommunity({
      name: data.name || "Community",
      isPublic: data.isPublic,
      participantIds: data.participantIds,
      description: data.description,
      photo: data.photo,
    });
  }
};

/**
 * Get all conversations for the current user
 * Routes to: GET /direct-chats, GET /group-chats, GET /communities
 * (Should be called separately for each type or combined client-side)
 */
export const getDirectChats = async (): Promise<any[]> => {
  const response = await httpClient.get<any>("/direct-chats");
  return response.data || [];
};

export const getGroupChats = async (): Promise<any[]> => {
  const response = await httpClient.get<any>("/group-chats");
  return response.data || [];
};

export const getCommunities = async (): Promise<any[]> => {
  const response = await httpClient.get<any>("/communities");
  return response.data || [];
};

/**
 * Get a specific conversation by ID with full details
 * Routes to: GET /direct-chats/{chatId}, GET /group-chats/{groupId}, GET /communities/{communityId}
 */
export const getConversationById = async (
  conversationId: string,
  type: "direct" | "group" | "community"
): Promise<IResponse<IConversation>> => {
  const baseUrl = type === "direct" 
    ? "/direct-chats"
    : type === "group"
    ? "/group-chats"
    : "/communities";
  
  return (await httpClient.get<IResponse<IConversation>>(`${baseUrl}/${conversationId}`)).data;
};

/**
 * Get a specific direct chat by ID
 */
export const getDirectChatById = async (chatId: string): Promise<IResponse<IConversation>> => {
  return (await httpClient.get<IResponse<IConversation>>(`/direct-chats/${chatId}`)).data;
};

/**
 * Get a specific group by ID
 */
export const getGroupById = async (groupId: string): Promise<IResponse<IConversation>> => {
  return (await httpClient.get<IResponse<IConversation>>(`/group-chats/${groupId}`)).data;
};

/**
 * Update a direct chat
 */
export const updateDirectChat = async (
  chatId: string,
  data: { name?: string; isPublic?: boolean }
): Promise<IResponse<IConversation>> => {
  return (await httpClient.put<IResponse<IConversation>>(`/direct-chats/${chatId}`, data)).data;
};

/**
 * Update a group
 */
export const updateGroup = async (
  groupId: string,
  data: { name?: string; description?: string; photo?: string; isPublic?: boolean }
): Promise<IResponse<IConversation>> => {
  return (await httpClient.put<IResponse<IConversation>>(`/group-chats/${groupId}`, data)).data;
};

/**
 * Delete a group
 */
export const deleteGroup = async (groupId: string): Promise<IResponse<{ success: boolean }>> => {
  return (await httpClient.delete<IResponse<{ success: boolean }>>(`/group-chats/${groupId}`)).data;
};

/**
 * Get all public communities
 */
export const getPublicCommunities = async (): Promise<any[]> => {
  const response = await httpClient.get<any>("/communities/public");
  return response.data || [];
};

/**
 * Get a specific community by ID
 */
export const getCommunityById = async (communityId: string): Promise<IResponse<IConversation>> => {
  return (await httpClient.get<IResponse<IConversation>>(`/communities/${communityId}`)).data;
};

/**
 * Update a community
 */
export const updateCommunity = async (
  communityId: string,
  data: { name?: string; description?: string; photo?: string; isPublic?: boolean }
): Promise<IResponse<IConversation>> => {
  return (await httpClient.put<IResponse<IConversation>>(`/communities/${communityId}`, data)).data;
};

/**
 * Delete a community
 */
export const deleteCommunity = async (communityId: string): Promise<IResponse<{ success: boolean }>> => {
  return (await httpClient.delete<IResponse<{ success: boolean }>>(`/communities/${communityId}`)).data;
};

/**
 * Add a member to a community
 */
export const addCommunityMember = async (
  communityId: string,
  userId: string
): Promise<IResponse<any>> => {
  return (
    await httpClient.post<IResponse<any>>(
      `/communities/${communityId}/members`,
      { userId }
    )
  ).data;
};

/**
 * Remove a member from a community
 */
export const removeCommunityMember = async (
  communityId: string,
  userId: string
): Promise<IResponse<{ success: boolean; userId: string }>> => {
  return (
    await httpClient.delete<IResponse<{ success: boolean; userId: string }>>(
      `/communities/${communityId}/members/${userId}`
    )
  ).data;
};

/**
 * Update conversation settings (name, isPublic)
 * Routes to: PUT /group-chats/{groupId}, PUT /communities/{communityId}
 */
export const updateConversation = async (
  conversationId: string,
  type: "group" | "community",
  data: { name?: string; isPublic?: boolean }
): Promise<IResponse<IConversation>> => {
  const baseUrl = type === "group" ? "/group-chats" : "/communities";
  return (await httpClient.put<IResponse<IConversation>>(`${baseUrl}/${conversationId}`, data)).data;
};

/**
 * Get unread message count for all conversations
 */
export const getUnreadCount = async (): Promise<{
  total: number;
  byChat: { chatId: string; unreadCount: number }[];
}> => {
  const response = await httpClient.get<IResponse<{ total: number; byChat: { chatId: string; unreadCount: number }[] }>>("/direct-chats/unread/counts");
  return response.data as any;
};

/**
 * Get unread count for a specific direct chat
 */
export const getDirectChatUnread = async (chatId: string): Promise<IResponse<{ unreadCount: number }>> => {
  return (await httpClient.get<IResponse<{ unreadCount: number }>>(`/direct-chats/${chatId}/unread`)).data;
};

/**
 * Get unread count for a specific group
 */
export const getGroupUnread = async (groupId: string): Promise<IResponse<{ unreadCount: number }>> => {
  return (await httpClient.get<IResponse<{ unreadCount: number }>>(`/group-chats/${groupId}/unread`)).data;
};

/**
 * Get unread count for a specific community
 */
export const getCommunityUnread = async (communityId: string): Promise<IResponse<{ unreadCount: number }>> => {
  return (await httpClient.get<IResponse<{ unreadCount: number }>>(`/communities/${communityId}/unread`)).data;
};

/**
 * Get group unread counts for all groups
 */
export const getGroupUnreadCounts = async (): Promise<{
  total: number;
  byGroup: { groupId: string; unreadCount: number }[];
}> => {
  const response = await httpClient.get<IResponse<{ total: number; byGroup: { groupId: string; unreadCount: number }[] }>>("/group-chats/unread/counts");
  return response.data as any;
};

/**
 * Get community unread counts for all communities
 */
export const getCommunityUnreadCounts = async (): Promise<{
  total: number;
  byCommunity: { communityId: string; unreadCount: number }[];
}> => {
  const response = await httpClient.get<IResponse<{ total: number; byCommunity: { communityId: string; unreadCount: number }[] }>>("/communities/unread/counts");
  return response.data as any;
};

/**
 * Mark community as visited (for unread tracking)
 */
export const markCommunityAsVisited = async (communityId: string): Promise<void> => {
  await httpClient.post(`/communities/${communityId}/visit`);
};

/**
 * Delete a direct chat
 * (Note: Not available in API, handled via archive/mute)
 */

// ==================== MESSAGES ====================

/**
 * Get messages from a direct chat with pagination
 */
export const getDirectChatMessages = async (
  chatId: string,
  limit: number = 50,
  offset: number = 0
): Promise<IPaged<IMessage[]>> => {
  return (
    await httpClient.get<IPaged<IMessage[]>>(
      `/direct-chats/${chatId}/messages?limit=${limit}&offset=${offset}`
    )
  ).data;
};

/**
 * Get messages from a group chat with pagination
 */
export const getGroupMessages = async (
  groupId: string,
  limit: number = 50,
  offset: number = 0
): Promise<IPaged<IMessage[]>> => {
  return (
    await httpClient.get<IPaged<IMessage[]>>(
      `/group-chats/${groupId}/messages?limit=${limit}&offset=${offset}`
    )
  ).data;
};

/**
 * Get posts from a community with pagination
 */
export const getCommunityPosts = async (
  communityId: string,
  limit: number = 50,
  offset: number = 0
): Promise<IPaged<IMessage[]>> => {
  return (
    await httpClient.get<IPaged<IMessage[]>>(
      `/communities/${communityId}/posts?limit=${limit}&offset=${offset}`
    )
  ).data;
};

/**
 * Send a message in a direct chat
 */
export const sendDirectMessage = async (
  chatId: string,
  data: {
    type: "text" | "image" | "video" | "audio" | "file" | "blog";
    content?: string;
    title?: string;
    attachments?: { url: string; type: string }[];
  }
): Promise<IResponse<IMessage>> => {
  console.log("📤 [sendDirectMessage] REQUEST PAYLOAD:", {
    url: `/direct-chats/${chatId}/messages`,
    data,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await httpClient.post<IResponse<IMessage>>(
      `/direct-chats/${chatId}/messages`,
      data,
    );
    console.log("✅ [sendDirectMessage] RESPONSE RECEIVED:", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  } catch (error: any) {
    console.log("❌ [sendDirectMessage] ERROR:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers,
      },
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Send a message in a group chat
 */
export const sendGroupMessage = async (
  groupId: string,
  data: {
    type: "text" | "image" | "video" | "audio" | "file" | "blog";
    content?: string;
    title?: string;
    attachments?: { url: string; type: string }[];
  }
): Promise<IResponse<IMessage>> => {
  console.log("📤 [sendGroupMessage] REQUEST PAYLOAD:", {
    url: `/group-chats/${groupId}/messages`,
    data,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await httpClient.post<IResponse<IMessage>>(
      `/group-chats/${groupId}/messages`,
      data,
    );
    console.log("✅ [sendGroupMessage] RESPONSE RECEIVED:", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  } catch (error: any) {
    console.log("❌ [sendGroupMessage] ERROR:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers,
      },
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Post in a community
 */
export const createCommunityPost = async (
  communityId: string,
  data: {
    type: "text" | "image" | "video" | "audio" | "file" | "blog";
    content?: string;
    title?: string;
    attachments?: { url: string; type: string }[];
  }
): Promise<IResponse<IMessage>> => {
  const postData: Record<string, unknown> = {
    title: data.title,
    content: data.content,
    ...(data.attachments && { attachments: data.attachments }),
  };

  console.log("📤 [createCommunityPost] REQUEST PAYLOAD:", {
    url: `/communities/${communityId}/posts`,
    data: postData,
    originalData: data,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await httpClient.post<IResponse<IMessage>>(
      `/communities/${communityId}/posts`,
      postData,
    );
    console.log("✅ [createCommunityPost] RESPONSE RECEIVED:", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  } catch (error: any) {
    console.log("❌ [createCommunityPost] ERROR:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers,
      },
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Edit a direct message (only by sender)
 */
export const editDirectMessage = async (
  chatId: string,
  messageId: string,
  data: { content?: string; title?: string }
): Promise<IResponse<IMessage>> => {
  return (await httpClient.put<IResponse<IMessage>>(`/direct-chats/${chatId}/messages/${messageId}`, data)).data;
};

/**
 * Edit a group message (only by sender)
 */
export const editGroupMessage = async (
  groupId: string,
  messageId: string,
  data: { content?: string; title?: string }
): Promise<IResponse<IMessage>> => {
  return (await httpClient.put<IResponse<IMessage>>(`/group-chats/${groupId}/messages/${messageId}`, data)).data;
};

/**
 * Edit a community post (only by sender)
 */
export const editCommunityPost = async (
  communityId: string,
  postId: string,
  data: { content?: string; title?: string }
): Promise<IResponse<IMessage>> => {
  return (await httpClient.put<IResponse<IMessage>>(`/communities/${communityId}/posts/${postId}`, data)).data;
};

/**
 * Delete a direct message (only by sender)
 */
export const deleteDirectMessage = async (
  chatId: string,
  messageId: string
): Promise<IResponse<{ success: boolean; messageId: string }>> => {
  return (await httpClient.delete<IResponse<{ success: boolean; messageId: string }>>(`/direct-chats/${chatId}/messages/${messageId}`)).data;
};

/**
 * Delete a group message (only by sender)
 */
export const deleteGroupMessage = async (
  groupId: string,
  messageId: string
): Promise<IResponse<{ success: boolean; messageId: string }>> => {
  return (await httpClient.delete<IResponse<{ success: boolean; messageId: string }>>(`/group-chats/${groupId}/messages/${messageId}`)).data;
};

/**
 * Delete a community post (only by sender)
 */
export const deleteCommunityPost = async (
  communityId: string,
  postId: string
): Promise<IResponse<{ success: boolean; messageId: string }>> => {
  return (await httpClient.delete<IResponse<{ success: boolean; messageId: string }>>(`/communities/${communityId}/posts/${postId}`)).data;
};

export const getSavedPosts = async (): Promise<IResponse<any[]>> => {
  return (await httpClient.get<IResponse<any[]>>('/communities/saved')).data;
};

export const markPostAsVisited = async (
  communityId: string,
  postId: string,
): Promise<void> => {
  await httpClient
    .post(`/communities/${communityId}/posts/${postId}/visit`, {})
    .catch(() => {});
};

export const toggleSaveCommunityPost = async (
  communityId: string,
  postId: string,
): Promise<IResponse<{ saved: boolean }>> => {
  return (
    await httpClient.post<IResponse<{ saved: boolean }>>(
      `/communities/${communityId}/posts/${postId}/save`,
      {},
    )
  ).data;
};

export const resharePost = async (
  communityId: string,
  postId: string,
): Promise<IResponse<any>> => {
  return (
    await httpClient.post<IResponse<any>>(
      `/communities/${communityId}/posts/${postId}/reshare`,
      {},
    )
  ).data;
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (
  chatId: string,
  messageId: string,
  type: "direct" | "group" = "direct"
): Promise<IResponse<{ messageId: string; userId: string; readAt: string }>> => {
  const baseUrl = type === "direct" ? `/direct-chats/${chatId}` : `/group-chats/${chatId}`;
  return (await httpClient.post<IResponse<{ messageId: string; userId: string; readAt: string }>>(`${baseUrl}/messages/${messageId}/read`, {})).data;
};

/**
 * Like or unlike a message (toggle)
 */
export const toggleLikeMessage = async (
  chatId: string,
  messageId: string,
  type: "direct" | "group" | "community"
): Promise<IResponse<{ messageId: string; liked: boolean; likeCount: number; userId: string }>> => {
  const baseUrl = type === "direct" 
    ? `/direct-chats/${chatId}/messages/${messageId}/like`
    : type === "group"
    ? `/group-chats/${chatId}/messages/${messageId}/like`
    : `/communities/${chatId}/posts/${messageId}/like`;
  
  return (await httpClient.post<IResponse<{ messageId: string; liked: boolean; likeCount: number; userId: string }>>(baseUrl, {})).data;
};

// ==================== PARTICIPANTS ====================

/**
 * Add a participant to a group or community
 */
export const addParticipantToGroup = async (
  groupId: string,
  data: { userId: string }
): Promise<IResponse<IConversationParticipant>> => {
  return (
    await httpClient.post<IResponse<IConversationParticipant>>(
      `/group-chats/${groupId}/participants`,
      data
    )
  ).data;
};

/**
 * Remove a participant from a group or community
 */
export const removeParticipantFromGroup = async (
  groupId: string,
  userId: string
): Promise<IResponse<{ success: boolean; userId: string }>> => {
  return (
    await httpClient.delete<IResponse<{ success: boolean; userId: string }>>(
      `/group-chats/${groupId}/participants/${userId}`
    )
  ).data;
};

/**
 * Get user online status
 */
export const getUserOnlineStatus = async (userId: string): Promise<IResponse<{ isOnline: boolean; lastSeen?: string }>> => {
  return (await httpClient.get<IResponse<{ isOnline: boolean; lastSeen?: string }>>(`/users/${userId}/online-status`)).data;
};

// ==================== MESSAGE COMMENTS ====================

/**
 * Add a comment to a message (group and community only)
 * Routes to /group-chats/messages/{messageId}/comments or /communities/posts/{messageId}/comments
 */
export const addComment = async (
  messageId: string,
  data: {
    text: string;
    conversationId?: string;
  },
  conversationType?: 'group' | 'community'
): Promise<IResponse<ICommentThread>> => {
  const baseUrl = conversationType === 'community' 
    ? `/communities/posts/${messageId}/comments`
    : `/group-chats/messages/${messageId}/comments`;
  
  return (
    await httpClient.post<IResponse<ICommentThread>>(
      baseUrl,
      { text: data.text, parentId: (data as any).parentId }
    )
  ).data;
};

/**
 * Get comments for a group message
 */
export const getGroupMessageComments = async (
  messageId: string,
  limit: number = 10,
  offset: number = 0
): Promise<IResponse<ICommentThread[]>> => {
  return (
    await httpClient.get<IResponse<ICommentThread[]>>(
      `/group-chats/messages/${messageId}/comments?limit=${limit}&offset=${offset}`
    )
  ).data;
};

/**
 * Get comments for a community post
 */
export const getCommunityPostComments = async (
  postId: string,
  limit: number = 10,
  offset: number = 0
): Promise<IResponse<ICommentThread[]>> => {
  return (
    await httpClient.get<IResponse<ICommentThread[]>>(
      `/communities/posts/${postId}/comments?limit=${limit}&offset=${offset}`
    )
  ).data;
};

/**
 * Add a comment to a group message
 */
export const addGroupMessageComment = async (
  messageId: string,
  data: {
    text: string;
    parentId?: string;
  }
): Promise<IResponse<ICommentThread>> => {
  return (
    await httpClient.post<IResponse<ICommentThread>>(
      `/group-chats/messages/${messageId}/comments`,
      data
    )
  ).data;
};

/**
 * Add a comment to a community post
 */
export const addCommunityPostComment = async (
  communityId: string,
  postId: string,
  data: {
    content: string;
    parentId?: string;
  }
): Promise<IResponse<ICommentThread>> => {
  return (
    await httpClient.post<IResponse<ICommentThread>>(
      `/communities/${communityId}/posts/${postId}/comments`,
      // Backend controller expects 'text', not 'content'
      { text: data.content, parentId: data.parentId }
    )
  ).data;
};

/**
 * Edit a comment (only by author)
 * Routes to /group-chats/comments/{commentId} or /communities/comments/{commentId}
 */
export const editComment = async (
  commentId: string,
  data: { text: string },
  conversationType?: 'group' | 'community'
): Promise<IResponse<ICommentThread>> => {
  const baseUrl = conversationType === 'community'
    ? `/communities/comments/${commentId}`
    : `/group-chats/comments/${commentId}`;
    
  return (
    await httpClient.put<IResponse<ICommentThread>>(
      baseUrl,
      data
    )
  ).data;
};

/**
 * Edit a group message comment
 */
export const editGroupMessageComment = async (
  commentId: string,
  data: { text: string }
): Promise<IResponse<ICommentThread>> => {
  return (
    await httpClient.put<IResponse<ICommentThread>>(
      `/group-chats/comments/${commentId}`,
      data
    )
  ).data;
};

/**
 * Edit a community post comment
 */
export const editCommunityPostComment = async (
  commentId: string,
  data: { text: string }
): Promise<IResponse<ICommentThread>> => {
  return (
    await httpClient.put<IResponse<ICommentThread>>(
      `/communities/comments/${commentId}`,
      data
    )
  ).data;
};

/**
 * Delete a comment (only by author or message owner)
 * Routes to /group-chats/comments/{commentId} or /communities/comments/{commentId}
 */
export const deleteComment = async (
  commentId: string,
  conversationType?: 'group' | 'community'
): Promise<IResponse<{ success: boolean; commentId: string }>> => {
  const baseUrl = conversationType === 'community'
    ? `/communities/comments/${commentId}`
    : `/group-chats/comments/${commentId}`;
    
  return (
    await httpClient.delete<IResponse<{ success: boolean; commentId: string }>>(
      baseUrl
    )
  ).data;
};

/**
 * Delete a group message comment
 */
export const deleteGroupMessageComment = async (
  commentId: string
): Promise<IResponse<{ success: boolean; commentId: string }>> => {
  return (
    await httpClient.delete<IResponse<{ success: boolean; commentId: string }>>(
      `/group-chats/comments/${commentId}`
    )
  ).data;
};

/**
 * Delete a community post comment
 */
export const deleteCommunityPostComment = async (
  commentId: string
): Promise<IResponse<{ success: boolean; commentId: string }>> => {
  return (
    await httpClient.delete<IResponse<{ success: boolean; commentId: string }>>(
      `/communities/comments/${commentId}`
    )
  ).data;
};

// ==================== WRAPPER FUNCTIONS (Generic/Backward Compatible) ====================

/**
 * Generic getMessages wrapper that detects conversation type
 * Requires chatId and type to be set in context or passed separately
 * For backward compatibility with existing code
 */
export const getMessages = async (
  chatId: string,
  limit: number = 50,
  offset: number = 0,
  type: "direct" | "group" | "community" = "direct"
): Promise<IPaged<IMessage[]>> => {
  if (type === "group") {
    return getGroupMessages(chatId, limit, offset);
  } else if (type === "community") {
    return getCommunityPosts(chatId, limit, offset);
  } else {
    return getDirectChatMessages(chatId, limit, offset);
  }
};

/**
 * Generic sendMessage wrapper that detects conversation type
 * For backward compatibility with existing code
 */
export const sendMessage = async (
  chatId: string,
  data: {
    type: "text" | "image" | "video" | "audio" | "file" | "blog";
    content?: string;
    title?: string;
    attachments?: { url: string; type: string }[];
  },
  conversationType: "direct" | "group" | "community" = "direct"
): Promise<IResponse<IMessage>> => {
  if (conversationType === "group") {
    return sendGroupMessage(chatId, data);
  } else if (conversationType === "community") {
    return createCommunityPost(chatId, data);
  } else {
    return sendDirectMessage(chatId, data);
  }
};

/**
 * Generic editMessage wrapper
 * For backward compatibility with existing code
 */
export const editMessage = async (
  messageId: string,
  data: { content?: string; title?: string },
  chatId?: string,
  conversationType: "direct" | "group" | "community" = "direct"
): Promise<IResponse<IMessage>> => {
  if (conversationType === "group" && chatId) {
    return editGroupMessage(chatId, messageId, data);
  } else if (conversationType === "community" && chatId) {
    return editCommunityPost(chatId, messageId, data);
  } else if (chatId) {
    return editDirectMessage(chatId, messageId, data);
  }
  throw new Error("Invalid parameters for editMessage");
};

/**
 * Generic deleteMessage wrapper
 * For backward compatibility with existing code
 */
export const deleteMessage = async (
  messageId: string,
  chatId?: string,
  conversationType: "direct" | "group" | "community" = "direct"
): Promise<IResponse<{ success: boolean; messageId: string }>> => {
  if (conversationType === "group" && chatId) {
    return deleteGroupMessage(chatId, messageId);
  } else if (conversationType === "community" && chatId) {
    return deleteCommunityPost(chatId, messageId);
  } else if (chatId) {
    return deleteDirectMessage(chatId, messageId);
  }
  throw new Error("Invalid parameters for deleteMessage");
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
  let url = `/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
  if (conversationId) {
    url += `&conversationId=${conversationId}`;
  }
  return (await httpClient.get<IResponse<{
    messages: IMessage[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }>>(url)).data;
};

/**
 * Upload a file (image, video, audio, or document) to the backend for use in chat messages
 * POST /api/upload/image, /api/upload/video, /api/upload/audio, or /api/upload/document
 */
export const uploadChatFile = async (
  fileUri: string,
  fileType: 'image' | 'document' | 'video',
  fileName: string,
  mimeType: string,
): Promise<{ url: string; publicId?: string; format?: string }> => {
  // Route to correct endpoint based on file type and mime type
  const isImage = fileType === 'image';
  const isVideo = fileType === 'video' || mimeType.startsWith('video/');
  const isAudio = mimeType.startsWith('audio/');
  
  let endpoint: string;
  let fieldName: string;
  
  if (isImage) {
    endpoint = '/upload/image';
    fieldName = 'image';
  } else if (isVideo) {
    endpoint = '/upload/video';
    fieldName = 'video';
  } else if (isAudio) {
    endpoint = '/upload/audio';
    fieldName = 'audio';
  } else {
    endpoint = '/upload/document';
    fieldName = 'document';
  }

  console.log('[uploadChatFile] Endpoint:', endpoint);
  console.log('[uploadChatFile] Field name:', fieldName);
  console.log('[uploadChatFile] File URI:', fileUri);
  console.log('[uploadChatFile] File name:', fileName);
  console.log('[uploadChatFile] MIME type:', mimeType);

  // For video files, use FileSystem.uploadAsync for better reliability with large files
  if (isVideo) {
    try {
      const { API_BASE_URL, BACKEND_BASE_URL } = await import('@/config/constants');
      const uploadUrl = `${API_BASE_URL}${endpoint}`;
      
      console.log('[uploadChatFile] Using FileSystem.uploadAsync for video');
      console.log('[uploadChatFile] Upload URL:', uploadUrl);

      // Get auth token
      const accessToken = await AsyncStorage.getItem('accessToken');

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, fileUri, {
        fieldName: fieldName,
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: {
          'Authorization': accessToken || '',
          'Accept': 'application/json',
        },
      });

      console.log('[uploadChatFile] FileSystem upload status:', uploadResult.status);
      console.log('[uploadChatFile] FileSystem upload body:', uploadResult.body);

      if (uploadResult.status !== 200) {
        throw new Error(`Upload failed with status ${uploadResult.status}: ${uploadResult.body}`);
      }

      const responseData = JSON.parse(uploadResult.body);
      const data = responseData?.data || responseData;

      if (!data?.url) {
        throw new Error(`Upload failed: no URL returned. Response: ${uploadResult.body}`);
      }

      // Convert relative URL to absolute
      // Use BACKEND_BASE_URL (without /api) for static file serving
      let finalUrl = data.url;
      if (finalUrl.startsWith('/uploads/')) {
        finalUrl = `${BACKEND_BASE_URL}${finalUrl}`;
        console.log('[uploadChatFile] Converted relative video URL to absolute:', finalUrl);
      }

      return {
        ...data,
        url: finalUrl,
      };
    } catch (error: any) {
      console.error('[uploadChatFile] FileSystem upload error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw error;
    }
  }

  // For non-video files, use the standard FormData approach
  const formData = new FormData();
  const fileEntry: any = {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  };

  formData.append(fieldName, fileEntry);

  try {
    const response = await httpClient.post<any>(
      endpoint,
      formData,
      {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 120000, // 2 minutes
        transformRequest: (data) => data,
        validateStatus: (status) => status < 500,
      }
    );

    console.log('[uploadChatFile] Response status:', response.status);
    console.log('[uploadChatFile] Full response:', JSON.stringify(response.data));

    if (response.status >= 400) {
      const errorMsg = response.data?.message || `Upload failed with status ${response.status}`;
      console.error('[uploadChatFile] Server error:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = response.data?.data || response.data;
    
    if (!data?.url) {
      throw new Error(`Upload failed: no URL returned. Response: ${JSON.stringify(response.data)}`);
    }
    
    return data;
  } catch (error: any) {
    console.error('[uploadChatFile] Upload error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      responseData: error.response?.data,
    });
    throw error;
  }
};
