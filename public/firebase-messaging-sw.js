importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.FIREBASE_CONFIG.apiKey,
  authDomain: self.FIREBASE_CONFIG.authDomain,
  projectId: self.FIREBASE_CONFIG.projectId,
  storageBucket: self.FIREBASE_CONFIG.storageBucket,
  messagingSenderId: self.FIREBASE_CONFIG.messagingSenderId,
  appId: self.FIREBASE_CONFIG.appId,
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.id || 'default',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const data = notification.data;
  notification.close();

  if (data?.url) {
    // Open the URL in a new window/tab
    event.waitUntil(clients.openWindow(data.url));
  } else {
    // Open the main app
    event.waitUntil(clients.openWindow('/notifications'));
  }
});
