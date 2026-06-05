import React, { useEffect } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, assets } from '@/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const didNavigate = React.useRef(false);

  const themeColors = isDark ? colors.dark : colors.light;

  useFocusEffect(
    React.useCallback(() => {
      let timeoutId: NodeJS.Timeout;
      didNavigate.current = false;
      const checkAuthStatus = async () => {
        try {
          const token = await AsyncStorage.getItem('accessToken');
          timeoutId = setTimeout(() => {
            if (!didNavigate.current) {
              didNavigate.current = true;
              if (token) {
                router.push('/auth/splash-auth');
              } else {
                router.push('/auth/login');
              }
            }
          }, 4000);
        } catch (error) {
          console.log(error)
          timeoutId = setTimeout(() => {
            if (!didNavigate.current) {
              didNavigate.current = true;
              router.push('/auth/login');
            }
          }, 4000);
        }
      };
      checkAuthStatus();
      return () => {
        clearTimeout(timeoutId);
        didNavigate.current = true;
      };
    }, [router])
  );

  useEffect(() => {
    const onBackPress = () => {
      BackHandler.exitApp();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);
  // responsive sizes
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width - 40, 760);
  const rbcLogoSize = Math.min(220, Math.round(width * 0.38));
  const iconBoxSize = Math.round(Math.max(56, width * 0.12));
  const iconSize = Math.round(iconBoxSize * 0.9);

  const paddingTop = Math.max(12, Math.round(height * 0.03));

  const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1, paddingTop },
    header: { flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 100 },
    seal: { width: rbcLogoSize, height: rbcLogoSize, marginTop: 0, marginBottom: Math.round(height * 0.01) },
    partnerFooter: { 
      width: '100%', 
      position: 'absolute', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      alignItems: 'center', 
      backgroundColor: 'transparent', 
      paddingBottom: insets.bottom + 2
    },
    partner: { width: '100%', height: 60, marginTop: 0, marginBottom: 0, resizeMode: 'contain' },
    ministry1: { fontSize: Math.round(Math.max(14, width * 0.035)), color: '#fff', marginTop: 8 },
    ministry2: { fontSize: Math.round(Math.max(12, width * 0.035)), color: '#fff', marginTop: 4 },
    ministryDivider: { width: Math.round(Math.max(40, width * 0.48)), height: 1, marginVertical: 2, borderRadius: 1 },
    cardsWrapper: { flex: 1, width: '100%', marginTop: Math.round(height * 0.01), alignItems: 'center', justifyContent: 'center', paddingBottom: Math.round(height * 0.05) },
    card: { width: cardWidth, flexDirection: 'row', alignItems: 'center', padding: Math.round(Math.max(14, width * 0.04)), borderRadius: 18, marginBottom: Math.round(Math.max(12, height * 0.02)), shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
    iconBox: { width: iconBoxSize, height: iconBoxSize, borderRadius: Math.min(16, Math.round(iconBoxSize / 4)), alignItems: 'center', justifyContent: 'center', marginRight: Math.round(Math.max(10, width * 0.03)) },
    icon: { width: iconSize, height: iconSize },
    cardTextWrap: { flex: 1 },
    cardTitle: { fontSize: Math.round(Math.max(16, width * 0.045)), marginBottom: 6 },
    cardSubtitle: { fontSize: Math.round(Math.max(12, width * 0.03)), lineHeight: Math.round(Math.max(16, width * 0.05)) },
  });

  return (
    <LinearGradient colors={[themeColors.primary, themeColors.primary] as const} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={styles.header}>
            <Image source={assets.rbc} style={styles.seal} resizeMode="contain" />
          </View>
        </View>
        <View style={styles.partnerFooter}>
          <Image source={assets.partner} style={styles.partner} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}