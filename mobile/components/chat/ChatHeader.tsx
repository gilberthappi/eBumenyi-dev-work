import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Video, Phone, MoreVertical } from 'lucide-react-native';
import { IConversation } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuth } from '@/hooks/useAuth';

interface ChatHeaderProps {
  chat: IConversation;
  router: any;
}

export function ChatHeader({ chat, router }: ChatHeaderProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const responsiveStyles = getResponsiveHeaderStyles(width);

  const { user } = useAuth();

  // Use backend-calculated displayName and displayPhoto
  // For direct conversations, this is the OTHER participant (not current user)
  // For groups/communities, this is the conversation name/photo
  const displayName = chat?.displayName || chat?.name || '----';
  const displayPhoto = chat?.displayPhoto || chat?.participants?.[0]?.user?.photo;

  // The list API returns otherUserId directly; the individual chat API may not.
  // Fall back to finding the other participant from the participants array so
  // useOnlineStatus always tracks the correct user ID.
  const participantId = chat?.type === 'direct'
    ? ((chat as any).otherUserId ||
       chat?.participants?.find(p => p.userId !== user?.id)?.userId)
    : undefined;
  
  const { isOnline, lastSeen } = useOnlineStatus(participantId || '');
  
  // Get status text - online/offline for direct, member count for groups
  let statusText = '';
  if (chat?.type === 'direct') {
    if (participantId) {
      statusText = isOnline
        ? 'Online'
        : lastSeen
          ? `Last seen ${formatLastSeen(lastSeen)}`
          : 'Offline';
    } else {
      statusText = 'Chat';
    }
  } else {
    statusText = chat?.participants && chat.participants.length > 0
      ? `${chat.participants.length} members`
      : 'Chat';
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top, paddingHorizontal: responsiveStyles.paddingHorizontal, paddingVertical: responsiveStyles.paddingVertical }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={responsiveStyles.backIconSize} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.headerInfo}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: displayPhoto || 'https://i.pravatar.cc/150?img=1' }}
            style={[
              styles.headerAvatar,
              {
                width: responsiveStyles.headerAvatarSize,
                height: responsiveStyles.headerAvatarSize,
                borderRadius: responsiveStyles.headerAvatarSize / 2,
              },
            ]}
          />
          {chat?.type === 'direct' && participantId && isOnline && (
            <View style={styles.avatarOnlineDot} />
          )}
        </View>
        <View style={styles.headerTextContainer}>
          {chat?.type === 'direct' ? (
            <TouchableOpacity 
              onPress={() => router.push(`/chat/${chat.id}/info`)}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerName, { fontSize: responsiveStyles.headerNameSize }]}>
                {displayName}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.headerName, { fontSize: responsiveStyles.headerNameSize }]}>
              {displayName}
            </Text>
          )}
          <Text style={[styles.headerStatus, { fontSize: responsiveStyles.headerStatusSize }]}>
            {statusText}
          </Text>
        </View>
      </View>

      {/* Action buttons for video call and audio call */}
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => Alert.alert('Video Call', `Starting video call with ${displayName}`)}
        >
          <Video size={responsiveStyles.actionIconSize} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => Alert.alert('Audio Call', `Starting audio call with ${displayName}`)}
        >
          <Phone size={responsiveStyles.actionIconSize} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push(`/chat/${chat.id}/info`)}
        >
          <MoreVertical size={responsiveStyles.actionIconSize} color="#FFFFFF" />
        </TouchableOpacity>
      </View> 
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4D81D2',
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    backgroundColor: '#E9EDEF',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#4D81D2',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerStatus: {
    color: '#D1F4CC',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
});

function getResponsiveHeaderStyles(width: number) {
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 768;
  
  return {
    paddingHorizontal: isSmallScreen ? 4 : isLargeScreen ? 16 : 8,
    paddingVertical: isSmallScreen ? 8 : isLargeScreen ? 14 : 10,
    backIconSize: isSmallScreen ? 20 : isLargeScreen ? 28 : 24,
    headerAvatarSize: isSmallScreen ? 32 : isLargeScreen ? 48 : 40,
    headerNameSize: isSmallScreen ? 14 : isLargeScreen ? 16 : 16,
    headerStatusSize: isSmallScreen ? 10 : isLargeScreen ? 12 : 12,
    actionIconSize: isSmallScreen ? 16 : isLargeScreen ? 22 : 22,
  };
}

function formatLastSeen(lastSeenDate: string): string {
  const now = new Date();
  const lastSeen = new Date(lastSeenDate);

  if (isNaN(lastSeen.getTime())) return '';

  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) {
    const time = lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `today at ${time}`;
  }
  if (diffDays === 1) {
    const time = lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `yesterday at ${time}`;
  }
  if (diffDays < 7) return `${diffDays} days ago`;

  return lastSeen.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}
