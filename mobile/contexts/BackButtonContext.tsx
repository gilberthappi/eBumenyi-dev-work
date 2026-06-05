import React, { createContext, useRef, useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';

type Handler = () => boolean;

const BackButtonContext = createContext<{
  registerHandler: (h: Handler) => void;
  unregisterHandler: (h: Handler) => void;
}>({ registerHandler: () => {}, unregisterHandler: () => {} });

export const BackButtonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handlers = useRef<Handler[]>([]);
  const router = useRouter();

  const registerHandler = useCallback((h: Handler) => {
    handlers.current.push(h);
  }, []);

  const unregisterHandler = useCallback((h: Handler) => {
    handlers.current = handlers.current.filter(fn => fn !== h);
  }, []);

  React.useEffect(() => {
    // Only install on native platforms where BackHandler exists
    if (Platform.OS === 'web') return;

    const onBack = () => {
      const fn = handlers.current[handlers.current.length - 1];
      if (fn) {
        try {
          const handled = fn();
          if (handled) return true;
        } catch (e) {
          // ignore handler errors and fall through
        }
      }

      // no screen-level handler handled it — navigate back in router stack
      try {
        router.back();
        return true; // we handled the event by navigating
      } catch (e) {
        // if router.back fails, fall through to default behavior
        return false;
      }
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [router]);

  return (
    <BackButtonContext.Provider value={{ registerHandler, unregisterHandler }}>
      {children}
    </BackButtonContext.Provider>
  );
};

export default BackButtonContext;
