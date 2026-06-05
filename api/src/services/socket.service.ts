/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { SocketLogger } from "../utils/socketLogger";

export class SocketService {
  private io: Server;
  private prisma: PrismaClient;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds
  private userLastSeen: Map<string, Date> = new Map(); // userId -> lastSeen timestamp

  constructor(io: Server) {
    this.io = io;
    this.prisma = new PrismaClient();
    this.setupMiddleware();
    // Don't setup connection handlers here - let the app handle that
  }

  private setupMiddleware() {
    this.io.use(async (socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          (socket.handshake.query.token as string);

        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        // JWT payload has 'id', not 'userId'
        const userId = decoded.id || decoded.userId;

        if (!userId) {
          return next(new Error("Invalid token: missing user id"));
        }

        socket.data.userId = userId;
        socket.data.user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, fullNames: true },
        });

        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication error"));
      }
    });
  }

  /**
   * Setup default event handlers for a socket
   * Called by the app after connection
   */
  public setupDefaultHandlers(socket: Socket) {
    const userId = socket.data.userId;

    // Join room for specific entity
    socket.on("join", (room: string) => {
      socket.join(room);
      SocketLogger.logRoomEvent("join", userId, socket.id, room);
    });

    // Leave room
    socket.on("leave", (room: string) => {
      socket.leave(room);
      SocketLogger.logRoomEvent("leave", userId, socket.id, room);
    });

    // Typing indicator
    socket.on(
      "typing",
      (data: {
        room: string;
        isTyping: boolean;
        userName?: string;
        userPhoto?: string;
      }) => {
        SocketLogger.logTyping(userId, socket.id, data.room, data.isTyping);
        socket.to(data.room).emit("typing", {
          userId: userId,
          isTyping: data.isTyping,
          userName: data.userName,
          userPhoto: data.userPhoto,
        });
      },
    );
  }

  /**
   * Track user socket connection
   */
  public trackUserConnection(userId: string, socketId: string) {
    this.addUserSocket(userId, socketId);
    this.broadcastUserStatus(userId, true);
    SocketLogger.logOnlineStatus(userId, true);
  }

  /**
   * Track user socket disconnection
   */
  public trackUserDisconnection(
    userId: string,
    socketId: string,
    reason: string,
  ) {
    this.removeUserSocket(userId, socketId);
    // Update last seen time when user goes offline
    this.setUserLastSeen(userId, new Date());
    this.broadcastUserStatus(userId, false);
    SocketLogger.logDisconnection(userId, socketId, reason);
    SocketLogger.logOnlineStatus(userId, false);
  }

  // Room management
  public getEntityRoom(entity: string, id: string): string {
    return `${entity}:${id}`;
  }

  public getUserRoom(userId: string): string {
    return this.getEntityRoom("user", userId);
  }

  public getConversationRoom(conversationId: string): string {
    return this.getEntityRoom("conversation", conversationId);
  }

  // User socket management
  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)?.push(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const index = sockets.indexOf(socketId);
      if (index > -1) {
        sockets.splice(index, 1);
      }
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  public isUserOnline(userId: string): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId)!.length > 0
    );
  }

  public getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public getUserLastSeen(userId: string): Date | null {
    return this.userLastSeen.get(userId) || null;
  }

  public setUserLastSeen(userId: string, date: Date = new Date()) {
    this.userLastSeen.set(userId, date);
  }

  // Emit methods
  public emitToUser(userId: string, event: string, data: any) {
    const room = this.getUserRoom(userId);
    console.log(
      `[SOCKET SERVICE] Emitting '${event}' to user ${userId} in room ${room}`,
    );
    this.io.to(room).emit(event, data);
  }

  public emitToRoom(room: string, event: string, data: any) {
    console.log(`[SOCKET SERVICE] Emitting '${event}' to room ${room}`);
    this.io.to(room).emit(event, data);
  }

  public emitToAll(event: string, data: any) {
    console.log(
      `[SOCKET SERVICE] Broadcasting '${event}' to all connected users`,
    );
    this.io.emit(event, data);
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    if (isOnline) {
      this.io.emit("user:online", { userId });
    } else {
      const lastSeen =
        this.userLastSeen.get(userId)?.toISOString() ||
        new Date().toISOString();
      this.io.emit("user:offline", { userId, lastSeen });
    }
  }

  // Get socket instance for use in controllers
  public getIO(): Server {
    return this.io;
  }
}
