import React, { useState, useRef, memo } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, TouchableOpacity, Share, Modal } from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { IMessage } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/auth';

interface CommunityPostBubbleProps {
  message: IMessage;
  onEdit?: (message: IMessage) => void;
  onDelete?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onViewComments?: (message: IMessage) => void;
}

function CommunityPostBubbleComponent({ message, onEdit, onDelete, onLike, onViewComments }: CommunityPostBubbleProps) {
  const { width } = useWindowDimensions();
  const responsiveStyles = getResponsiveStyles(width);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef<View>(null);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getMe(),
    staleTime: Infinity,
  });

  const isSent = message.senderId === currentUser?.id;
  
  // Derive like state from message data instead of local state
  // API returns 'likes' array with objects containing 'id' field
  const likeCount = (message.likes as any)?.length ?? 0;
  const isLiked = (message.likes as any)?.some((like: any) => like.id === currentUser?.id) ?? false;

  const handleMenuPress = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const menuX = pageX + width;
        const menuY = pageY + height;
        setMenuPosition({ x: menuX, y: menuY });
        setShowMenu(true);
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${message.sender?.fullNames || 'Someone'} posted: ${message.content}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleLike = () => {
    onLike?.(message.id);
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: message.sender?.photo }}
          style={[styles.senderAvatar, { width: responsiveStyles.avatarSize, height: responsiveStyles.avatarSize, borderRadius: responsiveStyles.avatarSize / 2 }]}
        />
        <View style={styles.senderInfo}>
          <Text style={[styles.senderName, { fontSize: responsiveStyles.senderNameSize }]}>
            {message.sender?.fullNames || 'Izina'}
          </Text>
          <Text style={[styles.timestamp, { fontSize: responsiveStyles.timestampSize }]}>
            {message?.timestamp ? formatMessageTime(message.timestamp) : 'Invalid time'}
          </Text>
        </View>
        <View ref={menuButtonRef} style={styles.menuButtonContainer}>
          {isSent && (
            <TouchableOpacity 
              onPress={handleMenuPress} 
              style={styles.menuButton}>
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.postContent}>
        <Text
          style={[styles.messageText, { fontSize: responsiveStyles.fontSize }]}
          numberOfLines={0}>
          {message.content}
        </Text>
      </View>
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.footerAction} onPress={handleLike}>
          <Heart size={18} color={isLiked ? '#ef4444' : '#6b7280'} fill={isLiked ? '#ef4444' : 'none'} />
          <Text style={styles.footerText}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerAction} onPress={() => onViewComments?.(message)}>
          <MessageCircle size={18} color="#6b7280" />
          <Text style={styles.footerText}>{message.comments?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerAction} onPress={handleShare}>
          <Share2 size={18} color="#6b7280" />
          <Text style={styles.footerText}></Text>
        </TouchableOpacity>
      </View>

      <CommunityPostContextMenu
        visible={showMenu}
        x={menuPosition.x}
        y={menuPosition.y}
        isSent={isSent}
        isLiked={isLiked}
        onEdit={() => {
          setShowMenu(false);
          onEdit?.(message);
        }}
        onDelete={() => {
          setShowMenu(false);
          onDelete?.(message.id);
        }}
        onLike={() => {
          setShowMenu(false);
          handleLike();
        }}
        onClose={() => setShowMenu(false)}
      />
    </View>
  );
}

function formatMessageTime(timestamp: any): string {
  try {
    // Handle null/undefined
    if (!timestamp) {
      return 'Invalid time';
    }

    // Convert to Date if needed
    let dateObj: Date;
    if (typeof timestamp === 'string') {
      dateObj = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === 'number') {
      dateObj = new Date(timestamp);
    } else {
      return 'Invalid time';
    }

    // Validate date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }

    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch (error) {
    console.warn('formatMessageTime error:', error);
    return 'Invalid time';
  }
}

const styles = StyleSheet.create({
  postContainer: {
    marginVertical: 6,
    marginHorizontal: 6,
    backgroundColor: '#FFFFFF',
    // borderRadius: 8,
    padding: 8,
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  senderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  senderAvatar: {
    backgroundColor: '#E9EDEF',
  },
  menuButtonContainer: {
    padding: 4,
  },
  menuButton: {
    padding: 4,
    flexDirection: 'row',
    gap: 2,
  },
  menuDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#666666',
  },
  postContent: {
    marginBottom: 12,
  },
  senderName: {
    fontWeight: '600',
    color: '#075E54',
    marginBottom: 2,
  },
  messageText: {
    lineHeight: 20,
    color: '#000000',
  },
  timestamp: {
    color: '#8696A0',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#667781',
    fontWeight: '500',
  },
});

function getResponsiveStyles(width: number) {
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 768;

  return {
    fontSize: isSmallScreen ? 10 : isLargeScreen ? 10 : 10,
    senderNameSize: isSmallScreen ? 8 : isLargeScreen ? 8 : 8,
    timestampSize: isSmallScreen ? 8 : isLargeScreen ? 8 : 8,
    avatarSize: isSmallScreen ? 20 : isLargeScreen ? 24 : 24,
  };
}

// Community Post Context Menu Component
interface CommunityPostContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  isSent: boolean;
  isLiked: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onLike: () => void;
  onClose: () => void;
}

function CommunityPostContextMenu({
  visible,
  x,
  y,
  isSent,
  isLiked,
  onEdit,
  onDelete,
  onLike,
  onClose,
}: CommunityPostContextMenuProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  if (!visible) return null;

  const MENU_WIDTH = 130;
  const MENU_ITEM_HEIGHT = 40;
  const MENU_HEIGHT = (isSent ? 3 : 1) * MENU_ITEM_HEIGHT;

  // Adjust position if menu goes off-screen
  let adjustedX = x - MENU_WIDTH;
  let adjustedY = y;

  if (adjustedX < 10) {
    adjustedX = 10;
  }
  if (adjustedX + MENU_WIDTH > screenWidth - 10) {
    adjustedX = screenWidth - MENU_WIDTH - 10;
  }

  if (adjustedY + MENU_HEIGHT > screenHeight - 100) {
    adjustedY = Math.max(10, adjustedY - MENU_HEIGHT);
  }

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity 
        style={contextMenuStyles.overlay} 
        onPress={onClose} 
        activeOpacity={1}
      >
        <View style={[contextMenuStyles.menu, { top: adjustedY, left: adjustedX, width: MENU_WIDTH }]}>
          {isSent && (
            <>
              <TouchableOpacity style={contextMenuStyles.menuItem} onPress={onEdit}>
                <Text style={contextMenuStyles.menuText}>Vugurura</Text>
              </TouchableOpacity>
              <TouchableOpacity style={contextMenuStyles.menuItem} onPress={onDelete}>
                <Text style={[contextMenuStyles.menuText, contextMenuStyles.deleteText]}>Delete</Text>
              </TouchableOpacity>
              <View style={contextMenuStyles.divider} />
            </>
          )}
          <TouchableOpacity style={contextMenuStyles.menuItem} onPress={onLike}>
            <Text style={contextMenuStyles.menuText}>{isLiked ? 'Unlike' : 'Like'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export const CommunityPostBubble = memo(CommunityPostBubbleComponent);

const contextMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 40,
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  menuText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1f2937',
  },
  deleteText: {
    color: '#ef4444',
  },
});
