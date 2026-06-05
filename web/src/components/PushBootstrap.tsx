import { useEffect } from "react";
import toast from "react-hot-toast";
import usePushNotifications from "@/hooks/usePushNotifications.tsx";

const PushBootstrap = () => {
  usePushNotifications();

  useEffect(() => {
    const handleForegroundPush = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { title, body } = customEvent.detail;

      // Show toast notification
      toast(title, { 
        description: body,
        duration: 5000,
      });

      // Optional: Auto-navigate for high-priority types like calendar reminders
      // Uncomment if you want automatic navigation:
      // if (deepLink && deepLink.includes('calendar_reminder')) {
      //   const match = deepLink.match(/^\/([a-z_]+)\/(.+?)(?:\?|$)/i);
      //   if (match) {
      //     const [, resourceType, resourceId] = match;
      //     navigate(`/dashboard/calendar?eventId=${resourceId}`);
      //   }
      // }
    };

    window.addEventListener('fcm:foreground', handleForegroundPush);
    return () => window.removeEventListener('fcm:foreground', handleForegroundPush);
  }, []);

  return null;
};

export default PushBootstrap;
