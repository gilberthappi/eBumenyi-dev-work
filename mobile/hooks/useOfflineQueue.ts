import { useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { IMessage } from '@/types';
import * as MessagingAPI from '@/services/messaging.api';

interface PendingMessage extends Omit<IMessage, 'id' | 'createdAt' | 'updatedAt' | 'editedAt' | 'sender' | 'isDelivered'> {
  tempId: string;
  sentAt: number;
  retryCount: number;
  error?: string;
}

interface OfflineQueueState {
  queue: PendingMessage[];
  isOnline: boolean;
  isSyncing: boolean;
}

const OFFLINE_QUEUE_KEY = 'offline_message_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function useOfflineQueue({
  chatId,
  chatType = 'direct',
  onQueueChange,
  onSyncStart,
  onSyncComplete,
}: {
  chatId: string;
  chatType?: 'direct' | 'group' | 'community';
  onQueueChange?: (messages: PendingMessage[]) => void;
  onSyncStart?: () => void;
  onSyncComplete?: (success: boolean, error?: string) => void;
}) {
  const stateRef = useRef<OfflineQueueState>({
    queue: [],
    isOnline: true,
    isSyncing: false,
  });

  const callbacksRef = useRef({ onQueueChange, onSyncStart, onSyncComplete });

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = { onQueueChange, onSyncStart, onSyncComplete };
  }, [onQueueChange, onSyncStart, onSyncComplete]);

  const saveQueue = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const allQueues = stored ? JSON.parse(stored) : {};
      allQueues[chatId] = stateRef.current.queue;
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(allQueues));
    } catch (error) {
      console.log('❌ [OfflineQueue] Failed to save queue:', error);
    }
  }, [chatId]);

  const syncQueue = useCallback(async () => {
    if (stateRef.current.isSyncing || !stateRef.current.isOnline || stateRef.current.queue.length === 0) {
      return;
    }

    stateRef.current.isSyncing = true;
    callbacksRef.current.onSyncStart?.();

    try {
      const toSync = [...stateRef.current.queue];

      for (const message of toSync) {
        try {
          const response = await MessagingAPI.sendMessage(chatId, {
            type: message.type,
            content: message.content,
          }, chatType);

          if (response) {
            const index = stateRef.current.queue.findIndex(m => m.tempId === message.tempId);
            if (index !== -1) {
              stateRef.current.queue.splice(index, 1);
            }
            console.log(`✅ [OfflineQueue] Message synced: ${message.tempId}`);
          }
        } catch (error) {
          message.retryCount++;
          message.error = String(error);

          if (message.retryCount >= MAX_RETRIES) {
            console.log(`❌ [OfflineQueue] Failed after ${MAX_RETRIES} retries: ${message.tempId}`);
          } else {
            console.warn(`⚠️ [OfflineQueue] Retry ${message.retryCount}/${MAX_RETRIES}: ${message.tempId}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * message.retryCount));
          }
        }
      }

      await saveQueue();
      callbacksRef.current.onQueueChange?.(stateRef.current.queue);
      callbacksRef.current.onSyncComplete?.(true);
    } catch (error) {
      console.log('❌ [OfflineQueue] Sync failed:', error);
      callbacksRef.current.onSyncComplete?.(false, String(error));
    } finally {
      stateRef.current.isSyncing = false;
    }
  }, [chatId, chatType, saveQueue]);

  // Load queue
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (stored) {
          const allQueues = JSON.parse(stored);
          stateRef.current.queue = allQueues[chatId] || [];
          callbacksRef.current.onQueueChange?.(stateRef.current.queue);
        }
      } catch (error) {
        console.log('❌ [OfflineQueue] Failed to load queue:', error);
      }
    };

    loadQueue();
  }, [chatId]);

  // Monitor network
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = stateRef.current.isOnline;
      stateRef.current.isOnline = state.isConnected ?? true;

      console.log(`📡 [OfflineQueue] Network: ${stateRef.current.isOnline ? 'ONLINE' : 'OFFLINE'}`);

      if (!wasOnline && stateRef.current.isOnline && stateRef.current.queue.length > 0) {
        console.log(`🔄 [OfflineQueue] Syncing ${stateRef.current.queue.length} pending messages`);
        syncQueue();
      }
    });

    return () => unsubscribe();
  }, [syncQueue]);

  const addToQueue = useCallback(
    async (message: Omit<PendingMessage, 'tempId' | 'sentAt' | 'retryCount' | 'error'>) => {
      const pending: PendingMessage = {
        ...message,
        tempId: `temp_${Date.now()}_${Math.random()}`,
        sentAt: Date.now(),
        retryCount: 0,
      };

      stateRef.current.queue.push(pending);
      await saveQueue();
      callbacksRef.current.onQueueChange?.(stateRef.current.queue);

      console.log(`📤 [OfflineQueue] Message queued (${stateRef.current.queue.length} total)`);

      if (stateRef.current.isOnline) {
        await syncQueue();
      }

      return pending.tempId;
    },
    [saveQueue, syncQueue]
  );

  const getQueuedMessages = useCallback(() => [...stateRef.current.queue], []);

  const removeFromQueue = useCallback(
    async (tempId: string) => {
      const index = stateRef.current.queue.findIndex(m => m.tempId === tempId);
      if (index !== -1) {
        stateRef.current.queue.splice(index, 1);
        await saveQueue();
        callbacksRef.current.onQueueChange?.(stateRef.current.queue);
      }
    },
    [saveQueue]
  );

  const clearQueue = useCallback(async () => {
    stateRef.current.queue = [];
    await saveQueue();
    callbacksRef.current.onQueueChange?.([]);
    console.log(`🧹 [OfflineQueue] Queue cleared`);
  }, [saveQueue]);

  const retryFailed = useCallback(async () => {
    stateRef.current.queue.forEach(msg => {
      if (msg.retryCount >= MAX_RETRIES) {
        msg.retryCount = 0;
        msg.error = undefined;
      }
    });
    await saveQueue();
    await syncQueue();
  }, [saveQueue, syncQueue]);

  return {
    queuedMessages: stateRef.current.queue,
    isOnline: stateRef.current.isOnline,
    isSyncing: stateRef.current.isSyncing,
    addToQueue,
    getQueuedMessages,
    removeFromQueue,
    clearQueue,
    syncQueue,
    retryFailed,
  };
}
