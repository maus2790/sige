// public/sw.js
// Importar OneSignal para evitar conflictos con el Service Worker de la PWA
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'sige-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar fetch requests con estrategia Network First
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Omitir esquemas no soportados (extensiones de Chrome, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // 2. Omitir métodos no soportados por el Cache API (solo permite GET)
  if (request.method !== 'GET') {
    return;
  }

  // 3. Omitir llamadas a la API, autenticación y chunks internos de Next.js
  if (
    url.pathname.includes('/api/') || 
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/_next/') || // Evita cachear chunks de Next.js que cambian en dev
    url.pathname.includes('webpack') // Evita cachear archivos de hot reloading
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y guardarla en caché
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar buscar en caché
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          // Si no está en caché y es navegación, mostrar página offline
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return new Response('Sin conexión', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});