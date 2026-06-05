/**
 * Cross-tab/cross-port authentication synchronization
 * Uses BroadcastChannel API if available, falls back to localStorage polling
 */

type AuthSyncCallback = (event: 'login' | 'logout') => void;

let authChannel: BroadcastChannel | null = null;
const subscribers: Set<AuthSyncCallback> = new Set();

export const initAuthSync = () => {
  // Try to use BroadcastChannel API (works across tabs)
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      authChannel = new BroadcastChannel('auth-sync');
      authChannel.addEventListener('message', (event) => {
        console.log('📡 Received auth sync message:', event.data);
        subscribers.forEach((callback) => callback(event.data.type));
      });
      console.log('✅ BroadcastChannel auth sync initialized');
    } catch (error) {
      console.warn('⚠️ BroadcastChannel not available, falling back to storage events');
    }
  }
};

export const broadcastAuthChange = (type: 'login' | 'logout') => {
  if (authChannel) {
    authChannel.postMessage({ type, timestamp: Date.now() });
  }
  window.dispatchEvent(new CustomEvent('auth_change', { detail: type }));
  // Also trigger storage events for fallback
  if (type === 'login') {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'accessToken',
        newValue: localStorage.getItem('accessToken'),
        oldValue: null,
        storageArea: localStorage,
      })
    );
  } else if (type === 'logout') {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'accessToken',
        newValue: null,
        oldValue: 'removed',
        storageArea: localStorage,
      })
    );
  }
};

export const onAuthChange = (callback: AuthSyncCallback) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const cleanup = () => {
  if (authChannel) {
    authChannel.close();
  }
  subscribers.clear();
};
