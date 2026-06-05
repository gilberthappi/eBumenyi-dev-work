import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  Pressable,
  PanResponder,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

type WeekStart = 0 | 1;

export interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  locale?: string;
  weekStartsOn?: WeekStart;
  isDark?: boolean;
  themeColors?: any;
}

const MONTH_KEYS = [
  'calendar.month.jan',
  'calendar.month.feb',
  'calendar.month.mar',
  'calendar.month.apr',
  'calendar.month.may',
  'calendar.month.jun',
  'calendar.month.jul',
  'calendar.month.aug',
  'calendar.month.sep',
  'calendar.month.oct',
  'calendar.month.nov',
  'calendar.month.dec',
];

const MONTH_FALLBACKS = {
  'en-US': [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  'rw-RW': [
    'Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena',
    'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza',
  ],
  'fr-FR': [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ],
} as const;

const WEEKDAY_KEYS = [
  'calendar.weekdays.sun', 'calendar.weekdays.mon', 'calendar.weekdays.tue',
  'calendar.weekdays.wed', 'calendar.weekdays.thu', 'calendar.weekdays.fri',
  'calendar.weekdays.sat',
];

const WEEKDAY_FALLBACKS = {
  'en-US': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'rw-RW': [
    'Ku cyumweru', 'Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu',
    'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu',
  ],
  'fr-FR': ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
} as const;

const localeMap: Record<string, string> = {
  en: 'en-US',
  rw: 'rw-RW',
  fr: 'fr-FR',
};

const toStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDate = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const clampDate = (date: Date, minimumDate?: Date, maximumDate?: Date) => {
  let next = new Date(date.getTime());
  if (minimumDate && next < toStartOfDay(minimumDate)) {
    next = new Date(minimumDate.getTime());
  }
  if (maximumDate && next > toStartOfDay(maximumDate)) {
    next = new Date(maximumDate.getTime());
  }
  return next;
};

const safeIntlFormat = (
  locale: string,
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string => {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return '';
  }
};

const normalizeFallbackLabel = (label: string) => {
  if (!label) return label;
  return label.includes(' ') ? label.replace(' ', '\n') : label;
};

const getMonthNames = (locale: string, t: (key: string) => string) =>
  MONTH_KEYS.map((key, index) => {
    const sample = new Date(2024, index, 1);
    const intl = safeIntlFormat(locale, sample, { month: 'long' });
    if (intl) return intl;
    const translated = t(key);
    if (translated && translated !== key) return translated;
    const fallback = MONTH_FALLBACKS[locale as keyof typeof MONTH_FALLBACKS] ??
      MONTH_FALLBACKS['en-US'];
    return fallback[index];
  });

const getWeekdayLabels = (
  locale: string,
  weekStartsOn: WeekStart,
  t: (key: string) => string,
) => {
  const fallback = WEEKDAY_FALLBACKS[locale as keyof typeof WEEKDAY_FALLBACKS] ??
    WEEKDAY_FALLBACKS['en-US'];

  return Array.from({ length: 7 }, (_, idx) => {
    const weekdayIndex = (weekStartsOn + idx) % 7;
    const baseDate = new Date(2024, 0, 7 + weekdayIndex);
    const intl = safeIntlFormat(locale, baseDate, { weekday: 'short' });
    const translated = t(WEEKDAY_KEYS[weekdayIndex]);
    const rawLabel = intl || (translated && translated !== WEEKDAY_KEYS[weekdayIndex] ? translated : fallback[weekdayIndex]);
    return normalizeFallbackLabel(rawLabel);
  });
};

const getMonthStartNavKey = (year: number, month: number) =>
  new Date(year, month, 1).getTime();

const getMonthEndNavKey = (year: number, month: number) =>
  new Date(year, month + 1, 0).getTime();

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

// Generate year range
const generateYearRange = (minDate?: Date, maxDate?: Date) => {
  const currentYear = new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : currentYear - 100;
  const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 100;
  
  const years: number[] = [];
  for (let year = minYear; year <= maxYear; year++) {
    years.push(year);
  }
  return years.reverse(); // Show most recent years first
};

export default function DatePickerModal({
  visible,
  value,
  onConfirm,
  onCancel,
  title,
  confirmLabel,
  cancelLabel,
  minimumDate,
  maximumDate,
  locale,
  weekStartsOn,
  isDark,
  themeColors,
}: DatePickerModalProps) {
  const { t, language } = useLanguage();
  const themeContext = useTheme();
  const insets = useSafeAreaInsets();
  const resolvedIsDark = isDark ?? themeContext.isDark;
  const resolvedThemeColors = themeColors ?? themeContext.themeColors;
  const resolvedLocale = locale ?? localeMap[language] ?? (language || 'en-US');
  const resolvedWeekStartsOn: WeekStart = weekStartsOn ?? (resolvedLocale === 'en-US' ? 0 : 1);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 16);

  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;

  // Track if we're in the middle of a close animation
  const isClosing = useRef(false);

  // Year list ref for scrolling to selected year
  const yearListRef = useRef<ScrollView>(null);

  const yearRange = useMemo(() => generateYearRange(minimumDate, maximumDate), [minimumDate, maximumDate]);

  const animateIn = useCallback(() => {
    slideAnim.setValue(SCREEN_HEIGHT);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    cardTranslateY.setValue(0);
    isClosing.current = false;

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
    ]).start();
  }, [slideAnim, fadeAnim, scaleAnim, cardTranslateY]);

  useEffect(() => {
    if (!visible) return;
    const next = clampDate(value, minimumDate, maximumDate);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setDay(next.getDate());
    setShowYearPicker(false);
    animateIn();
  }, [visible, value, minimumDate, maximumDate, animateIn]);

  const animateOut = useCallback((callback?: () => void) => {
    if (isClosing.current) return;
    isClosing.current = true;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isClosing.current = false;
      callback?.();
    });
  }, [slideAnim, fadeAnim, cardTranslateY]);

  const handleClose = useCallback(() => {
    if (showYearPicker) {
      setShowYearPicker(false);
      return;
    }
    animateOut(() => onCancel());
  }, [animateOut, onCancel, showYearPicker]);

  // Pan responder for swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !showYearPicker,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !showYearPicker && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0 && !showYearPicker) {
          cardTranslateY.setValue(gestureState.dy);
          const progress = Math.min(gestureState.dy / SCREEN_HEIGHT, 1);
          fadeAnim.setValue(1 - progress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (showYearPicker) return;
        if (
          gestureState.dy > SWIPE_THRESHOLD ||
          gestureState.vy > SWIPE_VELOCITY_THRESHOLD
        ) {
          Animated.parallel([
            Animated.timing(cardTranslateY, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onCancel();
          });
        } else {
          Animated.parallel([
            Animated.spring(cardTranslateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const monthNames = useMemo(
    () => getMonthNames(resolvedLocale, t),
    [resolvedLocale, t],
  );

  const weekdayLabels = useMemo(
    () => getWeekdayLabels(resolvedLocale, resolvedWeekStartsOn, t),
    [resolvedLocale, resolvedWeekStartsOn, t],
  );

  const currentDate = useMemo(
    () => new Date(year, month, day),
    [year, month, day],
  );

  const selectedDate = useMemo(
    () => clampDate(currentDate, minimumDate, maximumDate),
    [currentDate, minimumDate, maximumDate],
  );

  useEffect(() => {
    if (!visible) return;
    if (!isSameDate(selectedDate, currentDate)) {
      setYear(selectedDate.getFullYear());
      setMonth(selectedDate.getMonth());
      setDay(selectedDate.getDate());
    }
  }, [visible, selectedDate, currentDate]);

  const canGoPrev = useMemo(() => {
    if (!minimumDate) return true;
    return getMonthEndNavKey(year, month - 1) >= toStartOfDay(minimumDate).getTime();
  }, [minimumDate, year, month]);

  const canGoNext = useMemo(() => {
    if (!maximumDate) return true;
    return getMonthStartNavKey(year, month + 1) <= toStartOfDay(maximumDate).getTime();
  }, [maximumDate, year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const leadingEmptyCells = (firstDayIndex - resolvedWeekStartsOn + 7) % 7;
  const totalCells = Math.ceil((leadingEmptyCells + daysInMonth) / 7) * 7;

  const cells = useMemo(() => {
    const items: Array<{ date: Date | null; inCurrentMonth: boolean }> = [];
    const previousMonthDays = new Date(year, month, 0).getDate();

    for (let index = 0; index < totalCells; index += 1) {
      const dayNumber = index - leadingEmptyCells + 1;
      if (dayNumber < 1) {
        const date = new Date(year, month - 1, previousMonthDays + dayNumber);
        items.push({ date, inCurrentMonth: false });
        continue;
      }

      if (dayNumber > daysInMonth) {
        const date = new Date(year, month + 1, dayNumber - daysInMonth);
        items.push({ date, inCurrentMonth: false });
        continue;
      }

      items.push({ date: new Date(year, month, dayNumber), inCurrentMonth: true });
    }

    return items;
  }, [year, month, totalCells, leadingEmptyCells, daysInMonth]);

  const bg = resolvedIsDark ? '#1a1a2e' : '#ffffff';
  const surfaceBg = resolvedIsDark ? '#16213e' : '#f8fafc';
  const text = resolvedIsDark ? '#e2e8f0' : '#1e293b';
  const subText = resolvedIsDark ? '#94a3b8' : '#64748b';
  const border = resolvedIsDark ? '#334155' : '#e2e8f0';
  const muted = resolvedIsDark ? '#475569' : '#cbd5e1';
  const primary = resolvedThemeColors?.primary ?? '#3b82f6';
  const primaryLight = resolvedThemeColors?.primaryLight ?? '#dbeafe';

  const headerTitle = title || t('calendar.form.selectDate') || 'Select Date';
  const confirmText = confirmLabel || t('calendar.form.confirm') || 'Confirm';
  const cancelText = cancelLabel || t('calendar.form.cancel') || 'Cancel';

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    const nextMonth = month === 0 ? 11 : month - 1;
    const nextYear = month === 0 ? year - 1 : year;
    const nextDaysInMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    setYear(nextYear);
    setMonth(nextMonth);
    setDay((prev) => Math.min(prev, nextDaysInMonth));
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const nextDaysInMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    setYear(nextYear);
    setMonth(nextMonth);
    setDay((prev) => Math.min(prev, nextDaysInMonth));
  };

  const handleSelectDate = (date: Date) => {
    if (minimumDate && toStartOfDay(date) < toStartOfDay(minimumDate)) return;
    if (maximumDate && toStartOfDay(date) > toStartOfDay(maximumDate)) return;
    setYear(date.getFullYear());
    setMonth(date.getMonth());
    setDay(date.getDate());
  };

  const handleYearSelect = (selectedYear: number) => {
    const nextDaysInMonth = new Date(selectedYear, month + 1, 0).getDate();
    setYear(selectedYear);
    setDay((prev) => Math.min(prev, nextDaysInMonth));
    setShowYearPicker(false);
  };

  const handleConfirm = () => {
    const confirmedDate = clampDate(new Date(year, month, day), minimumDate, maximumDate);
    animateOut(() => onConfirm(confirmedDate));
  };

  const openYearPicker = () => {
    setShowYearPicker(true);
    // Scroll to selected year after a short delay
    setTimeout(() => {
      if (yearListRef.current) {
        const yearIndex = yearRange.indexOf(year);
        if (yearIndex !== -1) {
          yearListRef.current.scrollTo({ y: yearIndex * 44, animated: true });
        }
      }
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            {
              backgroundColor: bg,
              borderColor: border,
              paddingBottom: bottomInset + 4,
              transform: [
                { translateY: Animated.add(slideAnim, cardTranslateY) },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {!showYearPicker ? (
            <>
              {/* Drag Handle */}
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: muted }]} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Calendar size={20} color={primary} style={styles.headerIcon} />
                  <Text style={[styles.title, { color: text }]}>{headerTitle}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={[styles.closeButton, { backgroundColor: surfaceBg }]}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={subText} />
                </TouchableOpacity>
              </View>

              {/* Month Navigation */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  disabled={!canGoPrev}
                  style={[
                    styles.navButton,
                    {
                      borderColor: border,
                      backgroundColor: surfaceBg,
                      opacity: canGoPrev ? 1 : 0.4,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color={canGoPrev ? text : muted} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={openYearPicker}
                  style={styles.monthYearButton}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.monthText, { color: text }]}>
                    {monthNames[month]} {year}
                  </Text>
                  <View style={[styles.dropdownIndicator, { backgroundColor: primary }]} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleNextMonth}
                  disabled={!canGoNext}
                  style={[
                    styles.navButton,
                    {
                      borderColor: border,
                      backgroundColor: surfaceBg,
                      opacity: canGoNext ? 1 : 0.4,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={20} color={canGoNext ? text : muted} />
                </TouchableOpacity>
              </View>

              {/* Weekday Headers */}
              <View style={[styles.weekdayRow, { borderBottomColor: border }]}>
                {weekdayLabels.map((label, index) => (
                  <View key={`${label}-${index}`} style={styles.weekdayCell}>
                    <Text
                      style={[
                        styles.weekdayLabel,
                        { color: index === 0 || index === 6 ? primary : subText },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.grid}>
                {cells.map(({ date, inCurrentMonth }, index) => {
                  if (!date) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }

                  const disabled = (minimumDate && toStartOfDay(date) < toStartOfDay(minimumDate)) ||
                    (maximumDate && toStartOfDay(date) > toStartOfDay(maximumDate));
                  const selected = isSameDate(date, selectedDate);
                  const today = isSameDate(date, new Date());

                  return (
                    <TouchableOpacity
                      key={`${date.toISOString()}-${index}`}
                      onPress={() => handleSelectDate(date)}
                      disabled={disabled}
                      style={[
                        styles.dayCell,
                        selected && { backgroundColor: primary },
                        !selected && today && { backgroundColor: primaryLight },
                        !inCurrentMonth && styles.outsideMonth,
                        disabled && styles.disabledCell,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: text },
                          selected && { color: '#ffffff', fontFamily: 'Inter-Bold' },
                          !selected && today && { color: primary, fontFamily: 'Inter-Bold' },
                          !inCurrentMonth && !selected && { color: muted },
                          disabled && { color: muted },
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {today && !selected && (
                        <View style={[styles.todayDot, { backgroundColor: primary }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={[
                    styles.cancelButton,
                    {
                      borderColor: border,
                      backgroundColor: surfaceBg,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelText, { color: subText }]}>{cancelText}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[
                    styles.confirmButton,
                    { backgroundColor: primary },
                    Platform.OS === 'ios' && styles.confirmButtonIOS,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>

            </>
          ) : (
            <>
              {/* Year Picker Header */}
              <View style={styles.yearPickerHeader}>
                <TouchableOpacity
                  onPress={() => setShowYearPicker(false)}
                  style={[styles.backButton, { backgroundColor: surfaceBg }]}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color={text} />
                </TouchableOpacity>
                <Text style={[styles.yearPickerTitle, { color: text }]}>
                  {t('calendar.form.selectYear') || 'Select Year'}
                </Text>
                <View style={styles.backButton} />
              </View>

              {/* Year List */}
              <ScrollView
                ref={yearListRef}
                style={styles.yearList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.yearListContent}
              >
                {yearRange.map((yearItem) => (
                  <TouchableOpacity
                    key={yearItem}
                    onPress={() => handleYearSelect(yearItem)}
                    style={[
                      styles.yearItem,
                      { borderBottomColor: border },
                      yearItem === year && { backgroundColor: primaryLight },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.yearItemText,
                        { color: text },
                        yearItem === year && { color: primary, fontFamily: 'Inter-Bold' },
                      ]}
                    >
                      {yearItem}
                    </Text>
                    {yearItem === year && (
                      <View style={[styles.selectedYearDot, { backgroundColor: primary }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  monthText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  },
  dropdownIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
    marginTop: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: 4,
    marginBottom: 2,
    borderBottomWidth: 1,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dayText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 6,
  },
  outsideMonth: {
    opacity: 0.3,
  },
  disabledCell: {
    opacity: 0.2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 0,
    marginBottom: 4,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonIOS: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  confirmText: {
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
  },
  // Year Picker Styles
  yearPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearPickerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  },
  yearList: {
    maxHeight: SCREEN_HEIGHT * 0.42,
  },
  yearListContent: {
    paddingBottom: 8,
  },
  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 2,
  },
  yearItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  selectedYearDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
});
