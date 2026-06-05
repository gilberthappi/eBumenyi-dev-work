import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type FilterType = 'all' | 'unread' | 'read';

interface NotificationFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  unreadCount: number;
}

export default function NotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCount,
}: NotificationFiltersProps) {
  const { isDark, themeColors } = useTheme();

  const filters: Array<{ key: FilterType; label: string; badge?: number }> = [
    { key: 'all', label: 'Byose' },
    { key: 'unread', label: 'Ibitarasomwa', badge: unreadCount },
    { key: 'read', label: 'Byasomwe' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderBottomColor: isDark ? '#374151' : '#e5e7eb',
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isActive
                    ? themeColors.primary
                    : isDark
                    ? '#374151'
                    : '#f3f4f6',
                },
              ]}
              onPress={() => onFilterChange(filter.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive
                      ? '#ffffff'
                      : isDark
                      ? '#d1d5db'
                      : '#4b5563',
                  },
                ]}
              >
                {filter.label}
              </Text>
              {filter.badge !== undefined && filter.badge > 0 && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isActive ? '#ffffff' : themeColors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: isActive ? themeColors.primary : '#ffffff',
                      },
                    ]}
                  >
                    {filter.badge > 99 ? '99+' : filter.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
