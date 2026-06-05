/**
 * alarm-ring.tsx — DEPRECATED
 *
 * The custom alarm screen has been removed. All alarm UI is now handled
 * natively by expo-alarm-module (AlarmService + notification with
 * "Hagarika" dismiss and "Rindira 5 min" snooze buttons).
 *
 * This file exists only to prevent a 404 if any old deep-link or
 * navigation call still references /alarm-ring. It immediately navigates
 * back to the calendar tab.
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AlarmRingScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately — native alarm handles everything
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  return null;
}
