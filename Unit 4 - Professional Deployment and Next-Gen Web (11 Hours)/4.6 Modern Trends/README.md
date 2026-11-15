<div align="center">

![Header](https://images.unsplash.com/photo-1639322537504-6427a16b0a28?auto=format&fit=crop&w=1200&q=80)

# ✨ Topic 4.6 — Modern Trends

### Edge computing · WebAssembly · Real-time Web (WebSockets)

### Assignment 4.6: add WebSocket notifications to `users-api` and explore edge/Wasm at concept + mini-lab level

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_4-Topic_4.6-f97316?style=for-the-badge)

![WS](https://img.shields.io/badge/WebSockets-real--time-0ea5e9?style=flat-square)
![Wasm](https://img.shields.io/badge/WebAssembly-concepts-654FF0?style=flat-square&logo=webassembly&logoColor=white)
![Edge](https://img.shields.io/badge/Edge-CDN_workers-F38020?style=flat-square)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | Edge, Wasm, real-time patterns |
| [A](#part-a-websockets-on-users-api) | `/ws` hub + broadcast on user events |
| [B](#part-b-tiny-client) | Browser or CLI subscriber |
| [C](#part-c-edge--wasm-labs) | Short labs / write-ups |
| [📤](#-what-to-submit) | Submission and marking |

> ```bash
> cd users-api && git checkout -b assignment-4.6
> npm install ws
> mkdir -p src/realtime
> ```

---

## 0. Concepts (read first)

### 0.1 Edge computing

Run logic **close to users** (CDN workers: Cloudflare Workers, Fastly Compute, AWS Lambda@Edge):

| Good at | Weak at |
|---------|---------|
| A/B headers, auth JWT verify, caching, redirects | Heavy DB, long jobs, large Node APIs |

Your core `users-api` stays regional; edge can sit in front for TLS, bot score, geo routing.

### 0.2 WebAssembly (Wasm)

Compile C/Rust/Go to a portable binary for browsers **or** edge/server runtimes:

- Near-native speed for CPU-heavy bits (image codecs, parsers)
- Not a replacement for your Express app in this course

### 0.3 Real-time Web

| Technique | Use |
|-----------|-----|
| **Short polling** | Simple, wasteful |
| **SSE** | Server → browser streams |
| **WebSockets** | Bidirectional (chat, live feeds) |

---

## Part A: WebSockets on users-api

### A.1 `src/realtime/hub.js`

```js
import { WebSocketServer } from 'ws';

export function createRealtimeHub(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set();

  wss.on('connection', (socket, req) => {
    // Optional: require ?token= access JWT and verify
    clients.add(socket);
    socket.send(JSON.stringify({ type: 'welcome' }));
    socket.on('close', () => clients.delete(socket));
  });

  function broadcast(event) {
    const raw = JSON.stringify(event);
    for (const c of clients) {
      if (c.readyState === 1) c.send(raw);
    }
  }

  return { wss, broadcast };
}
```

### A.2 Attach in `server.js`

```js
const server = app.listen(env.port);
const realtime = createRealtimeHub(server);
// pass realtime.broadcast into UsersCommandService / publisher
```

After a successful `UserUpdated` command (and/or Rabbit publish):

```js
realtime.broadcast({ type: 'UserUpdated', aggregateId: id, at: new Date().toISOString() });
```

Gateway must support WebSocket upgrade:

```nginx
location /ws {
  proxy_pass http://users_api;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

---

## Part B: Tiny client

Browser console or `public/ws-demo.html`:

```js
const ws = new WebSocket('ws://127.0.0.1:3000/ws');
ws.onmessage = (e) => console.log('event', JSON.parse(e.data));
```

PATCH a user in another tab; expect a message.

---

## Part C: Edge & Wasm labs

Complete **both** write-ups in `docs/MODERN_TRENDS.md` (½–1 page each):

1. **Edge:** Pick Cloudflare Workers *or* a CDN feature — describe how you would verify JWT at the edge and only forward `/api` to origin.  
2. **Wasm:** Run any tiny Wasm demo (official Wasm hello, or `wasm-bindgen` tutorial screenshot) and explain one feature of *your* product that could move to Wasm later (e.g. client-side image compress before upload from 2.4).

---

## 📤 What to submit

1. PR with WebSocket hub + broadcast + nginx upgrade snippet  
2. Screenshot of client receiving `UserUpdated`  
3. `docs/MODERN_TRENDS.md` edge + Wasm write-ups  
4. Short answers: WS vs SSE; why sticky sessions matter for WS at scale; one reason edge JWT checks reduce origin load  

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| Working `/ws` broadcast on user commands | 4 |
| Gateway upgrade config | 1 |
| Edge + Wasm write-ups | 3 |
| Demo screenshot / short answers | 2 |

### ⭐ Bonus (+2)
Authenticate the WebSocket with the same JWT as REST and reject anonymous sockets.

---

<div align="center">

⬅️ [Topic 4.5](../4.5%20PWA%20Fundamentals/README.md)  ·  **Topic 4.6**  ·  🎓 End of Unit 4 · Course deployment milestone complete

</div>
