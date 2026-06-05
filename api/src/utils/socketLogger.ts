/**
 * Socket Connection & Event Logger
 * Tracks all socket connections, disconnections, and messaging events
 * for debugging and monitoring purposes
 */

import { Socket } from "socket.io";

export enum SocketEventType {
  CONNECTION = "CONNECTION",
  DISCONNECTION = "DISCONNECTION",
  MESSAGE = "MESSAGE",
  NOTIFICATION = "NOTIFICATION",
  JOIN_ROOM = "JOIN_ROOM",
  LEAVE_ROOM = "LEAVE_ROOM",
  ERROR = "ERROR",
  TYPING = "TYPING",
  ONLINE_STATUS = "ONLINE_STATUS",
  CHAT = "CHAT",
  GROUP = "GROUP",
  COMMUNITY = "COMMUNITY",
}

interface SocketLogEntry {
  timestamp: Date;
  eventType: SocketEventType;
  userId?: string;
  socketId?: string;
  room?: string;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

const logs: SocketLogEntry[] = [];
const MAX_LOGS = 1000; // Keep last 1000 logs

export class SocketLogger {
  /**
   * Log socket connection
   */
  static logConnection(
    socket: Socket,
    userId: string,
    user?: Record<string, unknown>,
  ): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.CONNECTION,
      userId,
      socketId: socket.id,
      message: `✅ USER CONNECTED`,
      data: {
        email: user?.email,
        fullName: user?.fullNames,
        socketId: socket.id,
        userId,
      },
    };

