import React from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import { assets } from '@/theme';

const SAMPLE = [
  { id: '1', name: 'Sonia GATETE', photo: assets.umujyanama2, last: 'Where are we meeting?', time: '2:33 PM' },
  { id: '2', name: 'RURANGWA Abdulkareem', photo: assets.umujyanama1, last: 'Thanks for the update', time: 'Yesterday' },
  { id: '3', name: 'DR. NIGAMYE Olivier', photo: assets.umujyanama3, last: 'Please read the attached', time: '3d' },
];

export default function CommunityMessages() {
  return (
    <View style={styles.wrapper}>
      <FlatList
        data={SAMPLE}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} accessibilityRole="button">
            <Image source={item.photo} style={styles.avatar} />
            <View style={styles.content}>
              <View style={styles.headerRow}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text numberOfLines={1} style={styles.last}>{item.last}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    color: '#0f172a',
  },
  time: {
    color: '#64748b',
    fontSize: 12,
  },
  last: {
    color: '#475569',
    fontSize: 13,
    marginTop: 2,
  },
});
