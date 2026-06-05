import { View, Text, TextInput, ScrollView } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '@/components/Button';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { isDark, themeColors } = useTheme();
  const { t } = useLanguage();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<any[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      try {

          router.push('/auth/change-password');
      } catch (err) {
        console.log('OTP flow error', err);
        router.push('/auth/login');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} style={{ flex: 1, backgroundColor: isDark ? '#111827' : themeColors.primary }} keyboardShouldPersistTaps="handled">
      <LinearGradient
        colors={isDark ? [themeColors.primary, '#1e1b4b'] : [themeColors.primary, themeColors.primary]}
        style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ fontSize: 20, color: 'white', fontFamily: 'Inter-Bold', marginBottom: 12, textAlign: 'center' }}>{t('otp.title')}</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 }}>{t('otp.subtitle')}</Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref ?? undefined; }}
              style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 2, fontSize: 18, textAlign: 'center', backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: digit ? themeColors.primary : (isDark ? '#374151' : '#d1d5db'), color: isDark ? '#ffffff' : '#111827', fontFamily: 'Inter-SemiBold' }}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              maxLength={1}
              keyboardType="numeric"
              textAlign="center"
            />
          ))}
        </View>

        <Button
          title={t('button.verify')}
          onPress={handleVerify}
          variant="secondary"
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 20 }}>
          <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#d1d5db', fontFamily: 'Inter-Regular' }}>{t('emailVerification.verifySubtitle')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
