import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  active: 'members' | 'messages' | 'blog';
  onChange: (v: Props['active']) => void;
};

export default function CommunityTabs({ active, onChange }: Props) {
  const { themeColors } = useTheme();

  return (
    <View style={styles.container}>
      {(['members', 'messages', 'blog'] as Props['active'][]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          style={[
            styles.tab,
            active === tab && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: active === tab }}
        >
          <Text style={[styles.label, active === tab && { color: 'white' }]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  label: {
    color: '#0f172a',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});
