/**
 * Decode JWT token and extract user information
 * Note: This does NOT verify the signature - only decodes the payload
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const decodeJWT = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format - expected 3 parts');
      return null;
    }
    
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Get cookie value by name
 */
export const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length);
    }
  }
  
  return null;
};
