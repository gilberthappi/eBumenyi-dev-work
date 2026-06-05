import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        
        if (token) {
          // User has a token, redirect to home
          router.replace('/');
        } else {
          // No token, redirect to login
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, redirect to login to be safe
        router.replace('/auth/login');
      }
    };

    checkAuthAndNavigate();
  }, [router]);

  return null;
}
