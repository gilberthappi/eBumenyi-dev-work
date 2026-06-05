/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-messaging-compat.js');

// Hardcoded web config (public values)
const firebaseConfig = {
  apiKey: "AIzaSyBH9ZPxmj6lxZEnoOHhVpihQIgiFBJoP_U",
  authDomain: "ebumenyi.firebaseapp.com",
  projectId: "ebumenyi",
  storageBucket: "ebumenyi.firebasestorage.app",
  messagingSenderId: "371691500641",
  appId: "1:371691500641:web:f52d597897b8bdd1be2620",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Ukwibutsa';
  const notificationBody = payload.notification?.body || payload.data?.body || '';
  const type = payload.data?.type || '';

  const showNotification = () => {
    const notificationOptions = {
      body: notificationBody,
      icon: '/chw.png',
      badge: '/chw.png',
      tag: payload.data?.entityId || 'notification',
      // renotify intentionally omitted: same-tag notifications silently replace
      // instead of re-alerting, preventing a duplicate popup on each reminder.
      requireInteraction: type === 'calendar_reminder',
      vibrate: [200, 100, 200],
      data: payload.data || {},
      actions: type === 'calendar_reminder' ? [
        { action: 'view', title: 'View Event' },
        { action: 'dismiss', title: 'Dismiss' }
      ] : [],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  };

  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if (
        (client.url.includes('localhost') || client.url.includes('ebumenyi.online')) &&
        client.focused === true
      ) {
        // Tab is open and focused — socket handles this, skip OS notification
        return;
      }
    }
    // Tab is closed or hidden — show OS notification
    return showNotification();
  });
});

// Map notification deep link to web dashboard route
function resolveWebRoute(deepLink, origin) {
  if (!deepLink) return origin + '/dashboard';
  
  // Parse format: /resource/id
  const match = deepLink.match(/^\/([a-z_]+)\/(.+?)(?:\?|$)/i);
  if (!match) return origin + '/dashboard';
  
  const [, resourceType, resourceId] = match;
  
  switch (resourceType.toLowerCase()) {
    case 'chat':
    case 'conversation':
      return origin + '/dashboard/messaging?chatId=' + resourceId + '&type=direct';
    case 'group':
      return origin + '/dashboard/messaging?chatId=' + resourceId + '&type=group';
    case 'community':
      return origin + '/dashboard/messaging?communityId=' + resourceId + '&type=community';
    case 'course':
      return origin + '/dashboard/courses/' + resourceId;
    case 'calendar':
    case 'event':
      return origin + '/dashboard/calendar?eventId=' + resourceId;
    case 'calendar_reminder':
      return origin + '/dashboard/calendar?eventId=' + resourceId;
    case 'announcement':
      return origin + '/dashboard/announcements/' + resourceId;
    default:
      return origin + '/dashboard';
  }
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const data = event.notification?.data || {};
  const deepLink = data.deepLink || data.actionUrl || data.link || '';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find any open app tab (works on both localhost and production)
      const appClient = clientList.find((client) =>
        client.url.includes('localhost') ||
        client.url.includes('ebumenyi.online')
      );
      
      // Resolve the target URL using the open tab's origin (localhost or production)
      const origin = appClient
        ? new URL(appClient.url).origin
        : 'https://www.ebumenyi.online';
      
      const url = resolveWebRoute(deepLink, origin);
      
      if (appClient && 'focus' in appClient) {
        appClient.focus();
        if ('navigate' in appClient) {
          appClient.navigate(url);
        }
        return;
      }
      
      // No tab open — open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});