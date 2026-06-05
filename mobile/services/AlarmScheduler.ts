import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PENDING_ALARM_KEY = 'alarm__pending';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduledAlarm {
  /** expo-notifications identifier */
  notificationId: string;
  /** Your own logical alarm id (e.g. the calendar event id) */
  alarmId: string;
  targetDate: Date;
  message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Checks (and optionally requests) Android 12+ exact-alarm permission. */
async function ensureExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;

    const { status: asked } = await Notifications.requestPermissionsAsync({
      android: { allowAlert: true, allowSound: true, allowBadge: true },
    });

    if (asked !== 'granted') {
      // Last resort: open system settings so the user can allow "Alarms & Reminders"
      Linking.openSettings();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ─── AlarmScheduler ───────────────────────────────────────────────────────────

export const AlarmScheduler = {
  async scheduleAlarm(
    targetDate: Date,
    alarmId: string,
    message: string,
    soundFile = 'alarm',
  ): Promise<string | null> {
    // ── Guard: past date ──────────────────────────────────────────────────
    if (targetDate.getTime() <= Date.now()) {
      throw new Error(
        `[AlarmScheduler] Cannot schedule alarm in the past (${targetDate.toISOString()})`,
      );
    }

    // ── Guard: permissions ────────────────────────────────────────────────
    const hasPermission = await ensureExactAlarmPermission();
    if (!hasPermission) {
      console.warn(
        '[AlarmScheduler] Exact alarm permission denied — alarm not scheduled.',
      );
      return null;
    }

    // ── Cancel any existing alarm with the same logical id ────────────────
    await AlarmScheduler.cancelAlarm(alarmId);

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Igikorwa gitangiye`,
          body: message,
          // 'alarm' maps to alarm.wav bundled via expo-notifications sounds plugin
          sound: Platform.OS === 'android' ? soundFile : `${soundFile}.wav`,
          // Persist data so we can navigate on tap (or on full-screen intent launch)
          data: {
            alarmId,
            type: 'alarm',
            // Embed display fields so AlarmRingScreen has them even on cold-start
            eventTitle: message,
            eventTime: targetDate.toISOString(),
          },
          // iOS: break through Focus modes where possible
          ...(Platform.OS === 'ios' && {
            interruptionLevel: 'timeSensitive' as const,
          }),
        },
        // Date-based trigger — AlarmManager on Android, UNCalendarNotificationTrigger on iOS
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
        },

        ...(Platform.OS === 'android' &&
          ({
            android: {
              channelId: 'event-alarm',
              fullScreenAction: { identifier: 'default' },
            },
          } as any)),
      });

      console.log(
        `[AlarmScheduler] ✅ Alarm scheduled — id: ${notificationId}, alarmId: ${alarmId}, fires at: ${targetDate.toISOString()}`,
      );

      // Persist alarm info so _layout.tsx can detect a missed alarm on
      // foreground resume (independent of notification-tray state).
      await AsyncStorage.setItem(
        PENDING_ALARM_KEY,
        JSON.stringify({
          alarmId,
          eventTitle: message,
          eventTime: targetDate.toISOString(),
        }),
      ).catch(() => {});

      return notificationId;
    } catch (err) {
      console.error('[AlarmScheduler] Failed to schedule alarm:', err);
      return null;
    }
  },

  /**
   * Cancel all scheduled notifications whose data.alarmId matches.
   */
  async cancelAlarm(alarmId: string): Promise<void> {
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      const matching = all.filter((n) => n.content.data?.alarmId === alarmId);

      await Promise.all(
        matching.map((n) =>
          Notifications.cancelScheduledNotificationAsync(n.identifier),
        ),
      );

      if (matching.length > 0) {
        console.log(
          `[AlarmScheduler] Cancelled ${matching.length} notification(s) for alarmId: ${alarmId}`,
        );
      }

      // Clear the AsyncStorage entry if it matches this alarm
      try {
        const raw = await AsyncStorage.getItem(PENDING_ALARM_KEY);
        if (raw) {
          const pending = JSON.parse(raw);
          if (pending.alarmId === alarmId) {
            await AsyncStorage.removeItem(PENDING_ALARM_KEY);
          }
        }
      } catch {
        /* best effort */
      }
    } catch (err) {
      console.error('[AlarmScheduler] Failed to cancel alarm:', err);
    }
  },

  /**
   * Return all currently-scheduled alarms (notifications with data.alarmId set).
   */
  async getScheduledAlarms(): Promise<ScheduledAlarm[]> {
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      return all
        .filter((n) => n.content.data?.alarmId)
        .map((n) => ({
          notificationId: n.identifier,
          alarmId: n.content.data!.alarmId as string,
          // expo-notifications trigger may be a DateTrigger or CalendarTrigger
          targetDate: new Date(
            (n.trigger as any).value ??
              (n.trigger as any).dateComponents ??
              Date.now(),
          ),
          message: n.content.body ?? '',
        }));
    } catch (err) {
      console.error('[AlarmScheduler] Failed to get scheduled alarms:', err);
      return [];
    }
  },

  /**
   * Cancel ALL scheduled alarms (use on logout / full reset).
   */
  async cancelAllAlarms(): Promise<void> {
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      const alarmNotifs = all.filter((n) => n.content.data?.alarmId);
      await Promise.all(
        alarmNotifs.map((n) =>
          Notifications.cancelScheduledNotificationAsync(n.identifier),
        ),
      );
      await AsyncStorage.removeItem(PENDING_ALARM_KEY).catch(() => {});
      console.log(
        `[AlarmScheduler] Cancelled all ${alarmNotifs.length} alarm(s).`,
      );
    } catch (err) {
      console.error('[AlarmScheduler] Failed to cancel all alarms:', err);
    }
  },
};
