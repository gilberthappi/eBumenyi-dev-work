import React from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import { assets } from '@/theme';

const SAMPLE = [
  { id: '1', name: 'MUVUNYI Patrick', photo: assets.umujyanama1 },
  { id: '2', name: 'HABINEZA Jean Nepo', photo: assets.umujyanama2 },
  { id: '3', name: 'RUTARINDWA Emmanuel', photo: assets.umujyanama3 },
  { id: '4', name: 'UMUTONI UWAse', photo: assets.umujyanama1 },
];

export default function CommunityMembers() {
  return (
    <View style={styles.wrapper}>
      <FlatList
        data={SAMPLE}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 8, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.member} accessibilityRole="button">
            <Image source={item.photo} style={styles.avatar} />
            <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 8,
  },
  member: {
    alignItems: 'center',
    width: 80,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
  name: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});
