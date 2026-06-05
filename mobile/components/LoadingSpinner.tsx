import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function LoadingSpinner({ message = 'Tegereza...' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});