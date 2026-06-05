/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Animated,
} from 'react-native';
import { ChevronDown, Calendar, Clock, AlertCircle, Repeat2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { EventType, EventFrequency } from '@/types';
// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}


export interface EventFormData {
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: EventType;
  location: string;
  frequency: EventFrequency;
  reminderMinutesBefore: number[];
  allDay: boolean;
  daysOfWeek: number[];
  recurrenceEndsAt: Date | null;
}

interface EventFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData, mode: 'create' | 'update', eventId?: string) => void;
  initialData?: Partial<EventFormData>;
  error?: string | null;
  mode?: 'create' | 'update';
  eventId?: string;
  isSubmitting?: boolean;
}

interface FieldErrors {
  title?: string;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  recurrenceEndsAt?: string;
}

// Default form state values
const getDefaultFormData = (date: Date): EventFormData => {
  const now = new Date();
  const rounded = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 5) * 5;
  const startHours = Math.floor(rounded / 60) % 24;
  const startMins = rounded % 60;
  
  const endTotal = rounded + 60;
  const endHours = Math.floor(endTotal / 60) % 24;
  const endMins = endTotal % 60;

  return {
    title: '',
    description: '',
    date: new Date(date.getTime()),
    startTime: `${`${startHours}`.padStart(2, '0')}:${`${startMins}`.padStart(2, '0')}`,
    endTime: `${`${endHours}`.padStart(2, '0')}:${`${endMins}`.padStart(2, '0')}`,
    type: 'training',
    location: '',
    frequency: 'NONE',
    reminderMinutesBefore: [30],
    allDay: false,
    daysOfWeek: [],
    recurrenceEndsAt: null,
  };
};

// Side-effect defaults per event type
const TYPE_DEFAULTS: Record<EventType, Partial<EventFormData>> = {
  training: { allDay: false, frequency: 'NONE', daysOfWeek: [] },
  reminder: { allDay: false, frequency: 'NONE', daysOfWeek: [] },
  deadline: { allDay: true,  frequency: 'NONE', daysOfWeek: [] },
};

// ─── Inline Date Picker ───────────────────────────────────────────────────────
interface DatePickerModalProps {
  visible: boolean; value: Date;
  onConfirm: (date: Date) => void; onCancel: () => void;
  isDark: boolean; themeColors: any;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({ visible, value, onConfirm, onCancel, isDark, themeColors }) => {
  const { t } = useLanguage();
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());

  useEffect(() => {
    if (visible) { setYear(value.getFullYear()); setMonth(value.getMonth()); setDay(value.getDate()); }
  }, [visible, value]);

