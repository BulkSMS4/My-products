// Simple service worker to enable showNotification and respond to clicks
self.addEventListener('install', function(event){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({type:'window'}).then(windowClients=>{
      for (let i=0;i<windowClients.length;i++){
        const client = windowClients[i];
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('push', function(event){
  let data = {};
  try { data = event.data.json(); } catch(e) { data = { title: 'Update', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Notification';
  const options = { body: data.body || '', icon: data.icon || '', image: data.image || '', data: { url: data.url || '/' } };
  event.waitUntil(self.registration.showNotification(title, options));
});
