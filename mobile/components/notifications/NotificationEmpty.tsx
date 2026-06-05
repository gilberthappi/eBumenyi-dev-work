import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Bell, BellOff, Search } from 'lucide-react-native';

interface NotificationEmptyProps {
  type: 'all' | 'unread' | 'search';
  searchQuery?: string;
}

export default function NotificationEmpty({ type, searchQuery }: NotificationEmptyProps) {
  const { isDark } = useTheme();

  const getContent = () => {
    switch (type) {
      case 'search':
        return {
          Icon: Search,
          title: 'Nta gisubizo cyabonetse',
          message: searchQuery
            ? `Nta matangazo aboneka kuri "${searchQuery}"`
            : 'Gerageza gushakisha ikindi',
        };
      case 'unread':
        return {
          Icon: BellOff,
          title: 'Nta matangazo mashya',
          message: 'Wasomye amatangazo yose. Urakoze!',
        };
      case 'all':
      default:
        return {
          Icon: Bell,
          title: 'Nta matangazo',
          message: 'Uzabona amatangazo yawe hano',
        };
    }
  };

  const { Icon, title, message } = getContent();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isDark ? '#374151' : '#f3f4f6' },
        ]}
      >
        <Icon size={48} color={isDark ? '#9ca3af' : '#6b7280'} strokeWidth={1.5} />
      </View>
      <Text style={[styles.title, { color: isDark ? '#e5e7eb' : '#111827' }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
