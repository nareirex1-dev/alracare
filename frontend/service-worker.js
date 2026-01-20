/**
 * Service Worker for Alracare Clinic PWA
 * Provides offline capability and caching strategies
 */

const CACHE_NAME = 'alracare-v1.0.0';
const RUNTIME_CACHE = 'alracare-runtime';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/public-script-api.js',
  '/admin-script.js',
  '/api-config.js',
  '/styles.css',
  '/manifest.json',
  '/images/Logo.jpg'
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/services'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache-first strategy
 * Try cache first, fallback to network
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function cacheFirstStrategy(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }

    // Fallback to network
    console.log('[Service Worker] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    
    // Return offline page if available
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Return generic error response
    return new Response('Offline - koneksi internet tidak tersedia', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Network-first strategy
 * Try network first, fallback to cache
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function networkFirstStrategy(request) {
  try {
    // Try network first
    console.log('[Service Worker] Fetching API from network:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful API responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Network fetch failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving API from cache:', request.url);
      return cachedResponse;
    }

    // Return error response
    return new Response(JSON.stringify({
      success: false,
      message: 'Offline - tidak dapat mengakses server'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });
  }
}

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

/**
 * Sync event - background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

/**
 * Sync offline bookings when connection is restored
 */
async function syncBookings() {
  try {
    // Get pending bookings from IndexedDB or localStorage
    const pendingBookings = await getPendingBookings();
    
    if (pendingBookings.length === 0) {
      return;
    }

    console.log('[Service Worker] Syncing', pendingBookings.length, 'pending bookings');

    // Send each booking to server
    for (const booking of pendingBookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(booking)
        });

        if (response.ok) {
          await removePendingBooking(booking.id);
          console.log('[Service Worker] Synced booking:', booking.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync booking:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

/**
 * Get pending bookings from storage
 * @returns {Promise<Array>} Pending bookings
 */
async function getPendingBookings() {
  // TODO: Implement IndexedDB storage
  return [];
}

/**
 * Remove synced booking from storage
 * @param {string} bookingId - Booking ID to remove
 */
async function removePendingBooking(bookingId) {
  // TODO: Implement IndexedDB removal
}