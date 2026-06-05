import { useRouter } from 'expo-router';
import { isValidMeetingUrl, extractMeetingId } from '@/utils/deepLinking';

/**
 * Custom router hook that intercepts meeting URLs
 * and routes them to the in-app meeting screen instead of opening in browser
 */
export function useMeetingRouter() {
  const router = useRouter();

  const push = (url: string | any) => {
    // If it's a string URL and it's a meeting URL
    if (typeof url === 'string' && isValidMeetingUrl(url)) {
      const meetingId = extractMeetingId(url);
      if (meetingId) {
        // Route to in-app meeting screen instead
        return router.push(`/meeting/${meetingId}`);
      }
    }
    
    // Otherwise, use normal router.push
    return router.push(url);
  };

  return {
    ...router,
    push,
  };
}
