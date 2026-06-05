import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsCardProps {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  number: number;
  title: string;
  backgroundColor: string;
}

export default function StatsCard({ Icon, number, title, backgroundColor }: StatsCardProps) {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.cardHeader}>
        <Icon size={18} color="rgba(255, 255, 255, 0.8)" />
        <Text style={styles.number}>{number}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 70,
    borderRadius: 12,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  number: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  title: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
    width: '100%',
  },
});
