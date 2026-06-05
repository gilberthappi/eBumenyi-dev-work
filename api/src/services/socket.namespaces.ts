/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as SocketIOServer, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { SocketService } from "./socket.service";
import { DirectChatService } from "./directChatService";
import { GroupChatService } from "./groupChatService";
import { CommunityService } from "./communityService";
import { SocketLogger } from "../utils/socketLogger";
import AppError from "../utils/error";
import { CacheService } from "./cacheService";

export class ChatNamespaces {
  constructor(
    private io: SocketIOServer,
    private socketService: SocketService,
    private prisma: PrismaClient = new PrismaClient(),
  ) {}

  /**
   * JWT auth middleware factory for named namespaces.
   * this.io.use() only covers the main namespace (/); each named namespace
   * needs its own middleware or socket.data.userId will be undefined.
   */
  private createAuthMiddleware() {
    return async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token =
          socket.handshake.auth.token ||
          (socket.handshake.query.token as string);
        if (!token) {
          console.error(
            `[NS AUTH] ❌ No token for socket ${socket.id} on ${socket.nsp.name}`,
          );
          return next(new Error("Authentication required"));
        }
        const cleanToken = token
          .replace(/^Bearer\s+/i, "")
          .replace(/^"|"$/g, "")
          .trim();
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET!) as {
          id?: string;
          userId?: string;
        };
        const userId = decoded.id || decoded.userId;
        if (!userId) {
          return next(new Error("Invalid token: missing user id"));
        }
        socket.data.userId = userId;
        console.log(
          `[NS AUTH] ✅ Authenticated socket ${socket.id} as user ${userId} on ${socket.nsp.name}`,
        );
        next();
      } catch (err: any) {
        console.error(
          `[NS AUTH] ❌ Token verification failed for socket ${socket.id} on ${socket.nsp.name}:`,
          err.message,
        );
        next(new Error("Invalid token"));
      }
    };
  }

  /**
   * Setup all chat namespaces: /direct, /group, /community
   */
  public setupNamespaces() {
    this.setupDirectChatNamespace();
    this.setupGroupChatNamespace();
    this.setupCommunityNamespace();
  }

  /**
   * /direct namespace - 1-to-1 direct messaging
   */
  private setupDirectChatNamespace() {
    const directNs = this.io.of("/direct");
    directNs.use(this.createAuthMiddleware());

    directNs.on("connection", async (socket: Socket) => {
      const userId = socket.data.userId;
      const socketId = socket.id;

      console.log(
        `[DIRECT NS] 🔌 Client connected: ${socket.id}, user: ${socket.data.userId}`,
      );

      // Join user's personal room for notifications
      socket.join(`user:${userId}`);

      // Join a direct chat room
      socket.on("join", (chatId: string) => {
        socket.join(`direct:${chatId}`);
        SocketLogger.logRoomEvent("join", userId, socketId, `direct:${chatId}`);
      });

      // Leave a direct chat room
      socket.on("leave", (chatId: string) => {
        socket.leave(`direct:${chatId}`);
        SocketLogger.logRoomEvent(
          "leave",
          userId,
          socketId,
          `direct:${chatId}`,
        );
      });

      // Unified action handler
      socket.on("action", async (data: any) => {
        try {
          const { action, chatId, payload } = data;

          console.log(
            `[DIRECT NS] 🔑 Action '${action}' — socket: ${socket.id}, userId: ${userId}, chatId: ${chatId}`,
          );

          if (!userId) {
            console.error(
              `[DIRECT NS] ❌ userId is undefined — auth middleware may not have run`,
            );
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          let result;

          switch (action) {
            case "send":
              result = await DirectChatService.sendMessage(
                chatId,
                userId,
                payload.content,
                payload.type || "text",
                payload.attachments,
                this.io,
              );
              console.log(
                `[DIRECT NS] 📢 Broadcasting message:created to room: direct:${chatId}`,
              );
              directNs.to(`direct:${chatId}`).emit("message:created", result);
              // Invalidate cache after message creation
              CacheService.getInstance()
                .clearChat(chatId, "direct")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "read":
              result = await DirectChatService.markMessageAsRead(
                payload.messageId,
                userId,
              );
              console.log(
                `[DIRECT] ✅ Emitting message:read to room direct:${chatId}`,
              );
              directNs
                .to(`direct:${chatId}`)
                .emit("message:read", { messageId: payload.messageId, userId });
              break;

            case "like":
              result = await DirectChatService.toggleLike(
                payload.messageId,
                userId,
              );
              console.log(
                `[DIRECT] ✅ Emitting message:liked to room direct:${chatId}`,
              );
              directNs.to(`direct:${chatId}`).emit("message:liked", {
                messageId: payload.messageId,
                userId,
                liked: result.liked,
              });
              // Invalidate cache after like toggle
              CacheService.getInstance()
                .clearChat(chatId, "direct")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "edit":
              result = await DirectChatService.editMessage(
                payload.messageId,
                userId,
                payload.content,
              );
              console.log(
                `[DIRECT] ✅ Emitting message:edited to room direct:${chatId}`,
              );
              directNs.to(`direct:${chatId}`).emit("message:edited", result);
              // Invalidate cache after message edit
              CacheService.getInstance()
                .clearChat(chatId, "direct")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "delete":
              result = await DirectChatService.deleteMessage(
                payload.messageId,
                userId,
              );
              console.log(
                `[DIRECT] ✅ Emitting message:deleted to room direct:${chatId}`,
              );
              directNs
                .to(`direct:${chatId}`)
                .emit("message:deleted", { messageId: payload.messageId });
              // Invalidate cache after message deletion
              CacheService.getInstance()
                .clearChat(chatId, "direct")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            default:
              throw new AppError(`Unknown action: ${action}`, 400);
          }

          SocketLogger.logMessage(
            `direct:${action}`,
            userId,
            socketId,
            chatId,
            { payload },
          );
        } catch (error) {
          SocketLogger.logError(
            error as Error,
            userId,
            socketId,
            `direct:action`,
          );
          socket.emit("error", {
            message:
              error instanceof AppError ? error.message : "Action failed",
          });
        }
      });

      // Typing indicator — fetch user data from DB for accuracy
      socket.on("typing", async (data: { chatId: string; isTyping: boolean; userName?: string; userPhoto?: string }) => {
        try {
          // Fetch fresh user data from database to ensure photo is current
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { fullNames: true, photo: true }
          });

          const userName = user?.fullNames || data.userName || 'Unknown';
          const userPhoto = user?.photo || data.userPhoto || null;

          console.log(`⌨️ [DIRECT] User ${userId} typing in ${data.chatId}:`, {
            isTyping: data.isTyping,
            userName,
            userPhoto,
            hasPhoto: !!userPhoto,
            source: user ? 'database' : 'client'
          });

          socket
            .to(`direct:${data.chatId}`)
            .emit("user:typing", { 
              userId, 
              isTyping: data.isTyping, 
              userName,
              userPhoto
            });
        } catch (error) {
          console.error(`⌨️ [DIRECT] Error handling typing event:`, error);
          // Fallback to client-provided data
          socket
            .to(`direct:${data.chatId}`)
            .emit("user:typing", { 
              userId, 
              isTyping: data.isTyping, 
              userName: data.userName,
              userPhoto: data.userPhoto
            });
        }
      });

      socket.on("disconnect", () => {
        console.log(`❌ [DIRECT] User ${userId} disconnected`);
      });
    });
  }

  /**
   * /group namespace - Multi-user group messaging
   */
  private setupGroupChatNamespace() {
    const groupNs = this.io.of("/group");
    groupNs.use(this.createAuthMiddleware());

    groupNs.on("connection", async (socket: Socket) => {
      const userId = socket.data.userId;
      const socketId = socket.id;

      console.log(
        `[GROUP NS] 🔌 Client connected: ${socket.id}, user: ${socket.data.userId}`,
      );

      socket.join(`user:${userId}`);

      socket.on("join", (groupId: string) => {
        socket.join(`group:${groupId}`);
        SocketLogger.logRoomEvent("join", userId, socketId, `group:${groupId}`);
      });

      socket.on("leave", (groupId: string) => {
        socket.leave(`group:${groupId}`);
        SocketLogger.logRoomEvent(
          "leave",
          userId,
          socketId,
          `group:${groupId}`,
        );
      });

      socket.on("action", async (data: any) => {
        try {
          const { action, groupId, payload } = data;

          console.log(
            `[GROUP NS] 🔑 Action '${action}' — socket: ${socket.id}, userId: ${userId}, groupId: ${groupId}`,
          );

          if (!userId) {
            console.error(
              `[GROUP NS] ❌ userId is undefined — auth middleware may not have run`,
            );
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          let result;

          switch (action) {
            case "send":
              result = await GroupChatService.sendMessage(
                groupId,
                userId,
                payload.content,
                payload.type || "text",
                payload.attachments,
                this.io,
              );
              console.log(
                `[GROUP NS] 📢 Broadcasting message:created to room: group:${groupId}`,
              );
              groupNs.to(`group:${groupId}`).emit("message:created", result);
              // Invalidate cache after message creation
              CacheService.getInstance()
                .clearChat(groupId, "group")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "read":
              result = await GroupChatService.markMessageAsRead(
                payload.messageId,
                userId,
              );
              console.log(
                `[GROUP] ✅ Emitting message:read to room group:${groupId}`,
              );
              groupNs
                .to(`group:${groupId}`)
                .emit("message:read", { messageId: payload.messageId, userId });
              break;

            case "like":
              result = await GroupChatService.toggleLike(
                payload.messageId,
                userId,
              );
              console.log(
                `[GROUP] ✅ Emitting message:liked to room group:${groupId}`,
              );
              groupNs.to(`group:${groupId}`).emit("message:liked", {
                messageId: payload.messageId,
                userId,
                liked: result.liked,
              });
              // Invalidate cache after like toggle
              CacheService.getInstance()
                .clearChat(groupId, "group")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "comment":
              result = await GroupChatService.addComment(
                payload.messageId,
                userId,
                payload.text,
                payload.parentId,
              );
              console.log(
                `[GROUP] ✅ Emitting comment:created to room group:${groupId}`,
              );
              groupNs.to(`group:${groupId}`).emit("comment:created", result);
              // Invalidate cache after comment creation
              CacheService.getInstance()
                .clearChat(groupId, "group")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "comment:edit":
              result = await GroupChatService.editComment(
                payload.commentId,
                userId,
                payload.text,
              );
              console.log(
                `[GROUP] ✅ Emitting comment:edited to room group:${groupId}`,
              );
              groupNs.to(`group:${groupId}`).emit("comment:edited", result);
              // Invalidate cache after comment edit
              CacheService.getInstance()
                .clearChat(groupId, "group")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "comment:delete":
              result = await GroupChatService.deleteComment(
                payload.commentId,
                userId,
              );
              console.log(
                `[GROUP] ✅ Emitting comment:deleted to room group:${groupId}`,
              );
              groupNs
                .to(`group:${groupId}`)
                .emit("comment:deleted", { commentId: payload.commentId });
              // Invalidate cache after comment deletion
              CacheService.getInstance()
                .clearChat(groupId, "group")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "edit":
              result = await GroupChatService.editMessage(
                payload.messageId,
                userId,
                payload.content,
              );
              console.log(
                `[GROUP] ✅ Emitting message:edited to room group:${groupId}`,
              );
              groupNs.to(`group:${groupId}`).emit("message:edited", result);
              // Invalidate cache after message edit
              CacheService.getInstance()
                .clearChat(groupId, "group")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "delete":
              result = await GroupChatService.deleteMessage(
                payload.messageId,
                userId,
              );
              console.log(
                `[GROUP] ✅ Emitting message:deleted to room group:${groupId}`,
              );
              groupNs
                .to(`group:${groupId}`)
                .emit("message:deleted", { messageId: payload.messageId });
              // Invalidate cache after message deletion
              CacheService.getInstance()
                .clearChat(groupId, "group")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "add-participant":
              result = await GroupChatService.addParticipant(
                groupId,
                payload.userIdToAdd,
                userId,
              );
              console.log(
                `[GROUP] ✅ Emitting participant:added to room group:${groupId}`,
              );
              groupNs.to(`group:${groupId}`).emit("participant:added", result);
              console.log(
                `[GROUP] ✅ Emitting group:invited to user:${payload.userIdToAdd}`,
              );
              groupNs.to(`user:${payload.userIdToAdd}`).emit("group:invited", {
                groupId,
                groupName: payload.groupName,
              });
              break;

            case "remove-participant":
              result = await GroupChatService.removeParticipant(
                groupId,
                payload.userIdToRemove,
                userId,
              );
              console.log(
                `[GROUP] ✅ Emitting participant:removed to room group:${groupId}`,
              );
              groupNs.to(`group:${groupId}`).emit("participant:removed", {
                userId: payload.userIdToRemove,
              });
              break;

            default:
              throw new AppError(`Unknown action: ${action}`, 400);
          }

          SocketLogger.logMessage(
            `group:${action}`,
            userId,
            socketId,
            groupId,
            { payload },
          );
        } catch (error) {
          SocketLogger.logError(
            error as Error,
            userId,
            socketId,
            `group:action`,
          );
          socket.emit("error", {
            message:
              error instanceof AppError ? error.message : "Action failed",
          });
        }
      });

      // Typing indicator — fetch user data from DB for accuracy
      socket.on("typing", async (data: { groupId: string; isTyping: boolean; userName?: string; userPhoto?: string }) => {
        try {
          // Fetch fresh user data from database to ensure photo is current
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { fullNames: true, photo: true }
          });

          const userName = user?.fullNames || data.userName || 'Unknown';
          const userPhoto = user?.photo || data.userPhoto || null;

          console.log(`⌨️ [GROUP] User ${userId} typing in ${data.groupId}:`, {
            isTyping: data.isTyping,
            userName,
            userPhoto,
            hasPhoto: !!userPhoto,
            source: user ? 'database' : 'client'
          });

          socket
            .to(`group:${data.groupId}`)
            .emit("user:typing", { 
              userId, 
              isTyping: data.isTyping, 
              userName,
              userPhoto
            });
        } catch (error) {
          console.error(`⌨️ [GROUP] Error handling typing event:`, error);
          // Fallback to client-provided data
          socket
            .to(`group:${data.groupId}`)
            .emit("user:typing", { 
              userId, 
              isTyping: data.isTyping, 
              userName: data.userName,
              userPhoto: data.userPhoto
            });
        }
      });

      socket.on("disconnect", () => {
        console.log(`❌ [GROUP] User ${userId} disconnected`);
      });
    });
  }

  /**
   * /community namespace - Community discussions with blog posts
   */
  private setupCommunityNamespace() {
    const communityNs = this.io.of("/community");
    communityNs.use(this.createAuthMiddleware());

    communityNs.on("connection", async (socket: Socket) => {
      const userId = socket.data.userId;
      const socketId = socket.id;

      console.log(
        `[COMMUNITY NS] 🔌 Client connected: ${socket.id}, user: ${socket.data.userId}`,
      );

      socket.join(`user:${userId}`);

      socket.on("join", (communityId: string) => {
        socket.join(`community:${communityId}`);
        SocketLogger.logRoomEvent(
          "join",
          userId,
          socketId,
          `community:${communityId}`,
        );
      });

      socket.on("leave", (communityId: string) => {
        socket.leave(`community:${communityId}`);
        SocketLogger.logRoomEvent(
          "leave",
          userId,
          socketId,
          `community:${communityId}`,
        );
      });

      socket.on("action", async (data: any) => {
        try {
          const { action, communityId, payload } = data;

          console.log(
            `[COMMUNITY NS] 🔑 Action '${action}' — socket: ${socket.id}, userId: ${userId}, communityId: ${communityId}`,
          );

          if (!userId) {
            console.error(
              `[COMMUNITY NS] ❌ userId is undefined — auth middleware may not have run`,
            );
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          let result;

          switch (action) {
            case "post":
              result = await CommunityService.createPost(
                communityId,
                userId,
                payload.title,
                payload.content,
                payload.photo,
              );
              console.log(
                `[COMMUNITY NS] 📢 Broadcasting post:created to room: community:${communityId}`,
              );
              communityNs
                .to(`community:${communityId}`)
                .emit("post:created", result);
              // Invalidate cache after post creation
              CacheService.getInstance()
                .clearChat(communityId, "community")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "like":
              result = await CommunityService.togglePostLike(
                payload.postId,
                userId,
              );
              console.log(
                `[COMMUNITY] ✅ Emitting post:liked to room community:${communityId}`,
              );
              communityNs.to(`community:${communityId}`).emit("post:liked", {
                postId: payload.postId,
                userId,
                liked: result.liked,
              });
              // Invalidate cache after like toggle
              CacheService.getInstance()
                .clearChat(communityId, "community")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "comment":
              result = await CommunityService.addComment(
                payload.postId,
                userId,
                payload.text,
                payload.parentId,
              );
              console.log(
                `[COMMUNITY] ✅ Emitting comment:created to room community:${communityId}`,
              );
              communityNs
                .to(`community:${communityId}`)
                .emit("comment:created", result);
              // Invalidate cache after comment creation
              CacheService.getInstance()
                .clearChat(communityId, "community")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "comment:edit":
              result = await CommunityService.editComment(
                payload.commentId,
                userId,
                payload.text,
              );
              console.log(
                `[COMMUNITY] ✅ Emitting comment:edited to room community:${communityId}`,
              );
              communityNs
                .to(`community:${communityId}`)
                .emit("comment:edited", result);
              // Invalidate cache after comment edit
              CacheService.getInstance()
                .clearChat(communityId, "community")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "comment:delete":
              result = await CommunityService.deleteComment(
                payload.commentId,
                userId,
              );
              console.log(
                `[COMMUNITY] ✅ Emitting comment:deleted to room community:${communityId}`,
              );
              communityNs
                .to(`community:${communityId}`)
                .emit("comment:deleted", { commentId: payload.commentId });
              // Invalidate cache after comment deletion
              CacheService.getInstance()
                .clearChat(communityId, "community")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "edit-post":
              result = await CommunityService.editPost(
                payload.postId,
                userId,
                payload.title,
                payload.content,
              );
              console.log(
                `[COMMUNITY] ✅ Emitting post:edited to room community:${communityId}`,
              );
              communityNs
                .to(`community:${communityId}`)
                .emit("post:edited", result);
              // Invalidate cache after post edit
              CacheService.getInstance()
                .clearChat(communityId, "community")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "delete-post":
              result = await CommunityService.deletePost(
                payload.postId,
                userId,
              );
              console.log(
                `[COMMUNITY] ✅ Emitting post:deleted to room community:${communityId}`,
              );
              communityNs
                .to(`community:${communityId}`)
                .emit("post:deleted", { postId: payload.postId });
              // Invalidate cache after post deletion
              CacheService.getInstance()
                .clearChat(communityId, "community")
                .catch((err) =>
                  console.error("Cache invalidation error:", err),
                );
              break;

            case "add-member":
              result = await CommunityService.addMember(
                communityId,
                payload.userIdToAdd,
                userId,
              );
              console.log(
                `[COMMUNITY] ✅ Emitting member:added to room community:${communityId}`,
              );
              communityNs
                .to(`community:${communityId}`)
                .emit("member:added", result);
              console.log(
                `[COMMUNITY] ✅ Emitting community:invited to user:${payload.userIdToAdd}`,
              );
              // Notify the invited user
              this.io
                .of("/community")
                .to(`user:${payload.userIdToAdd}`)
                .emit("community:invited", {
                  communityId,
                  communityName: payload.communityName,
                });
              break;

            default:
              throw new AppError(`Unknown action: ${action}`, 400);
          }

          SocketLogger.logMessage(
            `community:${action}`,
            userId,
            socketId,
            communityId,
            { payload },
          );
        } catch (error) {
          SocketLogger.logError(
            error as Error,
            userId,
            socketId,
            `community:action`,
          );
          socket.emit("error", {
            message:
              error instanceof AppError ? error.message : "Action failed",
          });
        }
      });

      // Typing indicator — fetch user data from DB for accuracy
      socket.on("typing", async (data: { communityId: string; isTyping: boolean; userName?: string; userPhoto?: string }) => {
        try {
          // Fetch fresh user data from database to ensure photo is current
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { fullNames: true, photo: true }
          });

          const userName = user?.fullNames || data.userName || 'Unknown';
          const userPhoto = user?.photo || data.userPhoto || null;

          console.log(`⌨️ [COMMUNITY] User ${userId} typing in ${data.communityId}:`, {
            isTyping: data.isTyping,
            userName,
            userPhoto,
            hasPhoto: !!userPhoto,
            source: user ? 'database' : 'client'
          });

          socket
            .to(`community:${data.communityId}`)
            .emit("user:typing", { 
              userId, 
              isTyping: data.isTyping, 
              userName,
              userPhoto
            });
        } catch (error) {
          console.error(`⌨️ [COMMUNITY] Error handling typing event:`, error);
          // Fallback to client-provided data
          socket
            .to(`community:${data.communityId}`)
            .emit("user:typing", { 
              userId, 
              isTyping: data.isTyping, 
              userName: data.userName,
              userPhoto: data.userPhoto
            });
        }
      });

      socket.on("disconnect", () => {
        console.log(`❌ [COMMUNITY] User ${userId} disconnected`);
      });
    });
  }
}
