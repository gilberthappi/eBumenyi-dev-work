import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { ChevronDown, Mic } from 'lucide-react-native';

interface SystemControlsProps {
  onSystemSelect: (system: string) => void;
  selectedSystem: string | null;
}

const systemControls = [
  { id: 'virus', icon: '🦠' },
  { id: 'microscope', icon: '🔬' },
  { id: 'person', icon: '🧍' },
  { id: 'pill', icon: '💊' },
  { id: 'message', icon: '💌' },
  { id: 'people', icon: '🧑‍🤝‍🧑' },
];

function ControlButton({ control, selected, onPress } : { control: typeof systemControls[0], selected: boolean, onPress: (id: string) => void }){
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [selected, anim]);

  const circleTranslateY = anim.interpolate({ inputRange: [0,1], outputRange: [0, 10] });
  const circleScale = anim.interpolate({ inputRange: [0,1], outputRange: [1, 0.96] });
  const chevronTranslateY = anim.interpolate({ inputRange: [0,1], outputRange: [0, 4] });
  const chevronRotate = anim.interpolate({ inputRange: [0,1], outputRange: ['0deg', '180deg'] });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(control.id)} accessibilityRole="button">
      <View style={[styles.controlWrapper, selected ? { backgroundColor: '#3363AD' } : null]}>
        <Animated.View style={[styles.iconCircle, { backgroundColor: '#fff', transform: [{ translateY: circleTranslateY }, { scale: circleScale }], zIndex: 2, elevation: 4 }] }>
          {typeof control.icon === 'string' ? (
            <Text style={[styles.icon, { color:  '#fff' }]}>{control.icon}</Text>
          ) : (
            control.icon
          )}
        </Animated.View>

        <Animated.View style={[styles.chevronWrap, { transform: [{ translateY: chevronTranslateY }, { rotate: chevronRotate }], opacity: selected ? 0 : 1 }]}>
          <ChevronDown size={18} color="#444" />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export default function SystemControls({ onSystemSelect, selectedSystem }: SystemControlsProps) {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {systemControls.map((control) => (
          <ControlButton
            key={control.id}
            control={control}
            selected={selectedSystem === control.id}
            onPress={onSystemSelect}
          />
        ))}
      </ScrollView>

      {/* Voice button fixed at bottom */}
      <View style={styles.voiceWrap} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          onPress={() => onSystemSelect('voice')}
          style={[
            styles.voiceButton,
            { backgroundColor: '#fff', borderColor: selectedSystem === 'voice' ? '#2b6ef6' : 'transparent' },
            selectedSystem === 'voice' ? styles.voiceSelected : null,
          ]}
        >
          <Mic size={16} color={selectedSystem === 'voice' ? '#2b6ef6' : '#5aa0ff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    backgroundColor: '#e8f4fd',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  controlWrapper: {
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    borderWidth: 1,
    backgroundColor: '#eef6ff',
    borderColor: '#3363AD',
    paddingTop: 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor set inline from control.color
    alignItems: 'center',
    justifyContent: 'center',
    // subtle drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 14,
    lineHeight: 14,
  },
  chevronWrap: {
    marginTop: 4,
    width: 38,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#eef6ff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  voiceWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: 'center',
    paddingVertical: 0,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // backgroundColor intentionally set inline to keep it white like other icons
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceSelected: {
    // keep white background but show a subtle press state via scaling and border
    transform: [{ scale: 0.98 }],
    borderWidth: 1,
    borderColor: '#2b6ef6',
  },
});