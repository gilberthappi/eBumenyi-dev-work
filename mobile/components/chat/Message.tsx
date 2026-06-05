import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  useWindowDimensions,
  Share,
} from 'react-native';
import { Heart, MessageCircle, Share2, Check, CheckCheck } from 'lucide-react-native';
import { IMessage } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/auth';
import { MessageContextMenu } from './MessageContextMenu';

export type ChatType = 'direct' | 'group' | 'community';

interface MessageProps {
  message: IMessage;
  type: ChatType;
  onEdit?: (message: IMessage) => void;
  onDelete?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onViewComments?: (message: IMessage) => void;
}

/**
 * Unified Message Component (Restored Design)
 * Renders messages for direct, group, and community chats
 * Preserves original design from MessageBubble, GroupMessageBubble, CommunityPostBubble
 * 
 * Features:
 * - Direct: WhatsApp-style bubbles with read receipts
 * - Group: Shows sender avatar and name for received messages
 * - Community: Full post card with like/comment/share actions
 * - Responsive design for all screen sizes
 * - Long press menu for edit/delete
 */

function MessageComponent({
  message,
  type,
  onEdit,
  onDelete,
  onLike,
  onViewComments,
}: MessageProps) {
  const { width } = useWindowDimensions();
  const responsiveStyles = getResponsiveStyles(width);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<View>(null);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getMe(),
    staleTime: Infinity,
  });

  const isSent = message.senderId === currentUser?.id;

  // Derive like state from message data
  const likeCount = (message.likes as any)?.length ?? (typeof message.likes === 'number' ? message.likes : 0);
  const isLiked = (message.likes as any)?.some((like: any) => like?.id === currentUser?.id) ?? false;

  const handleLongPress = () => {
    if (!isSent) return;
    if (bubbleRef.current) {
      bubbleRef.current.measure((x, y, width, bubbleHeight, pageX, pageY) => {
        const menuX = isSent ? pageX + width - 140 : pageX + 10;
        const menuY = pageY + bubbleHeight;
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

  const formatMessageTime = (timestamp: any): string => {
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
  };

  // ============ RENDER DIRECT/GROUP MESSAGE ============
  if (type === 'direct' || type === 'group') {
    return (
      <View
        style={[
          styles.messageContainer,
          isSent ? styles.sentContainer : styles.receivedContainer,
        ]}
      >
        <TouchableWithoutFeedback onLongPress={handleLongPress}>
          <View
            ref={bubbleRef}
            style={[
              styles.bubble,
              { maxWidth: responsiveStyles.bubbleMaxWidth },
              isSent ? styles.sentBubble : styles.receivedBubble,
            ]}
          >
            {/* Group: Show sender info for received messages */}
            {type === 'group' && !isSent && (
              <View style={styles.senderHeader}>
                <Image
                  source={{ uri: message.sender?.photo }}
                  style={[
                    styles.senderAvatar,
                    {
                      width: responsiveStyles.avatarSize,
                      height: responsiveStyles.avatarSize,
                      borderRadius: responsiveStyles.avatarSize / 2,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.senderName,
                    { fontSize: responsiveStyles.senderNameSize },
                  ]}
                >
                  {message.sender?.fullNames || 'Izina'}
                </Text>
              </View>
            )}

            {/* Message content */}
            <Text
              style={[
                styles.messageText,
                { fontSize: responsiveStyles.fontSize },
                isSent ? styles.sentText : styles.receivedText,
              ]}
              numberOfLines={10}
            >
              {message.content || message.title || 'ubutumwa'}
            </Text>

            {/* Footer with timestamp and read receipts */}
            <View style={styles.footer}>
              <Text
                style={[
                  styles.timestamp,
                  { fontSize: responsiveStyles.timestampSize },
                  isSent ? styles.sentTimestamp : styles.receivedTimestamp,
                ]}
              >
                {message?.timestamp ? formatMessageTime(message.timestamp) : 'Invalid time'}
              </Text>
              {isSent && (
                <View style={styles.checkContainer}>
                  {message.readBy && message.readBy.length > 0 ? (
                    <CheckCheck
                      size={responsiveStyles.iconSize}
                      color="#53BDEB"
                    />
                  ) : (
                    <Check size={responsiveStyles.iconSize} color="#8696A0" />
                  )}
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>

        <MessageContextMenu
          visible={showMenu}
          x={menuPosition.x}
          y={menuPosition.y}
          isSent={isSent}
          isLiked={isLiked}
          onLike={() => {
            setShowMenu(false);
            onLike?.(message.id);
          }}
          onEdit={() => {
            setShowMenu(false);
            onEdit?.(message);
          }}
          onDelete={() => {
            setShowMenu(false);
            onDelete?.(message.id);
          }}
          onClose={() => setShowMenu(false)}
        />
      </View>
    );
  }

  // ============ RENDER COMMUNITY POST ============
  if (type === 'community') {
    return (
      <View style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Image
            source={{ uri: message.sender?.photo }}
            style={[
              styles.postAvatar,
              {
                width: responsiveStyles.avatarSize,
                height: responsiveStyles.avatarSize,
                borderRadius: responsiveStyles.avatarSize / 2,
              },
            ]}
          />
          <View style={styles.senderInfo}>
            <Text
              style={[
                styles.postSenderName,
                { fontSize: responsiveStyles.senderNameSize },
              ]}
            >
              {message.sender?.fullNames || 'Izina'}
            </Text>
            <Text
              style={[
                styles.postTimestamp,
                { fontSize: responsiveStyles.timestampSize },
              ]}
            >
              {message?.timestamp ? formatMessageTime(message.timestamp) : 'Invalid time'}
            </Text>
          </View>
          <View ref={bubbleRef} style={styles.menuButtonContainer}>
            {isSent && (
              <TouchableOpacity
                onPress={handleLongPress}
                style={styles.menuButton}
              >
                <View style={styles.menuDot} />
                <View style={styles.menuDot} />
                <View style={styles.menuDot} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <Text
            style={[
              styles.postContentText,
              { fontSize: responsiveStyles.fontSize },
            ]}
            numberOfLines={0}
          >
            {message.content}
          </Text>
        </View>

        {/* Post Footer - Actions */}
        <View style={styles.postFooter}>
          <TouchableOpacity style={styles.footerAction} onPress={handleLike}>
            <Heart
              size={18}
              color={isLiked ? '#ef4444' : '#6b7280'}
              fill={isLiked ? '#ef4444' : 'none'}
            />
            <Text style={styles.footerText}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerAction}
            onPress={() => onViewComments?.(message)}
          >
            <MessageCircle size={18} color="#6b7280" />
            <Text style={styles.footerText}>
              {message.comments?.length || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerAction} onPress={handleShare}>
            <Share2 size={18} color="#6b7280" />
            <Text style={styles.footerText}></Text>
          </TouchableOpacity>
        </View>

        {/* Context Menu */}
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

  return null;
}

// ============ COMMUNITY POST CONTEXT MENU ============
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
    <TouchableOpacity
      style={contextMenuStyles.overlay}
      onPress={onClose}
      activeOpacity={1}
    >
      <View
        style={[
          contextMenuStyles.menu,
          { top: adjustedY, left: adjustedX, width: MENU_WIDTH },
        ]}
      >
        {isSent && (
          <>
            <TouchableOpacity
              style={contextMenuStyles.menuItem}
              onPress={onEdit}
            >
              <Text style={contextMenuStyles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={contextMenuStyles.menuItem}
              onPress={onDelete}
            >
              <Text
                style={[
                  contextMenuStyles.menuText,
                  contextMenuStyles.deleteText,
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
            <View style={contextMenuStyles.divider} />
          </>
        )}
        <TouchableOpacity style={contextMenuStyles.menuItem} onPress={onLike}>
          <Text style={contextMenuStyles.menuText}>
            {isLiked ? 'Unlike' : 'Like'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export const Message = memo(MessageComponent);

// ============ RESPONSIVE STYLES ============
function getResponsiveStyles(width: number) {
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 768;

  return {
    bubbleMaxWidth: isSmallScreen ? width * 0.85 : isLargeScreen ? width * 0.6 : width * 0.75,
    fontSize: isSmallScreen ? 14 : isLargeScreen ? 18 : 16,
    senderNameSize: isSmallScreen ? 11 : isLargeScreen ? 13 : 12,
    timestampSize: isSmallScreen ? 10 : isLargeScreen ? 12 : 11,
    iconSize: isSmallScreen ? 14 : 16,
    avatarSize: isSmallScreen ? 28 : isLargeScreen ? 40 : 32,
  };
}

// ============ DIRECT/GROUP MESSAGE STYLES ============
const styles = StyleSheet.create({
  // Direct/Group Container
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  sentContainer: {
    justifyContent: 'flex-end',
  },
  receivedContainer: {
    justifyContent: 'flex-start',
  },

  // Bubble
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sentBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 2,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
  },

  // Group - Sender Header
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderAvatar: {
    marginRight: 6,
  },
  senderName: {
    fontWeight: '600',
    color: '#075E54',
    marginBottom: 2,
  },

  // Message Text
  messageText: {
    lineHeight: 20,
  },
  sentText: {
    color: '#000000',
  },
  receivedText: {
    color: '#000000',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    lineHeight: 16,
  },
  sentTimestamp: {
    color: '#667781',
  },
  receivedTimestamp: {
    color: '#8696A0',
  },
  checkContainer: {
    marginLeft: 2,
  },

  // ============ COMMUNITY POST STYLES ============
  postContainer: {
    marginVertical: 8,
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    backgroundColor: '#E9EDEF',
  },
  senderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  postSenderName: {
    fontWeight: '600',
    color: '#075E54',
    marginBottom: 2,
  },
  postTimestamp: {
    color: '#8696A0',
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
  postContentText: {
    lineHeight: 20,
    color: '#000000',
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

// ============ COMMUNITY POST CONTEXT MENU STYLES ============
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
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  deleteText: {
    color: '#ef4444',
  },
});