    this.addLog(entry);
    console.log(
      `\n${"=".repeat(80)}\n` +
        `🟢 SOCKET CONNECTION ESTABLISHED\n` +
        `────────────────────────────────────────\n` +
        `⏰ Timestamp: ${entry.timestamp.toISOString()}\n` +
        `👤 User ID: ${userId}\n` +
        `📱 Socket ID: ${socket.id}\n` +
        `📧 Email: ${user?.email || "N/A"}\n` +
        `👥 Name: ${user?.fullNames || "N/A"}\n` +
        `🌐 Connected Rooms: user:${userId}\n` +
        `${"=".repeat(80)}\n`,
    );
  }

  /**
   * Log socket disconnection
   */
  static logDisconnection(
    userId: string,
    socketId: string,
    reason?: string,
  ): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.DISCONNECTION,
      userId,
      socketId,
      message: `❌ USER DISCONNECTED`,
      data: { reason: reason || "unknown" },
    };

    this.addLog(entry);
    console.log(
      `\n${"=".repeat(80)}\n` +
        `🔴 SOCKET DISCONNECTION\n` +
        `────────────────────────────────────────\n` +
        `⏰ Timestamp: ${entry.timestamp.toISOString()}\n` +
        `👤 User ID: ${userId}\n` +
        `📱 Socket ID: ${socketId}\n` +
        `❌ Reason: ${reason || "No reason provided"}\n` +
        `${"=".repeat(80)}\n`,
    );
  }

  /**
   * Log message events (send, edit, delete, like, read)
   */
  static logMessage(
    eventSubType: string,
    userId: string,
    socketId: string,
    conversationId: string,
    data?: Record<string, unknown>,
  ): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.MESSAGE,
      userId,
      socketId,
      room: `conversation:${conversationId}`,
      message: `📨 ${eventSubType.toUpperCase()}`,
      data,
    };

    this.addLog(entry);
    console.log(
      `📨 MESSAGE EVENT: ${eventSubType.toUpperCase()}\n` +
        `   ⏰ ${entry.timestamp.toISOString()}\n` +
        `   👤 User: ${userId}\n` +
        `   💬 Conversation: ${conversationId}\n` +
        `   📋 Details: ${JSON.stringify(data, null, 2)}\n`,
    );
  }

  /**
   * Log chat room activities
   */
  static logChat(
    action: string,
    userId: string,
    socketId: string,
    chatId: string,
    data?: Record<string, unknown>,
  ): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.CHAT,
      userId,
      socketId,
      room: `chat:${chatId}`,
      message: `💬 CHAT: ${action}`,
      data,
    };

    this.addLog(entry);
    console.log(
      `\n💬 CHAT EVENT: ${action.toUpperCase()}\n` +
        `   ⏰ ${entry.timestamp.toISOString()}\n` +
        `   👤 User: ${userId}\n` +
        `   🏠 Chat: ${chatId}\n` +
        `   📋 Data: ${JSON.stringify(data, null, 2)}\n`,
    );
  }

  /**
   * Log group activities
   */
  static logGroup(
    action: string,
    userId: string,
    socketId: string,
    groupId: string,
    data?: Record<string, unknown>,
  ): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.GROUP,
      userId,
      socketId,
      room: `group:${groupId}`,
      message: `👥 GROUP: ${action}`,
      data,
    };

    this.addLog(entry);
    console.log(
      `\n👥 GROUP EVENT: ${action.toUpperCase()}\n` +
        `   ⏰ ${entry.timestamp.toISOString()}\n` +
        `   👤 User: ${userId}\n` +
        `   🏢 Group: ${groupId}\n` +
        `   📋 Data: ${JSON.stringify(data, null, 2)}\n`,
    );
  }

  /**
   * Log community activities
   */
  static logCommunity(
    action: string,
    userId: string,
    socketId: string,
    communityId: string,
    data?: Record<string, unknown>,
  ): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.COMMUNITY,
      userId,
      socketId,
      room: `community:${communityId}`,
      message: `🌐 COMMUNITY: ${action}`,
      data,
    };

    this.addLog(entry);
    console.log(
      `\n🌐 COMMUNITY EVENT: ${action.toUpperCase()}\n` +
        `   ⏰ ${entry.timestamp.toISOString()}\n` +
        `   👤 User: ${userId}\n` +
        `   🌍 Community: ${communityId}\n` +
        `   📋 Data: ${JSON.stringify(data, null, 2)}\n`,
    );
  }

  /**
   * Log room join/leave events
   */
  static logRoomEvent(
    action: "join" | "leave",
    userId: string,
    socketId: string,
    room: string,
  ): void {
    const isJoin = action === "join";
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: isJoin
        ? SocketEventType.JOIN_ROOM
        : SocketEventType.LEAVE_ROOM,
      userId,
      socketId,
      room,
      message: isJoin ? `🚪 JOINED ROOM` : `🚪 LEFT ROOM`,
    };

    this.addLog(entry);
    console.log(
      `🚪 ${isJoin ? "JOINED" : "LEFT"} ROOM\n` +
        `   ⏰ ${entry.timestamp.toISOString()}\n` +
        `   👤 User: ${userId}\n` +
        `   📍 Room: ${room}\n`,
    );
  }

  /**
   * Log typing indicators
   */
  static logTyping(
    userId: string,
    socketId: string,
    room: string,
    isTyping: boolean,
  ): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.TYPING,
      userId,
      socketId,
      room,
      message: isTyping ? `⌨️ TYPING` : `⌨️ STOPPED TYPING`,
    };

    this.addLog(entry);
    if (isTyping) {
      console.log(`⌨️  ${userId} is typing in ${room}`);
    }
  }

  /**
   * Log online status changes
   */
  static logOnlineStatus(userId: string, isOnline: boolean): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.ONLINE_STATUS,
      userId,
      message: isOnline ? `🟢 ONLINE` : `🔴 OFFLINE`,
    };

    this.addLog(entry);
    console.log(
      `${isOnline ? "🟢" : "🔴"} User ${userId} is now ${isOnline ? "ONLINE" : "OFFLINE"}`,
    );
  }

  /**
   * Log notification events
   */
  static logNotification(
    userId: string,
    socketId: string,
    notificationType: string,
    data?: Record<string, unknown>,
  ): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.NOTIFICATION,
      userId,
      socketId,
      message: `🔔 NOTIFICATION: ${notificationType}`,
      data,
    };

    this.addLog(entry);
    console.log(
      `\n🔔 NOTIFICATION\n` +
        `   ⏰ ${entry.timestamp.toISOString()}\n` +
        `   👤 To User: ${userId}\n` +
        `   📢 Type: ${notificationType}\n` +
        `   📋 Data: ${JSON.stringify(data, null, 2)}\n`,
    );
  }

  /**
   * Log errors
   */
  static logError(
    error: Error | Record<string, unknown>,
    userId: string,
    socketId: string,
    context: string,
  ): void {
    const entry: SocketLogEntry = {
      timestamp: new Date(),
      eventType: SocketEventType.ERROR,
      userId,
      socketId,
      message: `❌ ERROR: ${context}`,
      error: error instanceof Error ? error.message : JSON.stringify(error),
    };

    this.addLog(entry);
    console.error(
      `\n${"⚠️".repeat(40)}\n` +
        `❌ SOCKET ERROR\n` +
        `────────────────────────────────────────\n` +
        `⏰ Timestamp: ${entry.timestamp.toISOString()}\n` +
        `👤 User: ${userId}\n` +
        `📱 Socket: ${socketId}\n` +
        `🔴 Context: ${context}\n` +
        `📝 Error: ${error?.message || JSON.stringify(error)}\n` +
        `${"⚠️".repeat(40)}\n`,
    );
  }

  /**
   * Add log entry with rotation
   */
  private static addLog(entry: SocketLogEntry): void {
    logs.push(entry);
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }
  }

  /**
   * Get all logs
   */
  static getLogs(): SocketLogEntry[] {
    return [...logs];
  }

  /**
   * Get logs by user
   */
  static getLogsByUser(userId: string): SocketLogEntry[] {
    return logs.filter((log) => log.userId === userId);
  }

  /**
   * Get logs by event type
   */
  static getLogsByEventType(eventType: SocketEventType): SocketLogEntry[] {
    return logs.filter((log) => log.eventType === eventType);
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    logs.length = 0;
    console.log("🗑️  All socket logs cleared");
  }

  /**
   * Print summary of current connections
   */
  static printSummary(io: Record<string, unknown>): void {
    const connectionLogs = logs.filter(
      (l) => l.eventType === SocketEventType.CONNECTION,
    );
    const disconnectionLogs = logs.filter(
      (l) => l.eventType === SocketEventType.DISCONNECTION,
    );

    const engine = (io as Record<string, unknown>).engine;
    const clientCount =
      ((engine as Record<string, unknown>)?.clientsCount as number) || 0;

    console.log(
      `\n${"=".repeat(80)}\n` +
        `📊 SOCKET CONNECTION SUMMARY\n` +
        `────────────────────────────────────────\n` +
        `✅ Total Connections: ${connectionLogs.length}\n` +
        `❌ Total Disconnections: ${disconnectionLogs.length}\n` +
        `👥 Active Sockets: ${clientCount}\n` +
        `💬 Total Messages: ${logs.filter((l) => l.eventType === SocketEventType.MESSAGE).length}\n` +
        `👥 Total Groups: ${logs.filter((l) => l.eventType === SocketEventType.GROUP).length}\n` +
        `🌐 Total Communities: ${logs.filter((l) => l.eventType === SocketEventType.COMMUNITY).length}\n` +
        `${"=".repeat(80)}\n`,
    );
  }

  /**
   * Print recent logs
   */
  static printRecent(count: number = 20): void {
    const recent = logs.slice(-count);
    console.log(
      `\n${"=".repeat(80)}\n` +
        `📋 RECENT SOCKET EVENTS (Last ${count})\n` +
        `────────────────────────────────────────\n`,
    );

    recent.forEach((log, index) => {
      console.log(
        `${index + 1}. [${log.timestamp.toISOString()}] ${log.message || log.eventType}`,
      );
      if (log.userId) console.log(`   User: ${log.userId}`);
      if (log.room) console.log(`   Room: ${log.room}`);
      if (log.error) console.log(`   Error: ${log.error}`);
    });

    console.log(`${"=".repeat(80)}\n`);
  }
}
