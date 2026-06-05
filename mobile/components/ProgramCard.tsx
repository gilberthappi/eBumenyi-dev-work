import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';

type ProgramData = {
  id?: string;
  title?: string;
  startedOn?: string;
  chapter?: number | string;
  time?: string;
  icon?: any;
  backgroundColor?: string;
  small?: boolean;
};

type Props = {
  data: ProgramData;
  onPress?: () => void;
};

export default function ProgramCard({ data, onPress }: Props) {
  const {
    title,
    startedOn,
    chapter,
    time,
    icon = '📚',
    backgroundColor = '#4D81D2',
    small = false,
  } = data || {};

  // Small compact card (used for the second small tile)
  if (small) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.smallCard, { backgroundColor }]}> 
        {typeof icon === 'string'
          ? <Image source={{ uri: icon }} style={styles.smallImage} />
          : typeof icon === 'number' || (typeof icon === 'object' && icon !== null)
            ? <Image source={icon as ImageSourcePropType} style={styles.smallImage} />
            : <Text style={styles.smallIcon}>{icon}</Text>
        }
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={[styles.card, { backgroundColor }]}> 
      <View style={styles.innerRow}>
        <View style={styles.imageWrapper}>
          {icon ? (
                              <Image source={{ uri: icon }} style={styles.image} />
                            ) : (
                              <Text style={styles.imageEmoji}>📘</Text>
                            )}
        </View>

        <View style={styles.info}>
          {title ? <Text style={styles.title} numberOfLines={3}>{title}</Text> : null}
          {startedOn ? (
            <Text style={styles.meta} numberOfLines={1}>byatangiye: <Text style={styles.metaValue}>{startedOn}</Text></Text>
          ) : null}
          {chapter !== undefined ? (
            <Text style={styles.meta} numberOfLines={1}>Igika: <Text style={styles.metaValue}>ugeze ku gika {chapter}</Text></Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    borderRadius: 16,
    padding: 14,
    minHeight: 120,
    elevation: 3,
    marginBottom: 8,
    marginRight: 12,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imageEmoji: {
    fontSize: 36,
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  meta: {
    color: '#e0e7ff',
    fontSize: 10,
  },
  metaValue: {
    fontWeight: '600',
    color: '#fff',
  },
  metaSeparator: {
    color: '#e0e7ff',
    fontSize: 12,
    marginHorizontal: 4,
  },
  time: {
    color: '#e0e7ff',
    fontSize: 10,
    marginTop: 4,
  },
  smallCard: {
    width: 88,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    elevation: 2,
    marginRight: 12,
  },
  smallImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  smallIcon: {
    fontSize: 24,
    color: '#fff',
  },
});
