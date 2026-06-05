import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, fonts, assets } from '@/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkValiditOfToken } from '@/services/auth';
import { getWeltelLoginUrl } from '@/services/weltel.api';

export default function SplashScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [etrainingPressed, setEtrainingPressed] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isWeltelLoading, setIsWeltelLoading] = useState(false);

  const themeColors = isDark ? colors.dark : colors.light;


  const cards = [
    {
      key: 'cemr',
      title: t('splash.cemr.title') || 'cEMR',
      subtitle: t('splash.cemr.subtitle') || 'Primary aid and patient basic diagnosis.',
      icon: assets.cEMR,
    },
    {
      key: 'etraining',
      title: t('splash.etraining.title') || 'CHW',
      subtitle: t('splash.etraining.subtitle') || 'Access all content for Community Health Workers.',
      icon: assets.etrainingIcon,
    },
    {
      key: 'weltel',
      title: t('splash.weltel.title') || 'WelTel',
      subtitle: t('splash.weltel.subtitle') || 'Communication channel to engage CHWs, supervisors and trainers.',
      icon: assets.weltelIcon,
    },
  ];

  // responsive sizes
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width - 40, 760);
  const logoSize = Math.min(140, Math.round(width * 0.22));
  const iconBoxSize = Math.round(Math.max(56, width * 0.12));
  const iconSize = Math.round(iconBoxSize * 0.9);

  const paddingTop = Math.max(insets.top + 12, Math.round(height * 0.03));

  const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1, alignItems: 'center', paddingHorizontal: Math.max(16, width * 0.04), paddingTop },
    header: { alignItems: 'center', justifyContent: 'center', marginBottom: Math.round(height * 0.035) },
    seal: { width: logoSize, height: logoSize, marginTop: 0, marginBottom: Math.round(height * 0.01) },
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

  const handlePress = async (key: string) => {
    try {
      if (key === 'etraining') {
        setIsValidating(true);
        const token = await AsyncStorage.getItem('accessToken');
        console.log("token:", token)
        
        if (token) {
          // Validate token before allowing navigation
          try {
            const validationResult = await checkValiditOfToken();
            if (validationResult?.valid === true) {
              // Token is valid, proceed to home
              router.push('/(tabs)');
            } else {
              // Token is invalid, remove it and go to login
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('userData');
              await AsyncStorage.removeItem('role');
              router.push('/auth/login');
            }
          } catch (validationError) {
            // Token validation failed, remove token and go to login
            console.log('Token validation failed:', validationError);
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('role');
            router.push('/auth/login');
          }
        } else {
          // No token -> go to login
          router.push('/auth/login');
        }
        setIsValidating(false);
        return;
      }

      if (key === 'weltel') {
        setIsWeltelLoading(true);
        const token = await AsyncStorage.getItem('accessToken');

        if (!token) {
          setIsWeltelLoading(false);
          router.push('/auth/login');
          return;
        }

        try {
          const validationResult = await checkValiditOfToken();
          if (validationResult?.valid !== true) {
            await AsyncStorage.multiRemove(['accessToken', 'userData', 'role']);
            setIsWeltelLoading(false);
            router.push('/auth/login');
            return;
          }

          const weltelAuth = await getWeltelLoginUrl();
          setIsWeltelLoading(false);
          router.push({
            pathname: '/weltel',
            params: {
              loginUrl: weltelAuth.loginUrl,
              jwtKey: weltelAuth.jwtKey,
            },
          });
        } catch (weltelError) {
          console.log('WelTel login URL failed:', weltelError);
          setIsWeltelLoading(false);
          router.push('/auth/login');
        }
        return;
      }

      // default behavior: navigate to app home
      router.push('/auth/login');
    } catch (err) {
      console.log('Error handling card press', err);
      setIsValidating(false);
      setIsWeltelLoading(false);
      router.push('/auth/login');
    }
  };

  return (
    <LinearGradient colors={[themeColors.primary, themeColors.primary] as const} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Image source={assets.rwanda} style={styles.seal} resizeMode="contain" />
          <Text style={[styles.ministry1, { fontFamily: fonts.medium }]}>{t('splash.ministryLine1')}</Text>
          <View style={[styles.ministryDivider, { backgroundColor: isDark ? '#fff' : '#fff' }]} />
          <Text style={[styles.ministry2, { fontFamily: fonts.regular }]}>{t('splash.ministryLine2')}</Text>
        </View>

        <View style={styles.cardsWrapper}>
          {cards.map((c) => {
            const containerStyle = [styles.card, { backgroundColor: themeColors.cardBg, shadowColor: themeColors.cardShadow ? themeColors.cardShadow : '#000' }];
            const iconBoxStyle = [styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)' }];

            if (c.key === 'etraining') {
              return (
                <TouchableOpacity
                  key={c.key}
                  activeOpacity={0.85}
                  onPress={() => handlePress(c.key)}
                  onPressIn={() => setEtrainingPressed(true)}
                  onPressOut={() => setEtrainingPressed(false)}
                  style={[containerStyle, isValidating && { opacity: 0.6 }]}
                  disabled={isValidating}
                >
                  <View style={iconBoxStyle}>
                    <Image
                      source={c.icon}
                      style={[
                        styles.icon,
                        { width: Math.round(iconSize * 1.8), height: Math.round(iconSize * 1.3) },
                        // apply tint when pressed (works for template/monochrome assets)
                        etrainingPressed ? { tintColor: themeColors.primary } : undefined,
                      ]}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.cardTextWrap}>
                    <Text style={[styles.cardTitle, { color: themeColors.cardText, fontFamily: fonts.bold }]}>{c.title}</Text>
                    <Text style={[styles.cardSubtitle, { color: themeColors.cardSubtitle, fontFamily: fonts.regular }]} numberOfLines={3}>
                      {isValidating ? 'Gusuzuma uburenganzira...' : c.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            const isWeltelCard = c.key === 'weltel';
            const cardBusy = isWeltelCard && isWeltelLoading;

            return (
              <TouchableOpacity
                key={c.key}
                activeOpacity={0.85}
                onPress={() => handlePress(c.key)}
                style={[containerStyle, cardBusy && { opacity: 0.6 }]}
                disabled={cardBusy}
              >
                <View style={iconBoxStyle}>
                  <Image source={c.icon} style={styles.icon} resizeMode="contain" />
                </View>

                <View style={styles.cardTextWrap}>
                  <Text style={[styles.cardTitle, { color: themeColors.cardText, fontFamily: fonts.bold }]}>{c.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: themeColors.cardSubtitle, fontFamily: fonts.regular }]} numberOfLines={3}>
                    {cardBusy ? (t('splash.weltel.loading') || 'Opening WelTel...') : c.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
