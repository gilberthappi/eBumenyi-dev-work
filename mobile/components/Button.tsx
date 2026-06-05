import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts } from '@/theme';

type Props = {
  title?: string;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export default function Button({ title = '', onPress, style, loading, icon, variant = 'primary', disabled = false }: Props) {
  const { themeColors } = useTheme();

  // explicit brand colors (user requested)
  const COLORS: Record<string, string> = {
    primary: '#3363AD',
    secondary: '#073E92',
  };

  const bg = COLORS[variant] ?? COLORS.primary;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.wrapper, style as any]} disabled={loading || disabled}>
      <LinearGradient
        colors={[bg, bg]}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.content}>
            {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
            <Text style={[styles.title, { fontFamily: fonts.semibold }]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  gradient: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 13,
  },
});
