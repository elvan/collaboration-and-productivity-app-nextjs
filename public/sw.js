self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: '/notification-icon.png',
    badge: '/notification-badge.png',
    data: data.metadata,
    tag: data.id, // For notification grouping
    renotify: true,
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    // Handle dismiss action
    event.waitUntil(
      fetch('/api/notifications/' + event.notification.data.id + '/dismiss', {
        method: 'POST',
      })
    );
    return;
  }

  // Default action or 'view' action
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // If we have a client, focus it
      if (clientList.length > 0) {
        const client = clientList[0];
        client.focus();
        return client.postMessage({
          type: 'NOTIFICATION_CLICK',
          notification: event.notification.data,
        });
      }
      // Otherwise open a new window
      return clients.openWindow(event.notification.data.url);
    })
  );
});
