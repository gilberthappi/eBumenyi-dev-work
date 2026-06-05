import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Check, Circle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts } from '@/theme';

export type CheckboxItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
};

type Props = {
    groupLabel?: string;
  items: CheckboxItem[];
  multiple?: boolean; // true -> checkbox (square), false -> radio (single select)
  value?: string | string[];
  onChange: (val: string | string[]) => void;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  columns?: number;
};

export default function CheckboxGroup({
     groupLabel,
  items,
  multiple = false,
  value,
  onChange,
  style,
  itemStyle,
  columns = 1,
}: Props) {
  const { isDark, themeColors } = useTheme();
  const primary = themeColors?.primary ?? '#3363AD';
  const textColor = themeColors?.cardText ?? (isDark ? '#fff' : '#111827');
  const subtitleColor = isDark ? '#9ca3af' : '#6b7280';
  const labelColor = isDark ? '#d1d5db' : '#d1d5db';

  const initial = multiple ? (Array.isArray(value) ? value : []) : (typeof value === 'string' ? value : '');
  const [selection, setSelection] = useState<string[] | string>(initial);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => setSelection(initial), [value, multiple]);

  const toggle = (id: string) => {
    if (multiple) {
      const arr = Array.isArray(selection) ? [...selection] : [];
      const idx = arr.indexOf(id);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push(id);
      setSelection(arr);
      onChange(arr);
    } else {
      const next = selection === id ? '' : id;
      setSelection(next);
      onChange(next);
    }
  };

  const isSelected = (id: string) => {
    if (multiple) return Array.isArray(selection) && selection.includes(id);
    return selection === id;
  };

  // clamp columns between 1 and 6 and compute width percent
  const cols = Math.min(Math.max(Math.round(columns || 1), 1), 6);
  const colWidth = `${100 / cols}%`;
  const GAP = 8; // px gap between items
  const perItemWidth = containerWidth ? Math.floor((containerWidth - GAP * (cols - 1)) / cols) : undefined;

  return (
    <View style={[styles.container, style]}>
      {groupLabel ? <Text style={[styles.groupLabel, { color: labelColor, fontFamily: fonts.medium }]}>{groupLabel}</Text> : null}
      <View
        style={styles.itemsWrapper}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w && w !== containerWidth) setContainerWidth(w);
        }}
      >
        {items.map((it, idx) => {
          const isLastInRow = ((idx + 1) % cols) === 0;
          const perItemStyle = perItemWidth
            ? ({ width: perItemWidth, marginRight: isLastInRow ? 0 : GAP } as ViewStyle)
            : ({ flexBasis: colWidth, maxWidth: colWidth, marginRight: isLastInRow ? 0 : GAP } as ViewStyle);
          return (
            <TouchableOpacity
              key={it.id}
              activeOpacity={0.8}
              onPress={() => toggle(it.id)}
              // apply column sizing so items form rows of `cols`
              style={[styles.item, perItemStyle, itemStyle, { backgroundColor: isDark ? '#0f1724' : '#fff' }]}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: isSelected(it.id) }}
            >
              {it.icon ? <View style={styles.leftIcon}>{it.icon}</View> : null}

              <View style={styles.textWrap}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.title, { color: textColor }]}>{it.title}</Text>
                {it.subtitle ? <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.subtitle, { color: subtitleColor }]}>{it.subtitle}</Text> : null}
              </View>

              <View style={styles.indicatorWrap}>
                {multiple ? (
                  <View style={[styles.box, isSelected(it.id) && { borderColor: primary, backgroundColor: isSelected(it.id) ? primary : 'transparent' }]}> 
                    {isSelected(it.id) ? <Check color="#fff" size={14} /> : null}
                  </View>
                ) : isSelected(it.id) ? (
                  <View style={[styles.radioSelected, { backgroundColor: primary }]}> 
                    <Check color="#fff" size={12} />
                  </View>
                ) : (
                  <Circle color={isDark ? '#9ca3af' : '#6b7280'} size={18} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
 }

 const styles = StyleSheet.create({
   container: {
     width: '100%',
     flexDirection: 'column',
   },
   item: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 8,
     paddingHorizontal: 4,
     borderRadius: 12,
     marginBottom: 10,
     // match other inputs (Dropdown/TextField): fixed row height
     height: 48,
     // allow the item to be narrower than its content so percentage width works
     minWidth: 0,
     flexShrink: 1,
     borderWidth: 1,
     borderColor: 'transparent',
   },
   leftIcon: {
     marginRight: 0,
     width: 36,
     alignItems: 'center',
     justifyContent: 'center',
   },
   textWrap: {
     flex: 1,
     flexShrink: 1,
     // ensure text doesn't push height; allow content to be truncated
     minWidth: 0,
   },
   title: {
     fontSize: 14,
    //  fontFamily: fonts.medium,
   },
   subtitle: {
     fontSize: 14,
     marginTop: 2,
     fontFamily: fonts.regular,
   },
   indicatorWrap: {
     marginLeft: 2,
     alignItems: 'center',
     justifyContent: 'center',
     width: 36,
   },
   box: {
     width: 22,
     height: 22,
     borderRadius: 6,
     borderWidth: 1.5,
     borderColor: '#cbd5e1',
     alignItems: 'center',
     justifyContent: 'center',
   },
   radioSelected: {
     width: 22,
     height: 22,
     borderRadius: 12,
     alignItems: 'center',
     justifyContent: 'center',
   },
    groupLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemsWrapper: {
    // make items flow into columns
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
 });
