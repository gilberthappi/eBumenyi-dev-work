import React, { createContext, useContext, useState, useCallback } from 'react';
import { IConversation } from '@/types';

/**
 * Simplified Messaging Context
 * ONLY handles:
 * - Which conversation is currently selected
 * - Conversation management (CRUD)
 * 
 * Does NOT handle (moved to per-room hooks):
 * - Message state (messages, typing, participants)
 * - Socket event listeners (14 global listeners removed)
 * - Message operations (now in per-room hooks)
 * 
 * This reduces context from 788 lines → ~150 lines
 * Eliminates confusion about source of truth
 */

interface SimplifiedMessagingContextType {
  // Only conversation selection
  currentChatId: string | null;
  currentChatType: 'direct' | 'group' | 'community' | null;
  selectChat: (chatId: string, chatType: 'direct' | 'group' | 'community') => void;
  
  // Conversation list (minimal, just for navigation)
  conversations: IConversation[];
  setConversations: (conversations: IConversation[]) => void;
}

const SimplifiedMessagingContext = createContext<SimplifiedMessagingContextType | undefined>(undefined);

export function SimplifiedMessagingProvider({ children }: { children: React.ReactNode }) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatType, setCurrentChatType] = useState<'direct' | 'group' | 'community' | null>(null);
  const [conversations, setConversations] = useState<IConversation[]>([]);

  const selectChat = useCallback(
    (chatId: string, chatType: 'direct' | 'group' | 'community') => {
      console.log(`📌 [MessagingContext] Selected chat: ${chatId} (${chatType})`);
      setCurrentChatId(chatId);
      setCurrentChatType(chatType);
    },
    []
  );

  return (
    <SimplifiedMessagingContext.Provider
      value={{
        currentChatId,
        currentChatType,
        selectChat,
        conversations,
        setConversations,
      }}
    >
      {children}
    </SimplifiedMessagingContext.Provider>
  );
}

export function useSimplifiedMessagingContext() {
  const context = useContext(SimplifiedMessagingContext);
  if (!context) {
    throw new Error('useSimplifiedMessagingContext must be used within SimplifiedMessagingProvider');
  }
  return context;
}
