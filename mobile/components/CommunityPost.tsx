import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react-native';

type Props = {
  author: string;
  avatar: any;
  time?: string;
  text?: string;
  image?: any;
};

export default function CommunityPost({ author, avatar, time = '2h', text = '', image }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Image source={avatar} style={styles.avatar} />
          <View>
            <Text style={styles.author}>{author}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
        </View>
        <TouchableOpacity accessibilityLabel="more">
          <MoreHorizontal size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      {text ? <Text style={styles.text}>{text}</Text> : null}

      {image ? <Image source={image} style={styles.postImage} /> : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} accessibilityRole="button">
          <Heart size={18} color="#ef4444" />
          <Text style={styles.actionText}>12</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} accessibilityRole="button">
          <MessageSquare size={18} color="#475569" />
          <Text style={styles.actionText}>3</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} accessibilityRole="button">
          <Share2 size={18} color="#475569" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#00000008',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  author: {
    fontFamily: 'Inter-SemiBold',
    color: '#0f172a',
  },
  time: {
    color: '#64748b',
    fontSize: 12,
  },
  text: {
    color: '#334155',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#475569',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
});
