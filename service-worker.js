const cacheName = "classRoutineCache-v1.1.0"; // Updated cache version with advanced notifications
const assetsToCache = [
  "index.html",
  "style.css",
  "time.js",
  "task.js",
  "manifest.json",
  "icon-192x192.png",
  "icon-512x512.png",
  "sortable.js",
  "./img/whatsappImage.png",
  "./fontawesome/fontawesome-free-6.7.2-web/css/all.min.css",
  "./fontawesome/fontawesome-free-6.7.2-web/css/fontawesome.min.css",
  "./fontawesome/fontawesome-free-6.7.2-web/webfonts/fa-brands-400.ttf",
  "./fontawesome/fontawesome-free-6.7.2-web/webfonts/fa-brands-400.woff2",
  "./fontawesome/fontawesome-free-6.7.2-web/webfonts/fa-regular-400.ttf",
  "./fontawesome/fontawesome-free-6.7.2-web/webfonts/fa-regular-400.woff2",
  "./fontawesome/fontawesome-free-6.7.2-web/webfonts/fa-solid-900.ttf",
  "./fontawesome/fontawesome-free-6.7.2-web/webfonts/fa-solid-900.woff2",
  "./fontawesome/fontawesome-free-6.7.2-web/webfonts/fa-v4compatibility.ttf",
  "./fontawesome/fontawesome-free-6.7.2-web/webfonts/fa-v4compatibility.woff2",
  "./img/loading.gif",
];

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then(async (cache) => {
      console.log("[Service Worker] Caching assets");
      const results = await Promise.allSettled(
        assetsToCache.map((url) => cache.add(url))
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length) {
        console.warn(
          "[Service Worker] Some assets failed to cache:",
          failed.length
        );
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== cacheName) {
            console.log("[Service Worker] Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Register periodic background sync for task checking
      if (self.registration.periodicSync) {
        return self.registration.periodicSync.register("check-tasks", {
          minInterval: 15 * 60 * 1000, // 15 minutes minimum
        }).catch((err) => {
          console.log("[SW] Periodic sync not available:", err);
        });
      }
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  console.log("[Service Worker] Fetching:", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// ------------------------ Notifications (Background) -----------------------------
// Check tasks and send notifications even when app is closed
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CHECK_TASKS") {
    checkAndNotifyTasks();
  }
});

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-tasks") {
    event.waitUntil(checkAndNotifyTasks());
  }
});

async function checkAndNotifyTasks() {
  try {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // After 4 PM, skip checking
    if (currentTotalMinutes > 960) return;

    const todayKey = new Date().toLocaleString("en-us", { weekday: "short" });

    // Access IndexedDB or use clients.matchAll to read from page
    const allClients = await self.clients.matchAll({ includeUncontrolled: true });
    if (allClients.length > 0) {
      // Ask the page for tasks
      allClients[0].postMessage({ type: "GET_TASKS", todayKey });
    } else {
      // Fallback: read from cache or skip
      console.log("[SW] No active clients to read tasks from");
    }
  } catch (e) {
    console.error("[SW] checkAndNotifyTasks error", e);
  }
}

// Receive tasks from page and send notifications
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TASKS_DATA") {
    const { tasks, todayKey } = event.data;
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const dayTasks = tasks[todayKey] || [];
    dayTasks.forEach((task) => {
      if (task.time && !task.addaBreak) {
        const [taskHour, taskMinute] = task.time.split(":").map(Number);
        const taskTotalMinutes = taskHour * 60 + taskMinute;
        if (taskTotalMinutes <= currentTotalMinutes && !task.notified) {
          const notificationOptions = {
            body: `${task.name} - time reached (${task.time})`,
            icon: "icon-192x192.png",
            badge: "icon-192x192.png",
            vibrate: [200, 100, 200, 100, 200],
            tag: `task-${task.id}`,
            requireInteraction: true, // Stay visible until user acts
            renotify: true, // Vibrate again if same tag
            actions: [
              { action: "done", title: "✓ Mark Done", icon: "icon-192x192.png" },
              { action: "snooze", title: "⏰ Snooze 5min", icon: "icon-192x192.png" },
            ],
            data: { taskId: task.id, todayKey, taskName: task.name },
          };

          // Add priority-based styling
          if (task.priority === "high") {
            notificationOptions.vibrate = [300, 100, 300, 100, 300];
          }

          self.registration.showNotification("Class Routine ⏰", notificationOptions);
          
          // Mark as notified by sending back to page
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ type: "MARK_NOTIFIED", taskId: task.id, todayKey });
          } else {
            // Fallback: broadcast to all clients
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({ type: "MARK_NOTIFIED", taskId: task.id, todayKey });
              });
            });
          }
        }
      }
    });
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);
  event.notification.close();

  // Handle notification actions
  if (event.action === "snooze") {
    // Renotify after 5 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification("Class Routine - Reminder", {
            body: event.notification.body,
            icon: "icon-192x192.png",
            badge: "icon-192x192.png",
            vibrate: [200, 100, 200],
            tag: event.notification.tag + "-snooze",
            requireInteraction: true,
            actions: [
              { action: "done", title: "Mark Done" },
              { action: "snooze", title: "Snooze 5min" },
            ],
          });
          resolve();
        }, 5 * 60 * 1000); // 5 minutes
      })
    );
  } else if (event.action === "done") {
    // Mark task as completed via message to page
    const taskId = event.notification.tag.replace("task-", "").replace("-snooze", "");
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "MARK_COMPLETED", taskId });
        });
      })
    );
  } else {
    // Default: open app
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
    );
  }
});

/* @@Previous Version

const cacheName = "complement-cache-v1";
const assetsToCache = [
  "index.html",
  "manifest.json",
  "icon-192x192.png", // Add your icon files here
  "icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});


*/
