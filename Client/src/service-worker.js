// Install event – Activate the service worker immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    self.skipWaiting()
      .catch((error) => console.error("Service worker install error:", error))
  );
});

// Fetch event – Always fetch from network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }

  // Directly fetch from the network without caching
  event.respondWith(
    fetch(event.request)
      .catch((error) => {
        console.error("Fetch error:", error);
        return fetch(event.request);
      })
  );
});

// Activate event – Take control of clients immediately and clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim()
      .catch((error) => console.error("Activation error:", error))
  );
});

// Listen for push events and display notifications
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }
  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new message!",
    icon: data.icon || "/icon.png",    // Update with your icon path
    badge: data.badge || "/badge.png", // Update with your badge path
    data: { url: data.url || "/" }     // URL to open on notification click
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click events
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data.url && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});
