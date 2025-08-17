// Service Worker for TranslateEvent PWA
const CACHE_NAME = "translateevent-v1"
const STATIC_CACHE = "translateevent-static-v1"
const DYNAMIC_CACHE = "translateevent-dynamic-v1"

// Files to cache immediately
const STATIC_FILES = ["/", "/translator", "/manifest.json", "/icon-192.png", "/icon-512.png"]

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker")

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static files")
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log("[SW] Static files cached successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[SW] Error caching static files:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Service worker activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests differently
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for offline access
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request)
        }),
    )
    return
  }

  // Handle static files and pages
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("[SW] Serving from cache:", request.url)
        return cachedResponse
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response.ok) {
            return response
          }

          // Clone response for caching
          const responseClone = response.clone()

          // Cache the response
          caches.open(DYNAMIC_CACHE).then((cache) => {
            console.log("[SW] Caching new resource:", request.url)
            cache.put(request, responseClone)
          })

          return response
        })
        .catch((error) => {
          console.error("[SW] Fetch failed:", error)

          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/")
          }

          throw error
        })
    }),
  )
})

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag)

  if (event.tag === "sync-notes") {
    event.waitUntil(syncNotes())
  }

  if (event.tag === "sync-poll-responses") {
    event.waitUntil(syncPollResponses())
  }
})

// Sync notes when back online
async function syncNotes() {
  try {
    const notes = await getOfflineNotes()

    for (const note of notes) {
      await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(note),
      })
    }

    await clearOfflineNotes()
    console.log("[SW] Notes synced successfully")
  } catch (error) {
    console.error("[SW] Error syncing notes:", error)
  }
}

// Sync poll responses when back online
async function syncPollResponses() {
  try {
    const responses = await getOfflinePollResponses()

    for (const response of responses) {
      await fetch("/api/polls/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(response),
      })
    }

    await clearOfflinePollResponses()
    console.log("[SW] Poll responses synced successfully")
  } catch (error) {
    console.error("[SW] Error syncing poll responses:", error)
  }
}

// Helper functions for offline data management
async function getOfflineNotes() {
  // Implementation would use IndexedDB
  return []
}

async function clearOfflineNotes() {
  // Implementation would clear IndexedDB
}

async function getOfflinePollResponses() {
  // Implementation would use IndexedDB
  return []
}

async function clearOfflinePollResponses() {
  // Implementation would clear IndexedDB
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  const options = {
    body: "Nova enquete disponível no evento!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      url: "/",
    },
    actions: [
      {
        action: "open",
        title: "Abrir Evento",
      },
      {
        action: "close",
        title: "Fechar",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("TranslateEvent", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked")

  event.notification.close()

  if (event.action === "open") {
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"))
  }
})
