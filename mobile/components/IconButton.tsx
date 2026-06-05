import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, TextStyle, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts } from '@/theme';

type Props = {
  onPress?: () => void;
  icon?: React.ReactNode;
  title?: string;
  style?: ViewStyle | ViewStyle[];
  titleStyle?: TextStyle;
  circleSize?: number; // px
  circleColor?: string;
  iconColor?: string;
  disabled?: boolean;
};

export default function IconButton({
  onPress,
  icon,
  title,
  style,
  titleStyle,
  circleSize = 96,
  circleColor,
  iconColor,
  disabled = false,
}: Props) {
  const { isDark, themeColors } = useTheme();
  const defaultCircle = circleColor ?? (isDark ? '#1f2937' : '#e6e6ef');
  const defaultIconColor = iconColor ?? '#3363AD';
  const titleColor = '#fff';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.wrapper, style as any]} disabled={disabled}>
      <View style={[styles.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2, backgroundColor: defaultCircle }]}>
        {icon ? (
          // allow caller to pass icon; if they want a specific color they can pass a colored icon node
          <View style={styles.iconInner as any}>
            {React.isValidElement(icon)
              ? (() => {
                  const anyIcon: any = icon;
                  // if it looks like an Image (has a source prop), clone with tintColor and size
                  if (anyIcon.props && anyIcon.props.source) {
                    return React.cloneElement(anyIcon, {
                      style: [
                        { width: Math.round(circleSize * 0.45), height: Math.round(circleSize * 0.45), tintColor: defaultIconColor },
                        anyIcon.props?.style,
                      ],
                    });
                  }
                  // otherwise assume a vector icon element and inject color/size
                  return React.cloneElement(anyIcon, { color: defaultIconColor, size: Math.round(circleSize * 0.45) });
                })()
              : icon}
          </View>
        ) : null}
      </View>

      {title ? (
        <Text style={[styles.title, { color: titleColor }, titleStyle as any]} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
     color: '#fff'
  },
  title: {
    marginTop: 8,
    fontSize: 18,
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
});
