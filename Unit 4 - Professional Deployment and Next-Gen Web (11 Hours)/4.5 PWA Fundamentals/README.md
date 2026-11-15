<div align="center">

![Header](https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80)

# 📱 Topic 4.5 — PWA Fundamentals

### Web app manifest · Service workers · Offline caching · Installability

### Assignment 4.5: turn a small frontend (Bookstore UI or a minimal users dashboard) into an installable PWA

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_4-Topic_4.5-f97316?style=for-the-badge)

![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?style=flat-square)
![SW](https://img.shields.io/badge/Service_Worker-CacheFirst-0ea5e9?style=flat-square)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | What makes a PWA |
| [A](#part-a-manifest) | `manifest.webmanifest` |
| [B](#part-b-service-worker) | Precache shell + runtime API strategy |
| [C](#part-c-register--https) | Registration + HTTPS notes |
| [📤](#-what-to-submit) | Submission and marking |

> Use the **Bookstore frontend** from Unit 2 reference **or** a Vite React app that talks to `users-api`.
>
> ```bash
> cd bookstore/frontend   # or your app
> git checkout -b assignment-4.5
> ```

---

## 0. Concepts (read first)

A **Progressive Web App** is a website that is:

| Requirement | Mechanism |
|-------------|-----------|
| **Installable** | Web App Manifest + icons |
| **Works offline / flaky net** | Service Worker + Cache Storage |
| **Secure context** | HTTPS (or `localhost`) |

Service workers can break debugging — always ship an “Update” / unregister path during class.

---

## Part A: Manifest

`public/manifest.webmanifest`:

```json
{
  "name": "ITEX 320 Users",
  "short_name": "Users",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0ea5e9",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

In `index.html`:

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#0ea5e9" />
```

Provide real PNG icons (not empty files).

---

## Part B: Service worker

`public/sw.js` (simple teaching version):

```js
const SHELL = 'app-shell-v1';
const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // API: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)),
    );
    return;
  }
  // Static: cache-first
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request)),
  );
});
```

Optional: use `vite-plugin-pwa` / Workbox for production-grade precaching — document if you do.

---

## Part C: Register

```js
// src/pwa.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });
}
```

Demo offline: DevTools → Application → Service Workers → Offline → reload shell still shows.

---

## 📤 What to submit

1. PR (frontend) with manifest, icons, SW, registration  
2. Screenshots: install prompt or Application panel; offline shell working  
3. Short answers: cache-first vs network-first; why SW requires HTTPS; one security risk of caching authenticated API responses  

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| Valid manifest + icons | 3 |
| Service worker precache + fetch strategies | 4 |
| Offline demo screenshots | 2 |
| Short answers | 1 |

### ⭐ Bonus (+2)
Add a “New version available” toast when `controllerchange` fires.

---

<div align="center">

⬅️ [Topic 4.4](../4.4%20Deployment%20Strategies/README.md)  ·  **Topic 4.5**  ·  [Topic 4.6 ➡️](../4.6%20Modern%20Trends/README.md)

</div>
