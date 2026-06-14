self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Blood Connector', body: event.data.text(), url: '/' };
  }

  const options = {
    body: payload.body || '',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: payload.tag || 'blood-connector',
    data: { url: payload.url || '/' },
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'Blood Connector', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
