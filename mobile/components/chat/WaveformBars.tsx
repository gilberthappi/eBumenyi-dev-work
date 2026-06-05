import { useRef, useMemo } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

interface WaveformBarsProps {
  /** 0–1 amplitude samples. Empty → decorative placeholder. */
  samples: number[];
  /** 0–1 playback progress; bars ≤ this index render in playedColor. */
  progress?: number;
  barCount?: number;
  height?: number;
  playedColor?: string;
  unplayedColor?: string;
  /** If provided, tap/drag triggers seek with a 0–1 ratio. */
  onSeek?: (ratio: number) => void;
}

const MIN_RATIO = 0.08;

export function WaveformBars({
  samples,
  progress = 0,
  barCount = 30,
  height = 40,
  playedColor = '#4D81D2',
  unplayedColor = '#CBD5E1',
  onSeek,
}: WaveformBarsProps) {
  const widthRef = useRef(0);

  const bars = useMemo((): number[] => {
    if (samples.length === 0) {
      // Deterministic decorative shape — looks like WhatsApp placeholder
      return Array.from({ length: barCount }, (_, i) => {
        const t = i / (barCount - 1);
        return MIN_RATIO + 0.6 * Math.abs(Math.sin(t * Math.PI * 4.1 + 0.5));
      });
    }
    if (samples.length <= barCount) {
      const out = [...samples];
      while (out.length < barCount) out.push(MIN_RATIO);
      return out;
    }
    // Downsample by averaging buckets
    const step = samples.length / barCount;
    return Array.from({ length: barCount }, (_, i) => {
      const lo = Math.floor(i * step);
      const hi = Math.min(samples.length, Math.floor((i + 1) * step));
      const slice = samples.slice(lo, hi);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
  }, [samples, barCount]);

  const playedCount = Math.round(Math.max(0, Math.min(1, progress)) * barCount);

  const panResponder = useMemo(
    () =>
      onSeek
        ? PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: (e) => {
              if (widthRef.current > 0)
                onSeek(Math.max(0, Math.min(1, e.nativeEvent.locationX / widthRef.current)));
            },
            onPanResponderMove: (e) => {
              if (widthRef.current > 0)
                onSeek(Math.max(0, Math.min(1, e.nativeEvent.locationX / widthRef.current)));
            },
          })
        : null,
    [onSeek],
  );

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(e) => { widthRef.current = e.nativeEvent.layout.width; }}
      {...panResponder?.panHandlers}
    >
      {bars.map((amp, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: Math.max(MIN_RATIO * height, amp * height),
              backgroundColor: i < playedCount ? playedColor : unplayedColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
  },
});
