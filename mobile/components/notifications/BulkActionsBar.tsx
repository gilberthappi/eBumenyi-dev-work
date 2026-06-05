import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Check, Trash2, X } from 'lucide-react-native';

interface BulkActionsBarProps {
  selectedCount: number;
  onMarkAsRead: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  onMarkAsRead,
  onDelete,
  onCancel,
}: BulkActionsBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <View style={styles.leftSection}>
        <Text style={[styles.countText, { color: isDark ? '#e5e7eb' : '#111827' }]}>
          {selectedCount} {selectedCount === 1 ? 'byahiswemo' : 'byahiswemo'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
          onPress={onMarkAsRead}
          activeOpacity={0.7}
        >
          <Check size={20} color={isDark ? '#e5e7eb' : '#111827'} />
          <Text style={[styles.actionText, { color: isDark ? '#e5e7eb' : '#111827' }]}>
            Emeza
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Siba</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <X size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  leftSection: {
    flex: 1,
  },
  countText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
