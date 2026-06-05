import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { assets } from '@/theme';

interface BodyModelProps {
  selectedSymptoms: string[];
  onBodyPartPress: (part: string) => void;
}

interface HotSpot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const bodyHotSpots: HotSpot[] = [
  { id: 'head', x: 45, y: 8, width: 12, height: 14 },
  { id: 'chest', x: 42, y: 25, width: 18, height: 18 },
  { id: 'lungs', x: 40, y: 22, width: 22, height: 20 },
  { id: 'abdomen', x: 42, y: 40, width: 18, height: 14 },
  { id: 'left_arm', x: 22, y: 25, width: 16, height: 28 },
  { id: 'right_arm', x: 62, y: 25, width: 16, height: 28 },
  { id: 'left_leg', x: 38, y: 55, width: 10, height: 38 },
  { id: 'right_leg', x: 54, y: 55, width: 10, height: 38 },
  { id: 'left_knee', x: 38, y: 70, width: 12, height: 12 },
  { id: 'right_knee', x: 54, y: 70, width: 12, height: 12 },
];

export default function BodyModel({ selectedSymptoms, onBodyPartPress }: BodyModelProps) {
  // Visual state
  const [activeHotSpot, setActiveHotSpot] = useState<string | null>(null);

  // Interaction state for pinch & rotate
  const scaleRef = useRef(1);
  const rotateYRef = useRef(0); // degrees
  const [scale, setScale] = useState(1);
  const [rotateY, setRotateY] = useState(0);

  // Gesture bookkeeping
  const initialDistance = useRef<number | null>(null);
  const initialAngle = useRef<number | null>(null);
  const baseScale = useRef(1);
  const baseRotate = useRef(0);

  const handleHotSpotPress = (hotSpot: HotSpot) => {
    setActiveHotSpot(hotSpot.id);
    onBodyPartPress(hotSpot.id);
    setTimeout(() => setActiveHotSpot(null), 200);
  };

  const getSymptomHighlight = (hotSpotId: string) => {
    if (selectedSymptoms.includes('dizziness') && hotSpotId === 'head') return true;
    if (selectedSymptoms.includes('knee_joint') && (hotSpotId === 'left_knee' || hotSpotId === 'right_knee')) return true;
    if (selectedSymptoms.includes('nausea') && hotSpotId === 'abdomen') return true;
    if (selectedSymptoms.includes('shaking') && (hotSpotId === 'left_arm' || hotSpotId === 'right_arm')) return true;
    return false;
  };

  // Helpers for multi-touch math
  const distanceBetweenTouches = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const angleBetweenTouches = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return (Math.atan2(dy, dx) * 180) / Math.PI; // degrees
  };

  // Responder handlers attached to the scalable container so hotspots scale together with the image
  const onStartShouldSetResponder = () => true;

  const onResponderGrant = (evt: any) => {
    const touches = evt.nativeEvent.touches;
    if (touches.length >= 2) {
      initialDistance.current = distanceBetweenTouches(touches);
      initialAngle.current = angleBetweenTouches(touches);
      baseScale.current = scaleRef.current;
      baseRotate.current = rotateYRef.current;
    }
  };

  const onResponderMove = (evt: any) => {
    const touches = evt.nativeEvent.touches;
    if (touches.length >= 2 && initialDistance.current && initialAngle.current != null) {
      const currentDistance = distanceBetweenTouches(touches);
      const currentAngle = angleBetweenTouches(touches);
      // Pinch scale relative to initial distance
      const newScale = Math.max(0.6, Math.min(2.5, (currentDistance / initialDistance.current) * baseScale.current));
      scaleRef.current = newScale;
      setScale(newScale);

      // Rotation around vertical axis (3D like) — use angle delta to adjust rotateY
      const angleDelta = currentAngle - initialAngle.current;
      const newRotate = Math.max(-45, Math.min(45, baseRotate.current + angleDelta));
      rotateYRef.current = newRotate;
      setRotateY(newRotate);
    }
  };

  const onResponderRelease = (evt: any) => {
    // Reset initial gesture trackers
    initialDistance.current = null;
    initialAngle.current = null;
  };

  // Container size smaller by default — responsive apps can change these constants
  const CONTAINER_WIDTH = 220;
  const CONTAINER_HEIGHT = 380;

  return (
    <View style={styles.container}>
      <View
        style={[styles.bodyContainer, { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }]}
        onStartShouldSetResponder={onStartShouldSetResponder}
        onResponderGrant={onResponderGrant}
        onResponderMove={onResponderMove}
        onResponderRelease={onResponderRelease}
      >
        <View
          style={[
            styles.bodyInner,
            {
              transform: [
                { perspective: 1000 },
                { scale: scale },
                { rotateY: `${rotateY}deg` },
              ],
              width: '100%',
              height: '100%',
            },
          ]}
        >
          <Image source={assets.body} style={styles.bodyImage} resizeMode="contain" />

          {bodyHotSpots.map((hotSpot) => (
            <TouchableOpacity
              key={hotSpot.id}
              onPress={() => handleHotSpotPress(hotSpot)}
              activeOpacity={0.7}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              style={[
                styles.hotSpot,
                {
                  left: `${hotSpot.x}%`,
                  top: `${hotSpot.y}%`,
                  width: `${hotSpot.width}%`,
                  height: `${hotSpot.height}%`,
                  backgroundColor: activeHotSpot === hotSpot.id
                    ? 'rgba(156, 39, 176, 0.35)'
                    : getSymptomHighlight(hotSpot.id)
                    ? 'rgba(244, 67, 54, 0.22)'
                    : 'transparent',
                  borderColor: getSymptomHighlight(hotSpot.id) ? '#f44336' : 'transparent',
                  borderWidth: getSymptomHighlight(hotSpot.id) ? 2 : 0,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  bodyContainer: {
    position: 'relative',
  },
  bodyInner: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyImage: {
    width: '100%',
    height: '100%',
  },
  hotSpot: {
    position: 'absolute',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // Make hotspots easier to tap while visually subtle
    opacity: 0.95,
  },
});