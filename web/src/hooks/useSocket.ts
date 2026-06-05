import io, { Socket } from "socket.io-client";
import { getSocketBaseURL } from "@/config/api.config";
import { IMessage, ICommentThread, IConversationParticipant, IAttachment } from "@/types";

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 */
export const initializeSocket = (): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const rawToken = localStorage.getItem("accessToken");
  const cleanToken = rawToken?.replace(/^Bearer\s+/i, "") || "";
  
  socket = io(getSocketBaseURL(), {
    auth: {
      token: cleanToken,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  // Connection events
  socket.on("connected", (data: { userId: string }) => {
    console.log("Connected to socket server as:", data.userId);
  });

  socket.on("connect", () => {
    console.log("Socket connected successfully with ID:", socket?.id);
  });

  socket.on("connect_error", (error: any) => {
    console.error("Socket connection error:", error);
    console.error("Error message:", error.message);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from socket server");
  });

  socket.on("error", (error: string) => {
    console.error("Socket error:", error);
  });

  return socket;
};

/**
 * Get existing socket connection
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Close socket connection
 */
export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// ==================== CONVERSATION EVENTS ====================

/**
 * Join a conversation room for real-time updates
 */
export const joinConversation = (conversationId: string): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("join_conversation", conversationId);
  }
};

/**
 * Leave a conversation room
 */
export const leaveConversation = (conversationId: string): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("leave_conversation", conversationId);
  }
};

/**
 * Listen for new messages in a conversation
 */
export const onNewMessage = (
  callback: (message: IMessage) => void
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("new_message", callback);
    return () => sock.off("new_message", callback);
  }
  return () => {};
};

/**
 * Listen for message edits
 */
export const onMessageEdited = (callback: (message: IMessage) => void): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("message_edited", callback);
    return () => sock.off("message_edited", callback);
  }
  return () => {};
};

/**
 * Listen for message deletes
 */
export const onMessageDeleted = (
  callback: (messageId: string) => void
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("message_deleted", callback);
    return () => sock.off("message_deleted", callback);
  }
  return () => {};
};

/**
 * Listen for typing indicators
 */
export const onUserTyping = (
  callback: (data: { userId: string; isTyping: boolean; userName: string }) => void
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("user_typing", callback);
    return () => sock.off("user_typing", callback);
  }
  return () => {};
};

/**
 * Listen for message reads
 */
export const onMessageRead = (
  callback: (data: { messageId: string; userId: string; readAt: string }) => void
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("message_read", callback);
    return () => sock.off("message_read", callback);
  }
  return () => {};
};

/**
 * Listen for likes
 */
export const onMessageLiked = (
  callback: (data: { messageId: string; liked: boolean; likeCount: number; userId: string }) => void
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("message_liked", callback);
    return () => sock.off("message_liked", callback);
  }
  return () => {};
};

/**
 * Listen for new comments
 */
export const onCommentAdded = (
  callback: (comment: ICommentThread) => void
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("comment_added", callback);
    return () => sock.off("comment_added", callback);
  }
  return () => {};
};

/**
 * Listen for participant joined
 */
export const onParticipantJoined = (
  callback: (participant: IConversationParticipant) => void
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("participant_joined", callback);
    return () => sock.off("participant_joined", callback);
  }
  return () => {};
};

/**
 * Listen for participant left
 */
export const onParticipantLeft = (
  callback: (data: { userId: string }) => void
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("participant_left", callback);
    return () => sock.off("participant_left", callback);
  }
  return () => {};
};

// ==================== EMIT EVENTS ====================

/**
 * Send a message via socket (real-time)
 */
export const emitSendMessage = (data: {
  conversationId: string;
  type: string;
  content?: string;
  title?: string;
  attachments?: IAttachment[];
}): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("send_message", data);
  }
};

/**
 * Emit typing indicator
 */
export const emitTyping = (conversationId: string, isTyping: boolean): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("typing", {
      room: `conversation:${conversationId}`,
      isTyping,
    });
  }
};

/**
 * Emit mark message as read
 */
export const emitMarkMessageRead = (messageId: string): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("mark_message_read", { messageId });
  }
};

/**
 * Emit like message
 */
export const emitLikeMessage = (messageId: string): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("like_message", { messageId });
  }
};

/**
 * Emit add comment
 */
export const emitAddComment = (data: {
  messageId: string;
  text: string;
  parentId?: string;
}): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("add_comment", data);
  }
};

/**
 * Emit edit message
 */
export const emitEditMessage = (data: {
  messageId: string;
  content?: string;
  title?: string;
}): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("edit_message", data);
  }
};

/**
 * Emit delete message
 */
export const emitDeleteMessage = (messageId: string): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("delete_message", { messageId });
  }
};

/**
 * Emit add participant
 */
export const emitAddParticipant = (
  conversationId: string,
  userId: string
): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("add_participant", {
      conversationId,
      userId,
    });
  }
};
