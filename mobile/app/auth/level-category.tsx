import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { assets } from '@/theme';

export default function LevelCategoryScreen() {
  const router = useRouter();
  const { isDark, themeColors } = useTheme();
  const { t } = useLanguage();
  const [level, setLevel] = useState<string | null>(null);

  const topSpacer = Dimensions.get('window').height * 0.12;

  const cards = [
    {
      id: 'newcomer',
      title: t('levelCategory.beginner') || 'Gutangira bushya',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.',
      leftImage: assets.beginnerleft,
      smallIcon: assets.beginnerright,
    },
    {
      id: 'experienced',
      title: t('levelCategory.advanced') || 'Wahuguwe mbere',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.',
      leftImage: assets.advancedleft,
      smallIcon: assets.advancedright,
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1, backgroundColor: isDark ? '#111827' : themeColors.primary }} keyboardShouldPersistTaps="handled">
      <LinearGradient
        colors={isDark ? [themeColors.primary, '#1e1b4b'] : [themeColors.primary, themeColors.primary]}
        style={{ height: 220, justifyContent: 'flex-end', paddingTop: topSpacer, paddingHorizontal: 20, paddingBottom: 28 }}
      >
        <Text style={{ fontSize: 28, color: 'white', fontFamily: 'Inter-Bold', marginBottom: 8, textAlign: 'center', alignSelf: 'center' }}>{t('levelCategory.title') || 'Ikigero cy\'ubumenyi'}</Text>
      </LinearGradient>

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36 }}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            onPress={() => {
              setLevel(card.id);
              router.push('/auth/study-plan');
            }}
            activeOpacity={0.9}
            style={[styles.cardOuter, { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: level === card.id ? themeColors.primary : 'transparent' }]}
          >
            {/* New card internal layout: title row + bottom row */}
            <View style={[styles.cardInner, { backgroundColor: isDark ? '#111827' : '#fff' }]}> 
              <View style={styles.titleRow}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : themeColors.primary }]}>{card.title}</Text>
                </View>
                <Image source={card.smallIcon} style={[styles.smallIconInline]} resizeMode="contain" />
              </View>

              <View style={styles.bottomRow}>
                <Image source={card.leftImage} style={styles.leftImage} resizeMode="cover" />
                <Text style={[styles.cardDescription, { color: isDark ? '#9ca3af' : themeColors.primary70 }]} numberOfLines={4}>{card.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Cards are clickable and navigate directly; continue button removed */}
       </View>
     </ScrollView>
   );
 }

 const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 22,
    padding: 2,
    marginBottom: 18,
    borderWidth: 2,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInner: {
    padding: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftImage: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#e6eefc',
    marginRight: 12,
  },
  smallIcon: {
    width: 34,
    height: 34,
  },
  smallIconInline: {
    width: 34,
    height: 34,
    marginLeft: 8,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 0,
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
});
