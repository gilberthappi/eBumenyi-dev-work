import { create } from 'zustand';

type ChatType = 'direct' | 'group' | 'community';

interface ActiveConversationState {
  conversationId: string | null;
  type: ChatType | null;
  setActiveConversation: (conversationId: string, type: ChatType) => void;
  clearActiveConversation: () => void;
  isActive: (conversationId: string) => boolean;
}

/**
 * Global state to track which conversation is currently being viewed.
 * Used to prevent unread count increments for messages received while user is actively viewing that chat.
 * 
 * WhatsApp-style behavior: Messages received in the active chat don't increment unread count.
 * 
 * Usage:
 * const { setActiveConversation, clearActiveConversation } = useActiveConversation();
 * 
 * // In chat screen:
 * useEffect(() => {
 *   setActiveConversation(chatId, 'direct');
 *   return () => clearActiveConversation();
 * }, [chatId]);
 */
export const useActiveConversation = create<ActiveConversationState>((set, get) => ({
  conversationId: null,
  type: null,
  
  setActiveConversation: (conversationId: string, type: ChatType) => {
    console.log(`🎯 [ActiveConversation] Setting active: ${type}:${conversationId}`);
    set({ conversationId, type });
  },
  
  clearActiveConversation: () => {
    const current = get();
    if (current.conversationId) {
      console.log(`🎯 [ActiveConversation] Clearing active: ${current.type}:${current.conversationId}`);
    }
    set({ conversationId: null, type: null });
  },
  
  isActive: (conversationId: string) => {
    return get().conversationId === conversationId;
  },
}));
