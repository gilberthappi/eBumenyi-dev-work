import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast, { BaseToastProps } from 'react-native-toast-message';

export const toastConfig = {
  success: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.shadow]}>
      <LinearGradient colors={['#34D399', '#10B981']} style={styles.gradient}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <CheckCircle color="white" size={22} />
          </View>
          <View style={styles.content}>
            <Text numberOfLines={2} style={styles.title}>
              {text1}
            </Text>
            {text2 ? (
              <Text numberOfLines={3} style={styles.subtitle}>
                {text2}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity 
            onPress={() => Toast.hide()} 
            style={styles.closeBtn}
          >
            <XCircle color="rgba(255,255,255,0.9)" size={18} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  ),
  
  error: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.shadow]}>
      <LinearGradient colors={['#F87171', '#EF4444']} style={styles.gradient}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Info color="white" size={22} />
          </View>
          <View style={styles.content}>
            <Text numberOfLines={2} style={styles.title}>
              {text1}
            </Text>
            {text2 ? (
              <Text numberOfLines={3} style={styles.subtitle}>
                {text2}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity 
            onPress={() => Toast.hide()} 
            style={styles.closeBtn}
          >
            <XCircle color="rgba(255,255,255,0.9)" size={18} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  ),
  
  info: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.shadow]}>
      <LinearGradient colors={['#60A5FA', '#3B82F6']} style={styles.gradient}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Info color="white" size={22} />
          </View>
          <View style={styles.content}>
            <Text numberOfLines={2} style={styles.title}>
              {text1}
            </Text>
            {text2 ? (
              <Text numberOfLines={3} style={styles.subtitle}>
                {text2}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity 
            onPress={() => Toast.hide()} 
            style={styles.closeBtn}
          >
            <XCircle color="rgba(255,255,255,0.9)" size={18} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center', // Center toast horizontally
    width: '90%', // Responsive width
    maxWidth: 400, // Prevent excessive width on tablets
    marginHorizontal: 0,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 80, // Increased minimum height
  },
  gradient: {
    padding: 16,
    borderRadius: 12,
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16, // Increased font size
    marginBottom: 2,
    flexWrap: 'wrap', // Ensure wrapping
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14, // Increased font size
    fontWeight: '500',
    flexWrap: 'wrap', // Ensure wrapping
  },
  closeBtn: {
    marginLeft: 12,
    padding: 4,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});