  const monthKeys = [
    'calendar.month.jan','calendar.month.feb','calendar.month.mar','calendar.month.apr',
    'calendar.month.may','calendar.month.jun','calendar.month.jul','calendar.month.aug',
    'calendar.month.sep','calendar.month.oct','calendar.month.nov','calendar.month.dec',
  ];
  const monthFallbacks = [
    'Mutarama','Gashyantare','Werurwe','Mata','Gicurasi','Kamena',
    'Nyakanga','Kanama','Nzeri','Ukwakira','Ugushyingo','Ukuboza',
  ];
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const bg = isDark ? '#1f2937' : '#ffffff';
  const text = isDark ? '#f9fafb' : '#111827';
  const subText = isDark ? '#9ca3af' : '#6b7280';
  const border = isDark ? '#374151' : '#e5e7eb';
  // ── Past-date guard ───────────────────────────────────────────────────────
  const todayRef   = new Date();
  const todayYear  = todayRef.getFullYear();
  const todayMonth = todayRef.getMonth();
  const todayDay   = todayRef.getDate();
  // Are we viewing a month that is entirely before today?
  const isBeforeTodayMonth =
    year < todayYear || (year === todayYear && month < todayMonth);
  // Are we already on the earliest allowed month?
  const isAtMinMonth = year === todayYear && month === todayMonth;
  const isDayPast = (d: number): boolean => {
    if (isBeforeTodayMonth) return true;
    if (year === todayYear && month === todayMonth && d < todayDay) return true;
    return false;
  };
  // Navigate months but clamp selected day so it's never in the past
  const safeSetMonth = (newMonth: number, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
    if (newYear === todayYear && newMonth === todayMonth && day < todayDay) setDay(todayDay);
  };
  const handlePrevMonth = () => {
    if (isAtMinMonth) return;
    if (month === 0) safeSetMonth(11, year - 1); else safeSetMonth(month - 1, year);
  };
  const handleNextMonth = () => {
    if (month === 11) safeSetMonth(0, year + 1); else safeSetMonth(month + 1, year);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <View style={{ backgroundColor: bg, borderRadius: 20, padding: 24, width: 320, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
          {/* Month/Year navigation */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={isAtMinMonth}
              style={{ padding: 8, opacity: isAtMinMonth ? 0.25 : 1 }}
            >
              <Text style={{ color: themeColors.primary, fontSize: 18 }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: text }}>
              {t(monthKeys[month]) || monthFallbacks[month]} {year}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
              <Text style={{ color: themeColors.primary, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>
          {/* Day grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1).map(d => {
              const past     = isDayPast(d);
              const selected = d === day && !past;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => { if (!past) setDay(d); }}
                  disabled={past}
                  style={{
                    width: '14.28%', aspectRatio: 1, alignItems: 'center',
                    justifyContent: 'center', marginBottom: 4, borderRadius: 999,
                    backgroundColor: selected ? themeColors.primary : 'transparent',
                    opacity: past ? 0.28 : 1,
                  }}
                >
                  <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: selected ? '#fff' : text }}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
              <Text style={{ color: subText, fontFamily: 'Inter-SemiBold', fontSize: 14 }}>{t('calendar.form.cancel') || 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(new Date(year, month, day))}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: themeColors.primary, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 14 }}>{t('calendar.form.confirm') || 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Inline Time Picker ───────────────────────────────────────────────────────
interface TimePickerModalProps {
  visible: boolean; value: string;
  onConfirm: (time: string) => void; onCancel: () => void;
  isDark: boolean; themeColors: any;
}

const TIME_ITEM_HEIGHT = 44; // paddingVertical:10*2 + fontSize:16 lineHeight~20 + marginBottom:4

const TimePickerModal: React.FC<TimePickerModalProps> = ({ visible, value, onConfirm, onCancel, isDark, themeColors }) => {
  const { t } = useLanguage();
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && value) {
      const parts = value.split(':');
      if (parts.length === 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        setHour(h);
        setMinute(m);
        setTimeout(() => {
          hourScrollRef.current?.scrollTo({ y: h * TIME_ITEM_HEIGHT, animated: false });
          minuteScrollRef.current?.scrollTo({ y: m * TIME_ITEM_HEIGHT, animated: false });
        }, 80);
      }
    }
  }, [visible, value]);

  const bg = isDark ? '#1f2937' : '#ffffff';
  const text = isDark ? '#f9fafb' : '#111827';
  const subText = isDark ? '#9ca3af' : '#6b7280';
  const border = isDark ? '#374151' : '#e5e7eb';
  const itemBg = isDark ? '#374151' : '#f3f4f6';
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <View style={{ backgroundColor: bg, borderRadius: 20, padding: 24, width: 300, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
          <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: text, textAlign: 'center', marginBottom: 20 }}>
            {t('calendar.form.startTime') || 'Select Time'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Inter-SemiBold', color: subText, textAlign: 'center', marginBottom: 8 }}>{t('calendar.time') || 'Hour'}</Text>
              <ScrollView ref={hourScrollRef} style={{ height: 180 }} showsVerticalScrollIndicator={false}>
                {hours.map(h => (
                  <TouchableOpacity key={h} onPress={() => setHour(h)}
                    style={{ paddingVertical: 10, borderRadius: 10, marginBottom: 4, backgroundColor: h === hour ? themeColors.primary : itemBg, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontFamily: 'Inter-Medium', color: h === hour ? '#fff' : text }}>{`${h}`.padStart(2, '0')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ justifyContent: 'center', paddingBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: text }}>:</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Inter-SemiBold', color: subText, textAlign: 'center', marginBottom: 8 }}>Min</Text>
              <ScrollView ref={minuteScrollRef} style={{ height: 180 }} showsVerticalScrollIndicator={false}>
                {minutes.map(m => (
                  <TouchableOpacity key={m} onPress={() => setMinute(m)}
                    style={{ paddingVertical: 10, borderRadius: 10, marginBottom: 4, backgroundColor: m === minute ? themeColors.primary : itemBg, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontFamily: 'Inter-Medium', color: m === minute ? '#fff' : text }}>{`${m}`.padStart(2, '0')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
              <Text style={{ color: subText, fontFamily: 'Inter-SemiBold', fontSize: 14 }}>{t('calendar.form.cancel') || 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(`${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: themeColors.primary, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 14 }}>{t('calendar.form.confirm') || 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Form Modal ──────────────────────────────────────────────────────────
const EventFormModal: React.FC<EventFormModalProps> = ({
  visible, onClose, onSubmit, initialData, error, mode = 'create', eventId, isSubmitting = false,
}) => {
  const { isDark, themeColors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // ─ Form state
  const [formData, setFormData] = useState<EventFormData>(getDefaultFormData(new Date()));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ─ Picker visibility
  const [datePickerTarget, setDatePickerTarget] = useState<'date' | 'recurrence' | null>(null);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);

  // ─ Progressive disclosure
  const [showRepeat, setShowRepeat] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // ─ Animation refs
  const repeatAnim = useRef(new Animated.Value(0)).current;
  const moreAnim = useRef(new Animated.Value(0)).current;

  // ─── Smooth LayoutAnimation preset
  const triggerLayout = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 260,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
  }, []);

  // ─── Initialize & reset form when modal opens
  useEffect(() => {
    if (!visible) return;
    const base = getDefaultFormData(initialData?.date ?? new Date());
    const merged: EventFormData = { ...base, ...initialData };
    // ensure Date type (may come in as string from cache)
    merged.date = merged.date instanceof Date ? merged.date : new Date(merged.date);
    setFormData(merged);
    setFieldErrors({});

    // Edit mode: pre-expand sections that already have data
    const hasRepeat = merged.frequency !== 'NONE';
    const hasMore = !!(merged.description || merged.location);
    setShowRepeat(hasRepeat);
    setShowMoreOptions(hasMore);
    repeatAnim.setValue(hasRepeat ? 1 : 0);
    moreAnim.setValue(hasMore ? 1 : 0);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Generic field change handler
  const handleFormChange = useCallback(<K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'title' && fieldErrors.title) setFieldErrors(p => ({ ...p, title: undefined }));
  }, [fieldErrors.title]);

  // ─── Type change: apply defaults + animate layout
  const handleTypeChange = useCallback((newType: EventType) => {
    triggerLayout();
    setFormData(prev => ({ ...prev, type: newType, ...TYPE_DEFAULTS[newType] }));
    setFieldErrors({});
    // deadline has no repeat — collapse if open
    if (newType === 'deadline' && showRepeat) {
      Animated.timing(repeatAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      setShowRepeat(false);
    }
  }, [triggerLayout, showRepeat, repeatAnim]);

  // ─── Frequency change
  const handleFrequencyChange = useCallback((freq: EventFrequency) => {
    triggerLayout();
    setFormData(prev => ({ ...prev, frequency: freq, daysOfWeek: freq === 'WEEKLY' ? prev.daysOfWeek : [] }));
    if (fieldErrors.daysOfWeek) setFieldErrors(p => ({ ...p, daysOfWeek: undefined }));
  }, [triggerLayout, fieldErrors.daysOfWeek]);

  // ─── Toggle repeat accordion
  const toggleRepeat = useCallback(() => {
    const next = !showRepeat;
    triggerLayout();
    Animated.timing(repeatAnim, { toValue: next ? 1 : 0, duration: 220, useNativeDriver: true }).start();
    if (!next) setFormData(prev => ({ ...prev, frequency: 'NONE', daysOfWeek: [], recurrenceEndsAt: null }));
    setShowRepeat(next);
  }, [showRepeat, triggerLayout, repeatAnim]);

  // ─── Toggle more options
  const toggleMoreOptions = useCallback(() => {
    const next = !showMoreOptions;
    triggerLayout();
    Animated.timing(moreAnim, { toValue: next ? 1 : 0, duration: 220, useNativeDriver: true }).start();
    setShowMoreOptions(next);
  }, [showMoreOptions, triggerLayout, moreAnim]);

  // ─── Days of week toggle
  const toggleDayOfWeek = useCallback((day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day) ? prev.daysOfWeek.filter(d => d !== day) : [...prev.daysOfWeek, day],
    }));
    if (fieldErrors.daysOfWeek) setFieldErrors(p => ({ ...p, daysOfWeek: undefined }));
  }, [fieldErrors.daysOfWeek]);

  // ─── Duration custom input
  const handleDurationChange = useCallback((v: string) => {
    const num = parseInt(v.replace(/[^0-9]/g, ''), 10);
    setFormData(prev => ({ ...prev, duration: isNaN(num) ? 0 : num }));
  }, []);

  // ─── Picker callbacks
  const handleDateConfirm = useCallback((date: Date) => {
    if (datePickerTarget === 'date') setFormData(prev => ({ ...prev, date }));
    if (datePickerTarget === 'recurrence') {
      setFormData(prev => ({ ...prev, recurrenceEndsAt: date }));
      setFieldErrors(p => ({ ...p, recurrenceEndsAt: undefined }));
    }
    setDatePickerTarget(null);
  }, [datePickerTarget]);

  const handleTimeConfirm = useCallback((time: string) => {
    if (timePickerTarget === 'start') {
      setFormData(prev => ({ ...prev, startTime: time }));
      setFieldErrors(p => ({ ...p, startTime: undefined }));
    } else if (timePickerTarget === 'end') {
      setFormData(prev => ({ ...prev, endTime: time }));
      setFieldErrors(p => ({ ...p, endTime: undefined }));
    }
    setTimePickerTarget(null);
  }, [timePickerTarget]);

  // ─── Validate + submit
  const handleSubmit = useCallback(() => {
    const errors: FieldErrors = {};
    if (!formData.title.trim()) {
      errors.title = t('calendar.form.validation.titleRequired') || 'Title is required';
    }
    if (formData.type !== 'deadline') {
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.startTime)) {
        errors.startTime = t('calendar.form.validation.timeRequired') || 'Enter a valid time';
      }
      if (formData.type === 'training' && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.endTime)) {
        errors.endTime = t('calendar.form.validation.timeRequired') || 'Enter a valid time';
      }
    }
    if (formData.frequency === 'WEEKLY' && formData.daysOfWeek.length === 0) {
      errors.daysOfWeek = t('calendar.form.validation.daysRequired') || 'Select at least one day';
    }
    if (formData.frequency !== 'NONE' && !formData.recurrenceEndsAt) {
      errors.recurrenceEndsAt = t('calendar.form.validation.endsOnRequired') || 'End date required for repeating events';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Auto-expand sections containing errors
      if (errors.daysOfWeek && !showRepeat) {
        triggerLayout();
        Animated.timing(repeatAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        setShowRepeat(true);
      }
      return;
    }
    onSubmit(formData, mode, eventId);
  }, [formData, mode, eventId, onSubmit, t, showRepeat, triggerLayout, repeatAnim]);

  // ─── Date display helper
  const formatDateDisplay = useCallback((date: Date) => {
    const keys = ['calendar.month.jan','calendar.month.feb','calendar.month.mar','calendar.month.apr','calendar.month.may','calendar.month.jun','calendar.month.jul','calendar.month.aug','calendar.month.sep','calendar.month.oct','calendar.month.nov','calendar.month.dec'];
    const fallbacks = ['Mutarama','Gashyantare','Werurwe','Mata','Gicurasi','Kamena','Nyakanga','Kanama','Nzeri','Ukwakira','Ugushyingo','Ukuboza'];
    const mo = t(keys[date.getMonth()]) || fallbacks[date.getMonth()];
    return `${mo} ${date.getDate()}, ${date.getFullYear()}`;
  }, [t]);

  // ─── Static options (memoised implicitly via render)
  const reminderOptions = [
    { label: t('calendar.reminder.fiveMin') || '5 min', value: 5 },
    { label: t('calendar.reminder.tenMin') || '10 min', value: 10 },
    { label: t('calendar.reminder.fifteenMin') || '15 min', value: 15 },
    { label: t('calendar.reminder.thirtyMin') || '30 min', value: 30 },
    { label: t('calendar.reminder.oneHour') || '1h', value: 60 },
    { label: t('calendar.reminder.twoHours') || '2h', value: 120 },
    { label: t('calendar.reminder.oneDay') || '1 day', value: 1440 },
    { label: t('calendar.reminder.twoDays') || '2 days', value: 2880 },
    { label: t('calendar.reminder.oneWeek') || '1 week', value: 10080 },
  ];
  const frequencyOptions: { label: string; value: EventFrequency }[] = [
    { label: t('calendar.form.frequency.none') || 'One-time', value: 'NONE' },
    { label: t('calendar.form.frequency.daily') || 'Daily', value: 'DAILY' },
    { label: t('calendar.form.frequency.weekly') || 'Weekly', value: 'WEEKLY' },
  ];
  const eventTypeOptions: { label: string; value: EventType; color: string }[] = [
    { label: t('calendar.types.training') || 'Training', value: 'training', color: '#22c55e' },
    { label: t('calendar.types.reminder') || 'Reminder', value: 'reminder', color: '#f97316' },
    { label: t('calendar.types.deadline') || 'Deadline', value: 'deadline', color: '#ef4444' },
  ];
  const weekdayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // ─── Animated chevron interpolations
  const repeatRotate = repeatAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const moreRotate   = moreAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  // Always use primary color for consistency
  const activeTypeColor = themeColors.primary;
  const styles = createStyles(isDark, themeColors);
  const bottomSheetPadding = Platform.OS === 'ios'
    ? 36 + Math.max(insets.bottom, 0)
    : 24 + Math.max(insets.bottom, 12);

  // ─── Reusable sub-renders (kept as JSX variables, NOT as inner components,
  //     to prevent React from unmounting/remounting on every state change which
  //     would reset ScrollView scroll positions — the root cause of the "bounce".)

  const startTimeFieldJSX = (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>
        {t('calendar.form.startTime')} <Text style={{ color: '#ef4444' }}>*</Text>
      </Text>
      <TouchableOpacity
        style={[styles.pickerButton, fieldErrors.startTime ? styles.inputError : null]}
        onPress={() => setTimePickerTarget('start')} activeOpacity={0.7}
      >
        <Clock size={16} color={themeColors.primary} />
        <Text style={styles.pickerButtonText}>{formData.startTime}</Text>
        <ChevronDown size={14} color={styles.subTextColor.color} />
      </TouchableOpacity>
      {fieldErrors.startTime && (
        <View style={styles.errorRow}>
          <AlertCircle size={12} color="#ef4444" />
          <Text style={styles.errorText}>{fieldErrors.startTime}</Text>
        </View>
      )}
    </View>
  );

  const endTimeFieldJSX = (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>
        {t('calendar.form.endTime') || 'End Time'} <Text style={{ color: '#ef4444' }}>*</Text>
      </Text>
      <TouchableOpacity
        style={[styles.pickerButton, fieldErrors.endTime ? styles.inputError : null]}
        onPress={() => setTimePickerTarget('end')} activeOpacity={0.7}
      >
        <Clock size={16} color={themeColors.primary} />
        <Text style={styles.pickerButtonText}>{formData.endTime}</Text>
        <ChevronDown size={14} color={styles.subTextColor.color} />
      </TouchableOpacity>
      {fieldErrors.endTime && (
        <View style={styles.errorRow}>
          <AlertCircle size={12} color="#ef4444" />
          <Text style={styles.errorText}>{fieldErrors.endTime}</Text>
        </View>
      )}
    </View>
  );

  const reminderChipsJSX = (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{t('calendar.form.reminder')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }} contentContainerStyle={{ paddingHorizontal: 4 }}>
        <View style={[styles.chipRow, { flexWrap: 'nowrap' }]}>
          {reminderOptions.map(opt => {
            const sel = formData.reminderMinutesBefore.includes(opt.value);
            return (
              <TouchableOpacity key={opt.value}
                onPress={() => {
                  const newReminders = sel
                    ? formData.reminderMinutesBefore.filter(v => v !== opt.value)
                    : [...formData.reminderMinutesBefore, opt.value];
                  handleFormChange('reminderMinutesBefore', newReminders);
                }}
                style={[styles.chip, sel && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]}
              >
                <Text style={[styles.chipText, sel && { color: '#fff' }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const repeatAccordionJSX = (
    <View style={[styles.formField, styles.accordionCard]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggleRepeat} activeOpacity={0.75}>
        <View style={styles.accordionLeft}>
          <Repeat2 size={15} color={showRepeat ? themeColors.primary : styles.subTextColor.color} />
          <Text style={[styles.accordionTitle, showRepeat && { color: themeColors.primary }]}>
            {t('calendar.form.repeatSection') || 'Repeat'}
          </Text>
          {formData.frequency !== 'NONE' && (
            <View style={[styles.frequencyBadge, { backgroundColor: `${themeColors.primary}20` }]}>
              <Text style={[styles.frequencyBadgeText, { color: themeColors.primary }]}>
                {frequencyOptions.find(o => o.value === formData.frequency)?.label}
              </Text>
            </View>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate: repeatRotate }] }}>
          <ChevronDown size={16} color={styles.subTextColor.color} />
        </Animated.View>
      </TouchableOpacity>

      {showRepeat && (
        <View style={styles.accordionBody}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }} contentContainerStyle={{ paddingHorizontal: 4 }}>
            <View style={[styles.chipRow, { flexWrap: 'nowrap' }]}>
              {frequencyOptions.map(opt => {
                const sel = opt.value === formData.frequency;
                return (
                  <TouchableOpacity key={opt.value} onPress={() => handleFrequencyChange(opt.value)}
                    style={[styles.chip, sel && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]}>
                    <Text style={[styles.chipText, sel && { color: '#fff' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {formData.frequency === 'WEEKLY' && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.formLabel}>{t('calendar.form.daysOfWeek')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }} contentContainerStyle={{ paddingHorizontal: 4 }}>
                <View style={[styles.dayChipRow, { flexWrap: 'nowrap' }]}>
                  {weekdayKeys.map((key, idx) => {
                    const dayNumber = idx === 6 ? 0 : idx + 1;
                    const sel = formData.daysOfWeek.includes(dayNumber);
                    const fullLabel = t(`calendar.weekdays.${key}`) ||
                      ['Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu', 'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu', 'Ku cyumweru'][idx];
                    return (
                      <TouchableOpacity key={key} onPress={() => toggleDayOfWeek(dayNumber)}
                        style={[styles.dayChipPill, sel && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]}>
                        <Text style={[styles.dayChipText, sel && { color: '#fff' }]}>{fullLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              {fieldErrors.daysOfWeek && (
                <View style={[styles.errorRow, { marginTop: 6 }]}>
                  <AlertCircle size={12} color="#ef4444" />
                  <Text style={styles.errorText}>{fieldErrors.daysOfWeek}</Text>
                </View>
              )}
            </View>
          )}

          {formData.frequency !== 'NONE' && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.formLabel}>{t('calendar.form.endsOn') || 'Ends On'} <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TouchableOpacity
                style={[styles.pickerButton, fieldErrors.recurrenceEndsAt ? styles.inputError : null]}
                onPress={() => setDatePickerTarget('recurrence')} activeOpacity={0.7}
              >
                <Calendar size={16} color={themeColors.primary} />
                <Text style={styles.pickerButtonText}>
                  {formData.recurrenceEndsAt ? formatDateDisplay(formData.recurrenceEndsAt) : (t('calendar.form.selectDate') || 'Select date')}
                </Text>
                <ChevronDown size={14} color={styles.subTextColor.color} />
              </TouchableOpacity>
              {fieldErrors.recurrenceEndsAt && (
                <View style={[styles.errorRow, { marginTop: 6 }]}>
                  <AlertCircle size={12} color="#ef4444" />
                  <Text style={styles.errorText}>{fieldErrors.recurrenceEndsAt}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );

  // ─── All fields section (inlined, not a function component)
  const allFieldsSectionJSX = (
    <>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>{startTimeFieldJSX}</View>
        <View style={{ flex: 1 }}>{endTimeFieldJSX}</View>
      </View>

      {/* Location field */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{t('calendar.form.location')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('calendar.form.locationPlaceholder')}
          placeholderTextColor={styles.subTextColor.color}
          value={formData.location}
          onChangeText={v => handleFormChange('location', v)}
          autoCapitalize="none"
        />
      </View>

      {repeatAccordionJSX}
      {reminderChipsJSX}

      {/* Description field */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{t('calendar.form.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('calendar.form.descriptionPlaceholder')}
          placeholderTextColor={styles.subTextColor.color}
          value={formData.description}
          onChangeText={v => handleFormChange('description', v)}
          multiline numberOfLines={3} textAlignVertical="top"
        />
      </View>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <DatePickerModal
        visible={datePickerTarget !== null}
        value={datePickerTarget === 'recurrence' ? (formData.recurrenceEndsAt ?? formData.date) : formData.date}
        onConfirm={handleDateConfirm} onCancel={() => setDatePickerTarget(null)}
        isDark={isDark} themeColors={themeColors}
      />
      <TimePickerModal
        visible={timePickerTarget !== null}
        value={timePickerTarget === 'start' ? formData.startTime : formData.endTime}
        onConfirm={handleTimeConfirm} onCancel={() => setTimePickerTarget(null)}
        isDark={isDark} themeColors={themeColors}
      />

      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent={Platform.OS === 'android'} onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.avoidView} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.card, { paddingBottom: bottomSheetPadding }]}>
                {/* ── Handle ── */}
                <View style={styles.handle} />

                {/* ── Header ── */}
                <View style={styles.header}>
                  <View style={[styles.headerDot, { backgroundColor: themeColors.primary }]} />
                  <Text style={styles.headerTitle}>
                    {mode === 'update' ? t('calendar.form.updateTitle') : t('calendar.form.title')}
                  </Text>
                </View>

                {/* ── API Error ── */}
                {error ? (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={16} color="#ef4444" />
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                ) : null}

                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                  {/* ━━━ STAGE 1 — CORE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

                  {/* Title */}
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>
                      {t('calendar.form.name')} <Text style={{ color: '#ef4444' }}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, fieldErrors.title ? styles.inputError : null]}
                      placeholder={t('calendar.form.namePlaceholder')}
                      placeholderTextColor={styles.subTextColor.color}
                      value={formData.title}
                      onChangeText={v => handleFormChange('title', v)}
                      autoCapitalize="sentences" returnKeyType="next"
                    />
                    {fieldErrors.title && (
                      <View style={styles.errorRow}>
                        <AlertCircle size={12} color="#ef4444" />
                        <Text style={styles.errorText}>{fieldErrors.title}</Text>
                      </View>
                    )}
                  </View>

                  {/* Event Type — full-width segmented selector */}
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>{t('calendar.form.type')}</Text>
                    <View style={styles.typeRow}>
                      {eventTypeOptions.map(opt => {
                        const sel = opt.value === formData.type;
                        return (
                          <TouchableOpacity key={opt.value} onPress={() => handleTypeChange(opt.value)}
                            style={[styles.typeCard, sel && { borderColor: themeColors.primary, backgroundColor: `${themeColors.primary}12` }]}
                            activeOpacity={0.75}
                          >
                            <View style={[styles.typeCardDot, { backgroundColor: sel ? themeColors.primary : opt.color }, !sel && { opacity: 0.45 }]} />
                            <Text style={[styles.typeCardText, sel && { color: themeColors.primary, fontFamily: 'Inter-SemiBold' }]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Date */}
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>{t('calendar.form.date')}</Text>
                    <TouchableOpacity style={styles.pickerButton} onPress={() => setDatePickerTarget('date')} activeOpacity={0.7}>
                      <Calendar size={16} color={themeColors.primary} />
                      <Text style={styles.pickerButtonText} numberOfLines={1}>{formatDateDisplay(formData.date)}</Text>
                      <ChevronDown size={14} color={styles.subTextColor.color} />
                    </TouchableOpacity>
                  </View>

                  {/* ━━━ STAGE 2 — ALL FIELDS (no conditional hiding) ━━━━━━━━━━━━━━━━━━━━━━━ */}
                  <View style={styles.sectionDivider}>
                    <View style={styles.sectionDividerLine} />
                  </View>
                  {allFieldsSectionJSX}

                  <View style={{ height: 8 }} />
                </ScrollView>

                {/* ── Actions ── */}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
                    <Text style={styles.cancelBtnText}>{t('calendar.form.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: themeColors.primary }, isSubmitting && { opacity: 0.6 }]}
                    onPress={handleSubmit} disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.submitBtnText}>{mode === 'update' ? t('calendar.form.update') : t('calendar.form.add')}</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (isDark: boolean, themeColors: any) => StyleSheet.create({
  // Modal shell
  overlay:    { flex: 1, justifyContent: 'flex-end' },
  backdrop:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  avoidView:  { width: '100%', justifyContent: 'flex-end' },
  card: {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '94%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10,
  },
  handle: { width: 44, height: 4, backgroundColor: isDark ? '#6b7280' : '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },

  // Header
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  headerDot: { width: 10, height: 10, borderRadius: 5 },
  headerTitle: { fontSize: 19, fontFamily: 'Inter-Bold', color: isDark ? '#f9fafb' : '#111827' },

  // Error banner
  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#7f1d1d' : '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 14 },
  errorBannerText: { color: '#ef4444', fontSize: 13, fontFamily: 'Inter-Medium', flex: 1 },

  // Scroll
  scroll: { maxHeight: 500 },

  // Form primitives
  formField: { marginBottom: 18 },
  formLabel: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: isDark ? '#d1d5db' : '#374151', marginBottom: 8 },
  subTextColor: { color: isDark ? '#6b7280' : '#9ca3af' },

  input: {
    borderWidth: 1.5, borderColor: isDark ? '#374151' : '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: 'Inter-Regular',
    backgroundColor: isDark ? '#111827' : '#f9fafb',
    color: isDark ? '#f9fafb' : '#111827',
  },
  inputError: { borderColor: '#ef4444' },
  textArea:   { minHeight: 80, textAlignVertical: 'top' },
  errorRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText:  { fontSize: 12, fontFamily: 'Inter-Regular', color: '#ef4444' },

  pickerButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: isDark ? '#374151' : '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: isDark ? '#111827' : '#f9fafb',
  },
  pickerButtonText: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', color: isDark ? '#f9fafb' : '#111827' },

  // Type selector — full-width 3-column card
  typeRow:     { flexDirection: 'row', gap: 8 },
  typeCard:    {
    flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6,
    borderRadius: 14, borderWidth: 1.5, borderColor: isDark ? '#374151' : '#e5e7eb',
    backgroundColor: isDark ? '#111827' : '#f9fafb', gap: 6,
  },
  typeCardDot:  { width: 8, height: 8, borderRadius: 4 },
  typeCardText: { fontSize: 12, fontFamily: 'Inter-Medium', color: isDark ? '#d1d5db' : '#374151', textAlign: 'center' },

  // Chips (frequency, reminder)
  chipRow:  { flexDirection: 'row', gap: 8 },
  chip:     {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: isDark ? '#374151' : '#d1d5db',
    backgroundColor: isDark ? '#111827' : '#f9fafb',
  },
  chipText: { fontSize: 13, fontFamily: 'Inter-Medium', color: isDark ? '#d1d5db' : '#374151' },

  // Duration quick chips
  durationQuickRow: { flexDirection: 'row', gap: 8 },
  durationChip:     {
    flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12,
    borderWidth: 1.5, borderColor: isDark ? '#374151' : '#d1d5db',
    backgroundColor: isDark ? '#111827' : '#f9fafb',
  },
  durationChipText: { fontSize: 12, fontFamily: 'Inter-Medium', color: isDark ? '#d1d5db' : '#374151' },

  // Day chips (M T W T F S S)
  dayChipRow: { flexDirection: 'row', gap: 6 },
  dayChip:    {
    flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 999, borderWidth: 1.5, borderColor: isDark ? '#374151' : '#d1d5db',
    backgroundColor: isDark ? '#111827' : '#f9fafb',
  },
  dayChipPill: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: isDark ? '#374151' : '#d1d5db',
    backgroundColor: isDark ? '#111827' : '#f9fafb',
    marginRight: 8,
  },
  dayChipText: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: isDark ? '#d1d5db' : '#374151' },

  // Section divider between Stage 1 and Stage 2
  sectionDivider:     { marginBottom: 18 },
  sectionDividerLine: { height: 1, backgroundColor: isDark ? '#374151' : '#f1f5f9', marginHorizontal: -4 },

  // Repeat accordion card
  accordionCard:   {
    borderWidth: 1, borderColor: isDark ? '#374151' : '#e5e7eb',
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: isDark ? '#111827' : '#f9fafb',
  },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  accordionLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  accordionTitle:  { fontSize: 13, fontFamily: 'Inter-SemiBold', color: isDark ? '#d1d5db' : '#374151' },
  accordionBody:   { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#e5e7eb', paddingTop: 14 },

  frequencyBadge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  frequencyBadgeText: { fontSize: 11, fontFamily: 'Inter-SemiBold' },

  // All day badge (deadline)
  allDayBadgeRow:  { marginBottom: 18 },
  allDayBadge:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  allDayBadgeText: { fontSize: 13, fontFamily: 'Inter-SemiBold' },

  // More options divider + toggle
  moreDivider:     { height: 1, backgroundColor: isDark ? '#374151' : '#f1f5f9', marginBottom: 14, marginHorizontal: -4 },
  moreToggle:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, marginBottom: 4 },
  moreToggleText:  { fontSize: 13, fontFamily: 'Inter-SemiBold', color: isDark ? '#9ca3af' : '#6b7280' },
  moreBody:        { paddingTop: 12 },

  // Action buttons
  actions:        { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:      { flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: isDark ? '#374151' : '#d1d5db', backgroundColor: isDark ? '#111827' : '#f9fafb', alignItems: 'center' },
  cancelBtnText:  { fontSize: 15, fontFamily: 'Inter-SemiBold', color: isDark ? '#d1d5db' : '#374151' },
  submitBtn:      { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  submitBtnText:  { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#ffffff' },
});

export default EventFormModal;
