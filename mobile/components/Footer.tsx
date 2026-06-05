import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, Award, Users } from 'lucide-react-native';

const TAB_CONFIG = [
  { name: 'index', icon: Home, label: 'Ahabanza' },
  { name: 'training', icon: BookOpen, label: 'Amasomo' },
  { name: 'certificate', icon: Award, label: 'Icyemezo' },
  { name: 'community', icon: Users, label: 'Kominote' },
];

type FooterProps = {
  activeTab: string;
  onTabPress: (tabName: string) => void;
};

export default function Footer({ activeTab, onTabPress }: FooterProps) {
  const { themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabWidth = Dimensions.get('window').width / TAB_CONFIG.length;
  return (
    <View style={[
      styles.tabBar, 
      { 
        backgroundColor: isDark ? '#1f2937' : '#fff', 
        borderTopColor: isDark ? '#374151' : '#e5e7eb', 
        position: 'absolute', 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 100,
        paddingBottom: Math.max(insets.bottom + 4, 12), // Extra padding for on-screen nav buttons
        minHeight: 60 + insets.bottom, // Ensure minimum height plus safe area
      }
    ]}> 
      {TAB_CONFIG.map((tab, idx) => {
        const isFocused = activeTab === tab.name;
        const color = isFocused ? themeColors.primary : (isDark ? '#9ca3af' : '#6b7280');
        return (
          <TouchableOpacity
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => onTabPress(tab.name)}
            style={[styles.tab, { width: tabWidth }]}
            activeOpacity={0.8}
          >
            <tab.icon size={28} color={color} />
            <View style={{ marginTop: 2 }}>
              <Text style={{
                color,
                fontWeight: isFocused ? 'bold' : 'normal',
                fontSize: 12,
                textAlign: 'center',
                opacity: isFocused ? 1 : 0.7,
                letterSpacing: 0.2,
              }}>{tab.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    position: 'relative',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44, // Ensure minimum touch target size
  },
});
