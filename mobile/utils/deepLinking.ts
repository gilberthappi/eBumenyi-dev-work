import * as Linking from 'expo-linking';

/**
 * Check if a URL is a valid meeting URL
 * Format: https://meeting.ebumenyi.online/meeting/{meetingId}
 */
export const isValidMeetingUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'meeting.ebumenyi.online' &&
      parsed.pathname.match(/^\/meeting\/[a-z0-9\-]+$/) !== null
    );
  } catch {
    return false;
  }
};

/**
 * Extract meeting ID from URL
 */
export const extractMeetingId = (url: string): string | null => {
  try {
    const match = url.match(/\/meeting\/([a-z0-9\-]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

/**
 * Parse deep link and route accordingly
 * Returns { route: string, params: object } or null if not a valid app link
 */
export const parseLinkingURL = (url: string | null) => {
  if (!url) return null;

  try {
    // Remove any leading/trailing whitespace
    url = url.trim();

    // Check if it's a meeting URL
    if (isValidMeetingUrl(url)) {
      const meetingId = extractMeetingId(url);
      if (meetingId) {
        return {
          route: 'meeting',
          params: {
            meetingId,
            fullUrl: url,
          },
        };
      }
    }

    // For other URLs, parse them normally
    const parsed = Linking.parse(url);
    return parsed;
  } catch (error) {
    console.log('Error parsing URL:', url, error);
    return null;
  }
};

/**
 * Create a meeting deep link
 */
export const createMeetingLink = (meetingId: string): string => {
  return `https://meeting.ebumenyi.online/meeting/${meetingId}`;
};

/**
 * Check if URL is internal to the app (should stay in app)
 */
export const isInternalUrl = (url: string): boolean => {
  const internalDomains = [
    'meeting.ebumenyi.online',
    'ebumenyi.online',
  ];

  try {
    const parsed = new URL(url);
    return internalDomains.some(domain => parsed.hostname?.includes(domain));
  } catch {
    return false;
  }
};

/**
 * Handle meeting URL in WebView
 * Returns true if the URL should be handled by the app (not opened externally)
 */
export const shouldHandleUrlInWebView = (url: string): boolean => {
  // Only allow meeting.ebumenyi.online URLs
  const parsed = new URL(url);
  return parsed.hostname === 'meeting.ebumenyi.online';
};
