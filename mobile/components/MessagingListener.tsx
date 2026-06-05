import { useEffect } from 'react';
import { useSimplifiedMessagingContext } from '@/contexts/SimplifiedMessagingContext';
import { SocketService } from '@/services/socket.service';

/**
 * Component that listens for real-time messaging via Socket.IO
 * Must be mounted in the root layout to monitor socket connection status
 */
export const MessagingListener = () => {
  const { conversations } = useSimplifiedMessagingContext();
  const socket = SocketService.getInstance();

  useEffect(() => {
    if (socket?.connected) {
      console.log('💬 [MessagingListener] ✅ Socket connected - ready for messaging');
    } else {
      console.log('💬 [MessagingListener] ❌ Socket disconnected');
    }
  }, [socket?.connected]);

  useEffect(() => {
    console.log('═'.repeat(60));
    console.log('📊 [MessagingListener] MESSAGING STATE SUMMARY:');
    console.log(`   🗂️  Total conversations: ${conversations.length}`);
    console.log(`   🔌 Socket status: ${socket?.connected ? 'Connected' : 'Disconnected'}`);
    console.log('═'.repeat(60));
  }, [conversations.length, socket?.connected]);

  // This component doesn't render anything, it just listens
  return null;
};

export default MessagingListener;
