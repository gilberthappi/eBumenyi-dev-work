/**
 * PersistentCountdown.tsx
 *
 * A hook + component pair that provides a live countdown that survives
 * app backgrounding and device sleep.
 *
 * ── How it works ────────────────────────────────────────────────────────────
 * 1. On mount the target timestamp is persisted to AsyncStorage.
 * 2. A 1-second interval updates the remaining time while the app is active.
 * 3. When AppState changes from background → active we cancel the stale
 *    interval and recalculate from `Date.now()`, then restart the interval.
 *    This means the timer is always accurate after any background stay,
 *    regardless of how long the device screen was off.
 * 4. When the countdown expires `onExpire` is called once.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, Text, View, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the countdown reaches zero. onExpire has been (or will be) called. */
  expired: boolean;
  /** Total remaining milliseconds (negative when expired) */
  remainingMs: number;
}

interface UsePersistentCountdownOptions {
  /** Unix timestamp (ms) of the target moment */
  targetTimestamp: number;
  /**
   * Optional storage key — used to persist the target so we can recalculate on resume.
   * Defaults to `'persistent_countdown_target'`.
   */
  storageKey?: string;
  /** Called once when the countdown hits zero */
  onExpire?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function msToCountdown(ms: number): CountdownValue {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, remainingMs: ms };
  }
  const days    = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: false, remainingMs: ms };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns a live `CountdownValue` that recalculates on app resume.
 *
 * @example
 * const countdown = usePersistentCountdown({
 *   targetTimestamp: event.startAt.getTime(),
 *   storageKey: `alarm_target_${event.id}`,
 *   onExpire: () => router.push('/alarm-ring'),
 * });
 */
export function usePersistentCountdown({
  targetTimestamp,
  storageKey = 'persistent_countdown_target',
  onExpire,
}: UsePersistentCountdownOptions): CountdownValue {
  const [value, setValue] = useState<CountdownValue>(() =>
    msToCountdown(targetTimestamp - Date.now()),
  );

  // Ref so callbacks see the latest values without stale closures
  const targetRef   = useRef(targetTimestamp);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef  = useRef(false);
  const onExpireRef = useRef(onExpire);

  // Keep refs fresh on every render
  targetRef.current   = targetTimestamp;
  onExpireRef.current = onExpire;

  // ── Persist target to AsyncStorage ────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.setItem(storageKey, String(targetTimestamp)).catch(() => {});
    // Cleanup: remove persisted value when component unmounts
    return () => { AsyncStorage.removeItem(storageKey).catch(() => {}); };
  }, [targetTimestamp, storageKey]);

  // ── Tick function (recalculates from Date.now() for drift-free accuracy) ──
  const tick = useCallback(() => {
    const remaining = targetRef.current - Date.now();
    const next = msToCountdown(remaining);
    setValue(next);

    if (next.expired && !expiredRef.current) {
      expiredRef.current = true;
      // Stop the interval — we won't count below zero
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onExpireRef.current?.();
    }
  }, []);

  // ── Start / restart the interval ──────────────────────────────────────────
  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (expiredRef.current) return; // Already fired — do nothing
    tick(); // Immediate update to avoid 1-second blank on resume
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  // ── AppState listener: restart interval when app comes to foreground ──────
  useEffect(() => {
    // Reset expired guard if target changes (e.g. snooze)
    expiredRef.current = false;

    startInterval();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // App resumed — restart interval so the first tick happens immediately
        // and uses the current wall-clock time (no drift).
        startInterval();
      } else {
        // App backgrounded — pause the interval to save battery.
        // AsyncStorage already has the target; we'll recalculate on resume.
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [targetTimestamp, startInterval]);

  return value;
}

// ─── Display Component ────────────────────────────────────────────────────────

interface PersistentCountdownProps {
  /** Unix timestamp (ms) */
  targetTimestamp: number;
  storageKey?: string;
  onExpire?: () => void;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Override text style for each segment value */
  valueStyle?: StyleProp<TextStyle>;
  /** Override text style for the separator labels */
  labelStyle?: StyleProp<TextStyle>;
  /** Color for the digit values (default: '#007aff') */
  accentColor?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Displays a DD:HH:MM:SS live countdown that recalculates on app resume.
 *
 * @example
 * <PersistentCountdown
 *   targetTimestamp={event.startAt.getTime()}
 *   storageKey={`alarm_target_${event.id}`}
 *   onExpire={handleAlarmFire}
 *   accentColor={themeColors.primary}
 *   size="md"
 * />
 */
export const PersistentCountdown: React.FC<PersistentCountdownProps> = ({
  targetTimestamp,
  storageKey,
  onExpire,
  style,
  valueStyle,
  labelStyle,
  accentColor = '#007aff',
  size = 'md',
}) => {
  const countdown = usePersistentCountdown({ targetTimestamp, storageKey, onExpire });

  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 22 : 15;
  const labelSize = size === 'sm' ? 7 : size === 'lg' ? 10 : 8;

  if (countdown.expired) return null;

  return (
    <View style={[styles.row, style]}>
      <Segment
        value={countdown.days}
        label="d"
        color={accentColor}
        fontSize={fontSize}
        labelSize={labelSize}
        valueStyle={valueStyle}
        labelStyle={labelStyle}
      />
      <Colon color={accentColor} fontSize={fontSize} />
      <Segment
        value={countdown.hours}
        label="h"
        color={accentColor}
        fontSize={fontSize}
        labelSize={labelSize}
        valueStyle={valueStyle}
        labelStyle={labelStyle}
      />
      <Colon color={accentColor} fontSize={fontSize} />
      <Segment
        value={countdown.minutes}
        label="m"
        color={accentColor}
        fontSize={fontSize}
        labelSize={labelSize}
        valueStyle={valueStyle}
        labelStyle={labelStyle}
      />
      <Colon color={accentColor} fontSize={fontSize} />
      <Segment
        value={countdown.seconds}
        label="s"
        color={accentColor}
        fontSize={fontSize}
        labelSize={labelSize}
        valueStyle={valueStyle}
        labelStyle={labelStyle}
      />
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SegmentProps {
  value: number;
  label: string;
  color: string;
  fontSize: number;
  labelSize: number;
  valueStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const Segment: React.FC<SegmentProps> = ({ value, label, color, fontSize, labelSize, valueStyle, labelStyle }) => (
  <View style={styles.segment}>
    <Text style={[styles.value, { color, fontSize }, valueStyle]}>
      {String(value).padStart(2, '0')}
    </Text>
    <Text style={[styles.label, { color: `${color}99`, fontSize: labelSize }, labelStyle]}>
      {label}
    </Text>
  </View>
);

interface ColonProps { color: string; fontSize: number; }
const Colon: React.FC<ColonProps> = ({ color, fontSize }) => (
  <Text style={[styles.colon, { color: `${color}66`, fontSize }]}>:</Text>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  segment: {
    alignItems: 'center',
    minWidth: 22,
  },
  value: {
    fontFamily: 'Inter-Bold',
    lineHeight: undefined,
  },
  label: {
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
  colon: {
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    paddingHorizontal: 1,
  },
});
