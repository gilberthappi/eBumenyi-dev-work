import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions, Animated } from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';
import { useEffect, useRef } from 'react';

interface MessageContextMenuProps {
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

const REACTION_BAR_WIDTH = 72;
const ACTION_BAR_WIDTH = 160;
const REACTION_BAR_HEIGHT = 52;
const ACTION_HEIGHT = 44;

export function MessageContextMenu({
  visible,
  x,
  y,
  isSent,
  isLiked,
  onEdit,
  onDelete,
  onLike,
  onClose,
}: MessageContextMenuProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const totalHeight = REACTION_BAR_HEIGHT + (isSent ? ACTION_HEIGHT * 2 + 1 : 0) + 8;
  const containerWidth = isSent ? ACTION_BAR_WIDTH : REACTION_BAR_WIDTH;

  // Position ABOVE the bubble
  let barX = isSent ? x - ACTION_BAR_WIDTH + 8 : x - REACTION_BAR_WIDTH / 2;
  let barY = y - totalHeight - 4;

  // Clamp to screen edges
  if (barX + containerWidth > screenWidth - 8) barX = screenWidth - containerWidth - 8;
  if (barX < 8) barX = 8;
  if (barY < 60) barY = y + 8;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <Animated.View
          style={[
            styles.container,
            { top: barY, left: barX, width: containerWidth },
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}>
          {/* Heart reaction button */}
          <View style={[styles.reactionBar, isSent && { alignSelf: 'flex-end', width: REACTION_BAR_WIDTH }]}>
            <TouchableOpacity
              style={[styles.emojiButton, isLiked && styles.emojiButtonActive]}
              onPress={() => {
                onLike();
                onClose();
              }}>
              <Text style={styles.emoji}>{isLiked ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          {/* Action items — sent messages only */}
          {isSent && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionItem} onPress={onEdit}>
                <Edit2 size={16} color="#4D81D2" />
                <Text style={styles.actionText}>Vugurura</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.actionItem} onPress={onDelete}>
                <Trash2 size={16} color="#ef4444" />
                <Text style={[styles.actionText, styles.deleteText]}>Siba</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  container: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 52,
    borderRadius: 12,
  },
  emojiButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  emojiButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ scale: 1.2 }],
  },
  emoji: {
    fontSize: 22,
  },
  actions: {
    backgroundColor: '#ffffff',
    marginTop: 4,
    borderRadius: 10,
    overflow: 'hidden',
    width: ACTION_BAR_WIDTH,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  deleteText: {
    color: '#ef4444',
  },
});
