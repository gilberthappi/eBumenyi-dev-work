import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { INotification } from '@/types';
import { formatTimeAgoKinyarwanda } from '@/utils/format';
import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  BookOpen,
  MessageCircle,
  Trash2,
  Check,
  Award,
  Target,
  BookMarked,
} from 'lucide-react-native';

interface NotificationCardProps {
  notification: INotification;
  onPress: (notification: INotification) => void;
  onLongPress: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  isSelected: boolean;
  isSelectionMode: boolean;
}

const getNotificationIcon = (notification: INotification, primaryColor: string) => {
  // Check metadata for specific types
  if (notification.metadata?.meetingType || notification.metadata?.eventType) {
    return { Icon: Calendar, color: primaryColor };
  }
  if (notification.entityType === 'certificate') {
    return { Icon: Award, color: '#f59e0b' };
  }
  if (notification.entityType === 'attempt') {
    const passed = notification.metadata?.passed === 'true' || notification.metadata?.passed === true;
    return { Icon: Target, color: passed ? '#10b981' : '#f59e0b' };
  }
  if (notification.entityType === 'chapter') {
    return { Icon: BookMarked, color: '#6366f1' };
  }
  if (notification.entityType === 'course' || notification.title.toLowerCase().includes('course')) {
    return { Icon: BookOpen, color: primaryColor };
  }
  if (notification.entityType === 'message' || notification.title.toLowerCase().includes('message')) {
    return { Icon: MessageCircle, color: primaryColor };
  }

  // Fallback to notification type - use primary for most, semantic colors for critical states
  switch (notification.type) {
    case 'success':
      return { Icon: CheckCircle, color: '#10b981' }; // Keep green for success
    case 'warning':
      return { Icon: AlertTriangle, color: '#f59e0b' }; // Keep orange for warning
    case 'error':
      return { Icon: XCircle, color: '#ef4444' }; // Keep red for error
    case 'info':
    default:
      return { Icon: Info, color: primaryColor }; // Use primary color
  }
};

export default function NotificationCard({
  notification,
  onPress,
  onLongPress,
  onDelete,
  isSelected,
  isSelectionMode,
}: NotificationCardProps) {
  const { isDark, themeColors } = useTheme();
  const panX = useRef(new Animated.Value(0)).current;

  const { Icon, color } = getNotificationIcon(notification, themeColors.primary);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSelectionMode,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return !isSelectionMode && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Allow both left and right swipe
        panX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -80) {
          // Swipe left - Delete
          Animated.timing(panX, {
            toValue: -100,
            duration: 200,
            useNativeDriver: false,
          }).start();
        } else if (gestureState.dx > 80) {
          // Swipe right - Mark as read/unread
          Animated.timing(panX, {
            toValue: 100,
            duration: 200,
            useNativeDriver: false,
          }).start();
        } else {
          // Snap back
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Siba itangazo',
      'Urashaka gusiba iri tangazo?',
      [
        { text: 'Oya', style: 'cancel', onPress: () => {
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }},
        {
          text: 'Yego',
          style: 'destructive',
          onPress: () => {
            onDelete(notification.id);
            panX.setValue(0);
          },
        },
      ]
    );
  }, [notification.id, onDelete, panX]);

  const handleMarkToggle = useCallback(() => {
    // This will be handled by parent component
    onPress(notification);
    Animated.spring(panX, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  }, [notification, onPress, panX]);

  return (
    <View style={styles.container}>
      {/* Right Swipe Action - Mark as Read/Unread */}
      <View style={[styles.swipeActionRight, { backgroundColor: notification.isRead ? '#f59e0b' : '#10b981' }]}>
        <TouchableOpacity style={styles.swipeButton} onPress={handleMarkToggle}>
          <Check size={18} color="white" />
          <Text style={styles.swipeText}>
            {notification.isRead ? 'Ntisomwe' : 'Somwe'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Left Swipe Action - Delete */}
      <View style={[styles.swipeActionLeft, { backgroundColor: '#ef4444' }]}>
        <TouchableOpacity style={styles.swipeButton} onPress={handleDelete}>
          <Trash2 size={18} color="white" />
          <Text style={styles.swipeText}>Siba</Text>
        </TouchableOpacity>
      </View>

      {/* Card Content */}
      <Animated.View
        style={[
          styles.cardWrapper,
          { transform: [{ translateX: panX }] },
        ]}
        {...(!isSelectionMode ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderLeftColor: color,
              borderLeftWidth: 4,
            },
            !notification.isRead && {
              backgroundColor: isDark ? '#374151' : '#f1f5f9',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            },
            isSelected && {
              backgroundColor: isDark ? '#1e40af' : '#dbeafe',
              borderColor: themeColors.primary,
              borderWidth: 2,
            },
          ]}
          onPress={() => onPress(notification)}
          onLongPress={() => onLongPress(notification.id)}
          activeOpacity={0.7}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Icon size={16} color={color} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#e5e7eb' : '#111827' },
                  !notification.isRead && styles.titleUnread,
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              <Text style={[styles.time, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {formatTimeAgoKinyarwanda(notification.createdAt)}
              </Text>
            </View>

            <Text
              style={[styles.message, { color: isDark ? '#d1d5db' : '#4b5563' }]}
              numberOfLines={2}
            >
              {notification.message}
            </Text>

            {notification.metadata?.startTime && (
              <View style={styles.metadataRow}>
                <Calendar size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text style={[styles.metadataText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  {new Date(notification.metadata.startTime).toLocaleString('rw-RW', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* Unread Indicator */}
          {!notification.isRead && !isSelectionMode && (
            <View style={[styles.unreadDot, { backgroundColor: color }]} />
          )}

          {/* Selection Checkbox */}
          {isSelectionMode && (
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: isDark ? '#6b7280' : '#d1d5db',
                  backgroundColor: isSelected ? themeColors.primary : 'transparent',
                },
              ]}
            >
              {isSelected && <Check size={16} color="white" />}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 6,
  },
  swipeActionRight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: 12,
  },
  swipeActionLeft: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderRadius: 12,
  },
  swipeButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  cardWrapper: {
    borderRadius: 12,
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  titleUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 10,
  },
  message: {
    fontSize: 10,
    lineHeight: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metadataText: {
    fontSize: 10,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
