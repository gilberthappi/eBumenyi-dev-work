import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocketBaseURL } from '@/config/api.config';

/**
 * Simplified Socket.IO Service
 * Clean API for socket operations with React Query integration
 *
 * Key Features:
 * - Simple emit/on/off API
 * - Automatic reconnection
 * - Works seamlessly with React Query for cache invalidation
 *
 * Usage:
 * SocketService.emit('message:send', { chatId, content })
 * SocketService.on('message:created', callback)
 * SocketService.off('message:created')
 */
export class SocketService {
  private static instance: Socket | null = null;
  private static isInitializing = false;
  private static directSocket: Socket | null = null;
  private static groupSocket: Socket | null = null;
  private static communitySocket: Socket | null = null;
  private static isInitializingNamespaces = false;

  /**
   * Initialize socket connection with authentication
   */
  static async initialize(): Promise<Socket | null> {
    // Return existing connection
    if (this.instance?.connected) {
      return this.instance;
    }

    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      let retries = 0;
      while (this.isInitializing && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
        if (this.instance?.connected) {
          return this.instance;
        }
      }
      return this.instance || null;
    }

    this.isInitializing = true;

    try {
      // Get authentication token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('⏭️ Skipping socket init - no auth token');
        return null;
      }

      const cleanToken = token.replace(/^Bearer\s+/i, '');
      const socketURL = getSocketBaseURL();

      console.log(`🔌 Socket connecting to ${socketURL}`);

      // Create socket connection
      this.instance = io(socketURL, {
        auth: { token: cleanToken },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
        forceNew: false,
      });

      // Setup event listeners
      this._setupEventListeners();

      return this.instance;
    } catch (error) {
      console.log('❌ Socket init failed:', error);
      this.instance = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Setup core socket event listeners
   */
  private static _setupEventListeners() {
    if (!this.instance) return;

    const socket = this.instance;

    socket.on('connect', () => {
      console.log(`✅ Socket connected (ID: ${socket.id})`);
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`❌ Socket disconnected: ${reason}`);
    });

    socket.on('connect_error', (error: any) => {
      console.log(`⚠️ Socket error:`, error.message);
    });

    socket.on('error', (error: any) => {
      console.log(`❌ Socket error:`, error);
    });
  }

  static async initializeNamespaces(): Promise<void> {
    if (this.isInitializingNamespaces) return;

    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return;

    const cleanToken = token.replace(/^Bearer\s+/i, '');
    const socketURL = getSocketBaseURL();

    this.isInitializingNamespaces = true;

    try {
      const nsOptions = {
        auth: { token: cleanToken },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'] as ['websocket', 'polling'],
        forceNew: false,
      };

      if (!this.directSocket?.connected) {
        this.directSocket = io(`${socketURL}/direct`, nsOptions);
        this.directSocket.on('connect', () =>
          console.log(`✅ [/direct] Socket connected (ID: ${this.directSocket!.id})`),
        );
        this.directSocket.on('disconnect', (reason: string) =>
          console.log(`❌ [/direct] Socket disconnected: ${reason}`),
        );
        this.directSocket.on('connect_error', (error: any) =>
          console.log(`⚠️ [/direct] Socket error:`, error.message),
        );
      }

      if (!this.groupSocket?.connected) {
        this.groupSocket = io(`${socketURL}/group`, nsOptions);
        this.groupSocket.on('connect', () =>
          console.log(`✅ [/group] Socket connected (ID: ${this.groupSocket!.id})`),
        );
        this.groupSocket.on('disconnect', (reason: string) =>
          console.log(`❌ [/group] Socket disconnected: ${reason}`),
        );
        this.groupSocket.on('connect_error', (error: any) =>
          console.log(`⚠️ [/group] Socket error:`, error.message),
        );
      }

      if (!this.communitySocket?.connected) {
        this.communitySocket = io(`${socketURL}/community`, nsOptions);
        this.communitySocket.on('connect', () =>
          console.log(`✅ [/community] Socket connected (ID: ${this.communitySocket!.id})`),
        );
        this.communitySocket.on('disconnect', (reason: string) =>
          console.log(`❌ [/community] Socket disconnected: ${reason}`),
        );
        this.communitySocket.on('connect_error', (error: any) =>
          console.log(`⚠️ [/community] Socket error:`, error.message),
        );
      }
    } finally {
      this.isInitializingNamespaces = false;
    }
  }

  static getDirectSocket(): Socket | null {
    return this.directSocket;
  }

  static getGroupSocket(): Socket | null {
    return this.groupSocket;
  }

  static getCommunitySocket(): Socket | null {
    return this.communitySocket;
  }

  static disconnectNamespaces(): void {
    if (this.directSocket) {
      this.directSocket.disconnect();
      this.directSocket = null;
    }
    if (this.groupSocket) {
      this.groupSocket.disconnect();
      this.groupSocket = null;
    }
    if (this.communitySocket) {
      this.communitySocket.disconnect();
      this.communitySocket = null;
    }
  }

  /**
   * Get current socket instance
   */
  static getInstance(): Socket | null {
    return this.instance;
  }

  /**
   * Check if socket is currently connected
   */
  static isConnected(): boolean {
    return this.instance?.connected ?? false;
  }

  /**
   * Log current socket connection status
   */
  static logStatus(): void {
    const connected = this.isConnected();
    const status = connected ? '✅ CONNECTED' : '❌ DISCONNECTED';
    console.log(`[Socket Status] ${status}`);
    if (this.instance) {
      console.log('  ID:', this.instance.id);
      console.log('  Connected:', this.instance.connected);
      console.log('  Timestamp:', new Date().toISOString());
    } else {
      console.log('  Instance: Not initialized');
    }
  }

  /**
   * Disconnect and cleanup socket connection
   */
  static disconnect(): void {
    if (this.instance) {
      console.log('Disconnecting socket...');
      this.instance.disconnect();
      this.instance = null;
    }
  }

  /**
   * Emit event to socket server
   */
  static emit(event: string, data?: any): void {
    if (!this.instance?.connected) {
      console.warn(`Socket not connected, cannot emit: ${event}`);
      return;
    }
    this.instance.emit(event, data);
  }

  /**
   * Listen for socket events
   */
  static on(event: string, callback: (...args: any[]) => void): void {
    if (!this.instance) {
      console.warn('Socket not initialized');
      return;
    }
    this.instance.on(event, callback);
  }

  /**
   * Remove event listener
   */
  static off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.instance) return;
    if (callback) {
      this.instance.off(event, callback);
    } else {
      this.instance.removeAllListeners(event);
    }
  }

  /**
   * Join a room
   */
  static join(room: string): void {
    if (!this.instance?.connected) {
      console.warn('Socket not connected, cannot join room');
      return;
    }
    this.instance.emit('join', { room });
  }

  /**
   * Leave a room
   */
  static leave(room: string): void {
    if (!this.instance?.connected) {
      console.warn('Socket not connected, cannot leave room');
      return;
    }
    this.instance.emit('leave', { room });
  }

  /**
   * Reconnect socket
   */
  static reconnect(): void {
    if (this.instance) {
      this.instance.connect();
    }
  }
}

export default SocketService;
