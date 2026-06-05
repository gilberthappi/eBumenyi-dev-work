import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../utils/i18n';
import { GlobalReminderService } from '@/services/calender';

type Language = 'en' | 'rw' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: Record<string, any>) => string;
}
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});
export const useLanguage = () => useContext(LanguageContext);
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('rw');
  useEffect(() => {
    loadLanguage();
  }, []);
  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('st_lang');
      if (savedLanguage) {
        const lang = savedLanguage as Language;
        setLanguageState(lang);
        i18n.changeLanguage(lang);

        // Initialize global reminder service with loaded language
        const localeMap: Record<string, string> = {
          en: 'en-US',
          rw: 'rw-RW',
          fr: 'fr-FR',
        };
        GlobalReminderService.updateLanguage(lang, localeMap[lang] || 'en-US');
      } else {
        // Initialize with default language
        GlobalReminderService.updateLanguage('en', 'en-US');
      }
    } catch (error) {
      console.log('Error loading language:', error);
      GlobalReminderService.updateLanguage('en', 'en-US');
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem('st_lang', newLanguage);
      setLanguageState(newLanguage);
      i18n.changeLanguage(newLanguage);

      // Update global reminder service with new language
      const localeMap: Record<string, string> = {
        en: 'en-US',
        rw: 'rw-RW',
        fr: 'fr-FR',
      };
      GlobalReminderService.updateLanguage(newLanguage, localeMap[newLanguage] || 'en-US');
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };
  const t = (key: string, options?: Record<string, any>) => i18n.t(key, options);
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
