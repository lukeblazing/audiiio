const CACHE_NAME = "app-cache-v1";
const urlsToCache = ["/", "/index.html", "/main.js"];

// Install event – Cache assets and force the waiting worker to become active
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((error) => console.error("Failed to cache assets during install:", error))
  );
});

// Fetch event – Serve cached assets for GET requests
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch((error) => {
        console.error("Fetch error:", error);
        return fetch(event.request);
      })
  );
});

// Activate event – Cleanup old caches and take control of clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
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
    badge: data.badge || "/badge.png",   // Update with your badge path
    data: { url: data.url || "/" }       // URL to open on notification click
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
