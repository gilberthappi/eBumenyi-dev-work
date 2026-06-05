import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Animated, Easing } from 'react-native';

interface Props {
  onFinish: () => void;
}

const flowerEmojis = ['🌸', '🌺', '🌻', '🌼', '💐', '🌷', '🌹'];

const LastSlide: React.FC<Props> = ({ onFinish }) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 700;
  // Add a rerender key to force animation on mount
  const [animKey, setAnimKey] = React.useState(0);

  // Animated flowers
  const flowerAnims = useRef(
    flowerEmojis.map(() => ({
      translateY: new Animated.Value(40),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.7 + Math.random() * 0.5),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    setAnimKey(k => k + 1);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const runAnimation = () => {
      const animations = flowerAnims.map((f, i) =>
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.parallel([
            Animated.timing(f.opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(f.translateY, {
              toValue: -60 - Math.random() * 30,
              duration: 900 + Math.random() * 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(f.rotate, {
              toValue: Math.random() * 360,
              duration: 1000 + Math.random() * 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(600),
          Animated.parallel([
            Animated.timing(f.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(f.translateY, {
              toValue: -120,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      Animated.stagger(120, animations).start();
    };
    runAnimation();
    interval = setInterval(runAnimation, 3000);
    return () => clearInterval(interval);
  }, [flowerAnims]);

  return (
    <View style={[styles.container, { padding: isTablet ? 32 : 18 }]}>  
      <View style={styles.flowerContainer} pointerEvents="none" key={animKey}>
        {flowerEmojis.map((emoji, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.flower,
              {
                opacity: flowerAnims[i].opacity,
                transform: [
                  { translateY: flowerAnims[i].translateY },
                  { scale: flowerAnims[i].scale },
                  { rotate: flowerAnims[i].rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
                  { translateX: (i - 3) * 32 },
                ],
              },
            ]}
          >
            {emoji}
          </Animated.Text>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.congratsTitle}>Warangije icyigwa!</Text>
        <Text style={styles.congratsSubtitle}>Turagushimiye cyane 🎉</Text>
        <Text style={styles.congratsText}>
          Warangije iki gice cy&apos;isomo. Komereza aho, turakwifuriza amahirwe masa mu masomo asigaye!
        </Text>
        <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
          <Text style={styles.finishButtonText}>Komeza</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flowerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 10,
    pointerEvents: 'none',
  },
  flower: {
    fontSize: 36,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
    maxWidth: 420,
  },
  congratsTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3363AD',
    marginBottom: 8,
    textAlign: 'center',
  },
  congratsSubtitle: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  congratsText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 2,
  },
  finishButton: {
    backgroundColor: '#3363AD',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    width: 180,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LastSlide;