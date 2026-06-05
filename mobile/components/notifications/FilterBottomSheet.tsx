import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  X,
  Calendar,
  BookOpen,
  MessageCircle,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react-native';

type NotificationType = 'all' | 'calendar' | 'course' | 'message' | 'alert' | 'system';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  activeType: NotificationType;
  onTypeChange: (type: NotificationType) => void;
}

export default function FilterBottomSheet({
  visible,
  onClose,
  activeType,
  onTypeChange,
}: FilterBottomSheetProps) {
  const { isDark, themeColors } = useTheme();

  const types: Array<{
    key: NotificationType;
    label: string;
    icon: any;
  }> = [
    { key: 'all', label: 'Byose', icon: CheckCircle },
    { key: 'calendar', label: 'Gahunda & Inama', icon: Calendar },
    { key: 'course', label: 'Amasomo', icon: BookOpen },
    { key: 'message', label: 'Ubutumwa', icon: MessageCircle },
    { key: 'alert', label: 'Iburira', icon: AlertTriangle },
    { key: 'system', label: 'Sisitemu', icon: Info },
  ];

  const handleSelect = (type: NotificationType) => {
    onTypeChange(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.sheet,
            { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar}>
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? '#4b5563' : '#d1d5db' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#e5e7eb' : '#111827' }]}>
              Hitamo ubwoko
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {/* Type List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {types.map((type) => {
              const isActive = activeType === type.key;
              const Icon = type.icon;
              const iconColor = isActive ? themeColors.primary : (isDark ? '#9ca3af' : '#6b7280');

              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeItem,
                    {
                      backgroundColor: isActive
                        ? isDark
                          ? '#374151'
                          : '#f3f4f6'
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelect(type.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: isActive ? `${themeColors.primary}15` : (isDark ? '#374151' : '#f3f4f6') },
                    ]}
                  >
                    <Icon size={24} color={iconColor} />
                  </View>
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: isDark ? '#e5e7eb' : '#111827' },
                      isActive && styles.typeLabelActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                  {isActive && (
                    <View style={styles.checkmark}>
                      <CheckCircle size={20} color={themeColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  typeLabelActive: {
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: 'auto',
  },
});
