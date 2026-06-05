// Example: Complete Messaging Hook
// This file demonstrates how to use all the messaging services and socket events

import { useState, useEffect, useRef, useCallback } from "react";
import {
  IConversation,
  IMessage,
  IUser,
} from "@/types";
import {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleLikeMessage,
  addComment,
  addParticipant,
  removeParticipant,
  getUnreadCount,
} from "@/services/messaging.service";
import {
  initializeSocket,
  closeSocket,
  joinConversation,
  leaveConversation,
  onNewMessage,
  onMessageEdited,
  onMessageDeleted,
  onUserTyping,
  onMessageLiked,
  onCommentAdded,
  emitSendMessage,
  emitTyping,
  emitMarkMessageRead,
  emitLikeMessage,
  emitAddComment,
} from "@/hooks/useSocket";
import { getAllUsersNopagination } from "@/services/users.api";

interface UseMessagingReturn {
  // State
  conversations: IConversation[];
  selectedConversation: IConversation | null;
  messages: IMessage[];
  typingUsers: string[];
  allUsers: IUser[];
  unreadCounts: Record<string, number>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // Actions
  selectConversation: (conversation: IConversation) => void;
  createDirectChat: (userId: string) => Promise<IConversation | null>;
  createGroupChat: (name: string, userIds: string[]) => Promise<IConversation | null>;
  createCommunity: (name: string, isPublic: boolean, userIds?: string[]) => Promise<IConversation | null>;
  sendMessageToConversation: (content: string, type?: string) => Promise<void>;
  likeMessage: (messageId: string) => Promise<void>;
  commentOnMessage: (messageId: string, text: string, parentId?: string) => Promise<void>;
  editMessageContent: (messageId: string, content: string) => Promise<void>;
  deleteMessageContent: (messageId: string) => Promise<void>;
  addUserToGroup: (userId: string) => Promise<void>;
  removeUserFromGroup: (userId: string) => Promise<void>;
  handleInputChange: (text: string) => void;
}

