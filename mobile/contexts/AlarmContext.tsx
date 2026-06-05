import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as Notifications from 'expo-notifications';
import { ICalendarEvent } from '@/types';
import { GlobalReminderService } from '@/services/calender';
import { NativeAlarmScheduler } from '@/services/NativeAlarmScheduler';

interface AlarmContextType {
  activeAlarm: ICalendarEvent | null;
  triggerAlarm: (event: ICalendarEvent) => void;
  dismissAlarm: (eventId: string) => Promise<void>;
  snoozeAlarm: (eventId: string) => Promise<void>;
}

const AlarmContext = createContext<AlarmContextType | null>(null);

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [activeAlarm, setActiveAlarm] = useState<ICalendarEvent | null>(null);
  const activeAlarmRef = useRef<ICalendarEvent | null>(null);
  activeAlarmRef.current = activeAlarm;

  // Tracks pending snooze re-trigger so it can be cancelled on unmount
  const snoozeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAlarm = useCallback((event: ICalendarEvent) => {
    setActiveAlarm(event);
  }, []);

  const dismissAlarm = useCallback(async (eventId: string) => {
    setActiveAlarm(null);
    // stopRinging stops the AlarmService → clears sound + removes the notification
    await NativeAlarmScheduler.stopRinging();
    // Also clean up our JS registry and any scheduled (not yet fired) alarm entry
    await NativeAlarmScheduler.cancelAlarm(eventId).catch(() => {});
    // Belt-and-suspenders: dismiss any remaining delivered notifications
    await Notifications.dismissAllNotificationsAsync().catch(() => {});
  }, []);

  const snoozeAlarm = useCallback(async (eventId: string) => {
    const event = activeAlarmRef.current;
    setActiveAlarm(null);

    // Stop the currently ringing alarm (clears notification)
    await NativeAlarmScheduler.stopRinging();
    await Notifications.dismissAllNotificationsAsync().catch(() => {});

    // Schedule the native alarm again for +5 minutes
    const snoozeMs = 5 * 60 * 1000;
    const snoozeTime = new Date(Date.now() + snoozeMs);
    await NativeAlarmScheduler.scheduleAlarm(
      snoozeTime,
      eventId,
      event?.title ?? '',
    ).catch(() => {});

    // Allow GlobalReminderService to re-fire the in-app screen at snooze time
    GlobalReminderService.unmarkAlarm(`alarm-${eventId}`);

    // Schedule the in-app alarm screen to re-appear at snooze time
    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    snoozeTimerRef.current = setTimeout(() => {
      if (event) triggerAlarm(event);
    }, snoozeMs);
  }, [triggerAlarm]);

  // Register exact-time alarm callback with GlobalReminderService
  useEffect(() => {
    GlobalReminderService.setAlarmCallback(triggerAlarm);
    return () => {
      GlobalReminderService.setAlarmCallback(null);
    };
  }, [triggerAlarm]);

  // Bidirectional sync: poll getActiveAlarmUid() while alarm screen is visible.
  // When the user taps "Hagarika" or "Rindira 5 min" on the notification panel,
  // the native AlarmService stops and getActiveAlarmUid() returns null — we
  // detect this here and close the alarm screen to match.
  useEffect(() => {
    if (!activeAlarm) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (cancelled) return;
      const uid = await NativeAlarmScheduler.getActiveAlarmUid().catch(() => 'unknown');
      if (cancelled) return;

      if (!uid) {
        // Native alarm stopped (dismissed or snoozed via notification panel)
        setActiveAlarm(null);
        return;
      }
      // Keep polling
      timer = setTimeout(poll, 1500);
    };

    // Give the AlarmService a moment to fully initialise before first poll
    timer = setTimeout(poll, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeAlarm?.id]);

  // Clean up snooze timer on unmount
  useEffect(() => {
    return () => {
      if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    };
  }, []);

  return (
    <AlarmContext.Provider value={{ activeAlarm, triggerAlarm, dismissAlarm, snoozeAlarm }}>
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarmContext(): AlarmContextType {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error('useAlarmContext must be used inside AlarmProvider');
  return ctx;
}
