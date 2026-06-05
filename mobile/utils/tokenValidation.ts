import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkValiditOfToken } from '@/services/auth';

export interface TokenValidationResult {
  isValid: boolean;
  shouldRedirect: boolean;
  redirectTo: string;
}

/**
 * Validates the current user token and determines the appropriate navigation action
 * @returns Promise<TokenValidationResult>
 */
export const validateUserToken = async (): Promise<TokenValidationResult> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      return {
        isValid: false,
        shouldRedirect: true,
        redirectTo: '/auth/login'
      };
    }

    try {
      const validationResult = await checkValiditOfToken();
      
      if (validationResult?.valid === true) {
        return {
          isValid: true,
          shouldRedirect: false,
          redirectTo: ''
        };
      } else {
        // Token is invalid, clean up storage
        // await AsyncStorage.removeItem('accessToken');
        // await AsyncStorage.removeItem('userData');
        // await AsyncStorage.removeItem('role');
        
        return {
          isValid: false,
          shouldRedirect: true,
          redirectTo: '/auth/login'
        };
      }
    } catch (validationError) {
      // Token validation failed, clean up storage
      console.log('Token validation failed:', validationError);
      // await AsyncStorage.removeItem('accessToken');
      // await AsyncStorage.removeItem('userData');
      // await AsyncStorage.removeItem('role');
      
      return {
        isValid: false,
        shouldRedirect: true,
        redirectTo: '/auth/login'
      };
    }
  } catch (err) {
    console.log('Error during token validation:', err);
    return {
      isValid: false,
      shouldRedirect: true,
      redirectTo: '/auth/login'
    };
  }
};

/**
 * Validates token and navigates to home or login accordingly
 * @param router - The router instance from useRouter()
 * @param onSuccess - Optional callback when token is valid
 * @param onFailure - Optional callback when token is invalid
 */
export const validateAndNavigate = async (
  router: any,
  onSuccess?: () => void,
  onFailure?: () => void
): Promise<void> => {
  const result = await validateUserToken();
  
  if (result.isValid) {
    router.push('/(tabs)');
    onSuccess?.();
  } else if (result.shouldRedirect) {
    router.push(result.redirectTo);
    onFailure?.();
  }
};
