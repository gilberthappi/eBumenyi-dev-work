import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image, Text } from 'react-native';

interface TypingUser {
  userId: string;
  userName?: string;
  userPhoto?: string;
}

interface TypingBubbleProps {
  typingUsers: TypingUser[];
  /**
   * Show the name(s) above the bubble.
   * Pass false for direct 1-1 chats where the identity is obvious.
   * Defaults to false.
   */
  showNames?: boolean;
}

export function TypingBubble({ typingUsers, showNames = false }: TypingBubbleProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Log typing users for debugging
  useEffect(() => {
    if (typingUsers.length > 0) {
      console.log(`⌨️ [TypingBubble] Rendering ${typingUsers.length} typing users:`, 
        typingUsers.map(u => ({
          userId: u.userId,
          userName: u.userName,
          userPhoto: u.userPhoto,
          hasPhoto: !!u.userPhoto
        }))
      );
    }
  }, [typingUsers]);

  useEffect(() => {
    const DURATION = 350;
    const DELAY = 150;

    const makeAnim = (dot: Animated.Value, startDelay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.timing(dot, { toValue: 1, duration: DURATION, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: DURATION, useNativeDriver: true }),
          Animated.delay(DELAY * 3 - startDelay),
        ]),
      );

    const a1 = makeAnim(dot1, 0);
    const a2 = makeAnim(dot2, DELAY);
    const a3 = makeAnim(dot3, DELAY * 2);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  if (typingUsers.length === 0) return null;

  const liftDot = (dot: Animated.Value) =>
    dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  // Show up to 3 avatars stacked
  const avatars = typingUsers.slice(0, 3);
  const names = typingUsers.map(u => u.userName || 'Someone').join(', ');

  return (
    <View style={styles.container}>
      {/* Stacked avatars — always shown, photo takes priority over initial */}
      <View style={styles.avatarsRow}>
        {avatars.map((u, idx) => (
          <View
            key={u.userId}
            style={[styles.avatarWrap, { marginLeft: idx > 0 ? -8 : 0, zIndex: 3 - idx }]}
          >
            {u.userPhoto ? (
              <Image
                source={{ uri: u.userPhoto }}
                style={styles.avatar}
                // Fade in when the photo loads
                fadeDuration={200}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {(u.userName || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Bubble + optional name */}
      <View>
        {showNames && (
          <Text style={styles.senderName} numberOfLines={1}>
            {names}
          </Text>
        )}
        <View style={styles.bubble}>
          <View style={styles.dotsRow}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View
                key={i}
                style={[styles.dot, { transform: [{ translateY: liftDot(dot) }] }]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 6,
  },
  avatarWrap: {},
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
  },
  avatarFallback: {
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4D81D2',
    marginBottom: 2,
    marginLeft: 10,
  },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignSelf: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
  },
});
