import * as React from 'react';

import { View, Text, StyleSheet, Image } from 'react-native';

const NoNetwork = () => {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/EmptyState.png')} style={styles.image} />
      <Text style={styles.message}>No Network Connection</Text>
      <Text style={styles.subMessage}>Please check your internet connection and try again.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  message: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default NoNetwork;