export function useMessaging(currentUserId: string): UseMessagingReturn {
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const previousConversationRef = useRef<string>();

  // Initialize socket and load data on mount
  useEffect(() => {
    initializeSocket();
    
    const initialize = async () => {
      await loadConversations();
      await loadAllUsers();
    };
    
    initialize();

    return () => {
      closeSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const response = await getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Load all users
  const loadAllUsers = useCallback(async () => {
    try {
      const response = await getAllUsersNopagination();
      setAllUsers((response.data || []) as IUser[]);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }, []);

  // Load unread counts
  const loadUnreadCounts = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      if (response.data?.unreadByConversation) {
        setUnreadCounts(response.data.unreadByConversation);
      }
    } catch (error) {
      console.error("Failed to load unread counts:", error);
    }
  }, []);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await getMessages(conversationId, 50, 0);
      const messagesData = response.data || [];
      setMessages(messagesData);

      // Mark visible messages as read
      for (const msg of messagesData) {
        if (
          msg.senderId !== currentUserId &&
          !msg.readBy?.some((r) => r.userId === currentUserId)
        ) {
          emitMarkMessageRead(msg.id);
        }
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUserId]);

  // Select conversation and load messages
  const selectConversation = useCallback(
    (conversation: IConversation) => {
      // Leave previous conversation room
      if (previousConversationRef.current) {
        leaveConversation(previousConversationRef.current);
      }

      // Join new conversation room
      joinConversation(conversation.id);
      previousConversationRef.current = conversation.id;

      setSelectedConversation(conversation);
      loadMessages(conversation.id);
    },
    [loadMessages]
  );

  // Setup socket listeners for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribeNewMessage = onNewMessage((message: IMessage) => {
      if (message.conversationId === selectedConversation.id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    const unsubscribeMessageEdited = onMessageEdited(
      (updatedMessage: IMessage) => {
        if (updatedMessage.conversationId === selectedConversation.id) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      }
    );

    const unsubscribeMessageDeleted = onMessageDeleted((messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    const unsubscribeUserTyping = onUserTyping((data) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) =>
          data.isTyping
            ? [...new Set([...prev, data.userId])]
            : prev.filter((id) => id !== data.userId)
        );
      }
    });

    const unsubscribeMessageLiked = onMessageLiked((data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, likes: data.likeCount } : msg
        )
      );
    });

    const unsubscribeCommentAdded = onCommentAdded((comment) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === comment.messageId
            ? {
                ...msg,
                comments: [...(msg.comments || []), comment],
              }
            : msg
        )
      );
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeMessageEdited();
      unsubscribeMessageDeleted();
      unsubscribeUserTyping();
      unsubscribeMessageLiked();
      unsubscribeCommentAdded();
    };
  }, [selectedConversation, currentUserId]);

  // Refresh unread counts periodically
  useEffect(() => {
    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [loadUnreadCounts]);

  // Create direct chat
  const createDirectChat = useCallback(
    async (userId: string): Promise<IConversation | null> => {
      try {
        const response = await createConversation({
          type: "direct",
          participantIds: [userId],
        });
        if (response.data) {
          setConversations((prev) => [...prev, response.data!]);
          return response.data;
        }
      } catch (error) {
        console.error("Failed to create direct chat:", error);
      }
      return null;
    },
    []
  );

  // Create group chat
  const createGroupChat = useCallback(
    async (
      name: string,
      userIds: string[]
    ): Promise<IConversation | null> => {
      try {
        const response = await createConversation({
          type: "group",
          name,
          participantIds: [currentUserId, ...userIds],
        });
        if (response.data) {
          setConversations((prev) => [...prev, response.data!]);
          return response.data;
        }
      } catch (error) {
        console.error("Failed to create group chat:", error);
      }
      return null;
    },
    [currentUserId]
  );

  // Create community
  const createCommunity = useCallback(
    async (
      name: string,
      isPublic: boolean,
      userIds?: string[]
    ): Promise<IConversation | null> => {
      try {
        const response = await createConversation({
          type: "community",
          name,
          isPublic,
          participantIds: userIds ? [currentUserId, ...userIds] : [currentUserId],
        });
        if (response.data) {
          setConversations((prev) => [...prev, response.data!]);
          return response.data;
        }
      } catch (error) {
        console.error("Failed to create community:", error);
      }
      return null;
    },
    [currentUserId]
  );

  // Send message
  const sendMessageToConversation = useCallback(
    async (content: string, type: string = "text") => {
      if (!selectedConversation || !content.trim()) return;

      try {
        // Send via REST API for reliability
        await sendMessage(selectedConversation.id, {
          type: type as "text" | "image" | "file",
          content,
        });

        // Broadcast via socket for real-time delivery
        emitSendMessage({
          conversationId: selectedConversation.id,
          type,
          content,
        });
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [selectedConversation]
  );

  // Like message
  const likeMessage = useCallback(async (messageId: string) => {
    try {
      await toggleLikeMessage(messageId);
      emitLikeMessage(messageId);
    } catch (error) {
      console.error("Failed to like message:", error);
    }
  }, []);

  // Comment on message
  const commentOnMessage = useCallback(
    async (messageId: string, text: string, parentId?: string) => {
      try {
        await addComment(messageId, { text, parentId });
        emitAddComment({ messageId, text, parentId });
      } catch (error) {
        console.error("Failed to add comment:", error);
      }
    },
    []
  );

  // Edit message
  const editMessageContent = useCallback(
    async (messageId: string, content: string) => {
      try {
        await editMessage(messageId, { content });
        // Socket will broadcast the edit
      } catch (error) {
        console.error("Failed to edit message:", error);
      }
    },
    []
  );

  // Delete message
  const deleteMessageContent = useCallback(
    async (messageId: string) => {
      try {
        await deleteMessage(messageId);
        // Socket will broadcast the deletion
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    },
    []
  );

  // Add user to group
  const addUserToGroup = useCallback(
    async (userId: string) => {
      if (!selectedConversation) return;

      try {
        await addParticipant(selectedConversation.id, { userId });
      } catch (error) {
        console.error("Failed to add participant:", error);
      }
    },
    [selectedConversation]
  );

  // Remove user from group
  const removeUserFromGroup = useCallback(
    async (userId: string) => {
      if (!selectedConversation) return;

      try {
        await removeParticipant(selectedConversation.id, userId);
      } catch (error) {
        console.error("Failed to remove participant:", error);
      }
    },
    [selectedConversation]
  );

  // Handle typing
  const handleInputChange = useCallback(
    (_text: string) => {
      if (!selectedConversation) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      emitTyping(selectedConversation.id, true);

      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(selectedConversation.id, false);
      }, 1000);
    },
    [selectedConversation]
  );

  return {
    // State
    conversations,
    selectedConversation,
    messages,
    typingUsers,
    allUsers,
    unreadCounts,
    isLoadingConversations,
    isLoadingMessages,

    // Actions
    selectConversation,
    createDirectChat,
    createGroupChat,
    createCommunity,
    sendMessageToConversation,
    likeMessage,
    commentOnMessage,
    editMessageContent,
    deleteMessageContent,
    addUserToGroup,
    removeUserFromGroup,
    handleInputChange,
  };
}
