// sw.js - Service Worker for push notifications

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activated');
  return self.clients.claim();
});

// Listen to push event
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || 'ZeroPay Notification';
  const options = {
    body: data.body || 'You have a new update!',
    icon: data.icon || '/icons/notification-icon.png',
    badge: data.badge || '/icons/notification-badge.png',
    image: data.image || '',   // for video thumbnail or image
    data: {
      url: data.url || '/',   // link to open when clicked
      id: data.id || Date.now()
    },
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click on notification
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there's already a window/tab open
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Optional: pushsubscriptionchange (handle expired subscription)
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker] Push Subscription change event');
  // Here you can resubscribe automatically if needed
});
