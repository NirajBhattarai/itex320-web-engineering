<div align="center">

![Header](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80)

# 🚌 Topic 3.6 — Microservices

### Event-driven systems · RabbitMQ · Kafka concepts · API gateways · Service boundaries

### Assignment 3.6: publish domain events to RabbitMQ, run a worker consumer, put Nginx in front as an API gateway

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_3-Topic_3.6-0ea5e9?style=for-the-badge)

![RabbitMQ](https://img.shields.io/badge/RabbitMQ-AMQP-FF6600?style=flat-square&logo=rabbitmq&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-concepts-231F20?style=flat-square&logo=apachekafka&logoColor=white)
![Nginx](https://img.shields.io/badge/API_Gateway-Nginx-009639?style=flat-square&logo=nginx&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-extended-2496ED?style=flat-square&logo=docker&logoColor=white)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | **Concepts:** monolith vs microservices, events, RabbitMQ vs Kafka, API gateway |
| [A](#part-a-docker--rabbitmq) | **Docker:** add RabbitMQ to Compose |
| [B](#part-b-publish-domain-events) | **Publisher:** `users-api` emits events after commands |
| [C](#part-c-worker-consumer) | **Worker:** separate process consumes and reacts |
| [D](#part-d-nginx-api-gateway) | **Gateway:** Nginx routes `/api/` → users-api |
| [E](#part-e-try-it) | **Try it** end to end |
| [F](#part-f-tests) | **Tests** |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** Assignment 3.5 is merged (OpenAPI / GraphQL / gRPC). Domain events from **3.4** (`domain_events` table) are ideal to *also* publish to a broker. Then:
>
> ```bash
> cd users-api
> git checkout main && git pull
> git checkout -b assignment-3.6
> npm install amqplib
> mkdir -p src/messaging worker gateway
> ```

You are **not** splitting the whole app into ten repos. You practise the **patterns**: async events, a second deployable worker, and a gateway in front of the API.

---

## 0. Concepts (read first)

### 0.1 Monolith vs microservices

| | **Modular monolith** (your `users-api` so far) | **Microservices** |
|---|---|---|
| Deploy | One process / one image | Many services, independent deploys |
| Data | Usually one primary DB | **Database per service** (hard rule) |
| Talk | Function calls | HTTP/gRPC + **async events** |
| Failure | Process down = all down | Partial outage; need retries / timeouts |
| When | Classes, early products | Clear team/domain boundaries, scale needs |

> 🎯 **Key Concept:** Microservices are an **organisational and failure-isolation** tool, not a badge of honour. Start with a modular monolith; extract a service when a boundary is stable and painful to keep inside.

```mermaid
flowchart LR
    Client --> GW["API Gateway<br/>Nginx"]
    GW --> Users["users-api<br/>commands + queries"]
    Users --> PG[("Postgres")]
    Users --> RD[("Redis")]
    Users -->|"publish"| MQ[("RabbitMQ")]
    MQ --> Worker["notifications-worker"]
    style GW fill:#009639,color:#fff
    style MQ fill:#FF6600,color:#fff
```

### 0.2 Event-driven communication

| Style | Example | Pros | Cons |
|-------|---------|------|------|
| **Sync** REST/gRPC | Gateway → users-api | Simple request/response | Cascading latency / failures |
| **Async** message | UserUpdated → queue → worker | Decoupled, resilient | Eventual consistency, harder debugging |

**At-least-once** delivery is normal: consumers must be **idempotent** (processing the same event twice must be safe).

### 0.3 RabbitMQ vs Kafka (know both; build with RabbitMQ)

| | **RabbitMQ** | **Apache Kafka** |
|---|---|---|
| Model | Smart broker, queues, exchanges, routing keys | Dumb log, consumer groups, partitions |
| Typical use | Task queues, work distribution, routing | Event streaming, replay, high throughput |
| Message lifetime | Deleted when consumed (usually) | Retained for a retention period; **replay** |
| Ops in class | One Docker image, Management UI | Needs ZooKeeper/KRaft; heavier |

**This assignment uses RabbitMQ** so everyone can run it locally. You must still answer Kafka questions in the short answers.

### 0.4 API gateway

An **API gateway** is the single public entry:

- TLS termination, routing, rate limits, auth (sometimes)
- Hides internal hostnames and ports
- Can fan out to many services later (`/users` → users-api, `/orders` → orders-api)

In Topic 2.1 you already met Nginx as a reverse proxy. Here it becomes the **gateway** for the Unit 3 stack.

---

## Part A: Docker — RabbitMQ

### A.1 Extend `docker-compose.yml`

Add alongside Postgres and Redis:

```yaml
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: users-api-rabbitmq
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: users
      RABBITMQ_DEFAULT_PASS: users
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10
    volumes:
      - rabbitmq_data:/data
```

Add `rabbitmq_data:` under `volumes:`.

```bash
docker compose up -d
# UI: http://127.0.0.1:15672  (users / users)
```

### A.2 Env

```env
RABBITMQ_URL=amqp://users:users@127.0.0.1:5672
USERS_EVENTS_EXCHANGE=users.events
USERS_EVENTS_QUEUE=users.events.notifications
```

```js
// env.js
rabbitmqUrl: required('RABBITMQ_URL'),
usersEventsExchange: process.env.USERS_EVENTS_EXCHANGE ?? 'users.events',
usersEventsQueue: process.env.USERS_EVENTS_QUEUE ?? 'users.events.notifications',
```

---

## Part B: Publish domain events

### B.1 `src/messaging/rabbit.js`

```js
import amqp from 'amqplib';
import { env } from '../config/env.js';

let conn;
let channel;

export async function getChannel() {
  if (channel) return channel;
  conn = await amqp.connect(env.rabbitmqUrl);
  channel = await conn.createChannel();
  await channel.assertExchange(env.usersEventsExchange, 'topic', { durable: true });
  return channel;
}

export async function closeRabbit() {
  await channel?.close();
  await conn?.close();
  channel = undefined;
  conn = undefined;
}
```

### B.2 `src/messaging/users-events.publisher.js`

```js
import { env } from '../config/env.js';
import { getChannel } from './rabbit.js';

/**
 * Publishes after a successful command (and after DB domain_events append from 3.4).
 * routingKey examples: user.created | user.updated | user.deleted
 */
export class UsersEventsPublisher {
  async publish(routingKey, payload) {
    const ch = await getChannel();
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        publishedAt: new Date().toISOString(),
      }),
    );
    ch.publish(env.usersEventsExchange, routingKey, body, {
      contentType: 'application/json',
      persistent: true,
      messageId: payload.eventId, // DomainEvent id if you have it
    });
  }
}
```

### B.3 Hook into command service (3.4)

After `eventStore.append(...)` succeeds:

```js
await this.publisher.publish('user.updated', {
  eventId: event.id,
  type: 'UserUpdated',
  aggregateId: id,
  payload: { changes: Object.keys(changes) },
});
```

Same for `user.created` and `user.deleted`.

If RabbitMQ is down, decide deliberately:

| Strategy | Class recommendation |
|----------|----------------------|
| Fail the HTTP request | Strict — user sees 503 |
| Log + keep DB event | Softer — worker can be backfilled from `domain_events` later |

Document your choice in the PR. Prefer **fail closed in production**; for the lab, logging + continuing is acceptable if you show a clear warning.

---

## Part C: Worker consumer

### C.1 `worker/notifications.worker.js`

A **second Node process** (same repo, different entrypoint):

```js
import amqp from 'amqplib';

const url = process.env.RABBITMQ_URL ?? 'amqp://users:users@127.0.0.1:5672';
const exchange = process.env.USERS_EVENTS_EXCHANGE ?? 'users.events';
const queue = process.env.USERS_EVENTS_QUEUE ?? 'users.events.notifications';

const conn = await amqp.connect(url);
const ch = await conn.createChannel();
await ch.assertExchange(exchange, 'topic', { durable: true });
await ch.assertQueue(queue, { durable: true });
await ch.bindQueue(queue, exchange, 'user.*');
await ch.prefetch(10);

console.log('[worker] waiting for user.* events');

ch.consume(queue, async (msg) => {
  if (!msg) return;
  try {
    const event = JSON.parse(msg.content.toString());
    // Idempotency: skip if you already handled event.eventId (store in Redis/Postgres).
    console.log('[worker] handled', event.type, event.aggregateId);
    // Fake side effect: "send email" / write a notifications.log line
    ch.ack(msg);
  } catch (err) {
    console.error('[worker] failed', err);
    ch.nack(msg, false, false); // dead-letter in a fuller design
  }
});
```

### C.2 Scripts

```json
{
  "scripts": {
    "worker": "node --env-file-if-exists=.env worker/notifications.worker.js"
  }
}
```

Run API and worker in two terminals (or add a `worker` service in Compose that builds the same image with a different command — bonus).

---

## Part D: Nginx API gateway

### D.1 `gateway/nginx.conf`

```nginx
worker_processes 1;

events { worker_connections 1024; }

http {
  upstream users_api {
    server host.docker.internal:3000; # API on the host
    # On Linux Docker you may need extra_hosts or run API in Compose too.
  }

  server {
    listen 8080;

    # Gateway health
    location = /healthz {
      default_type text/plain;
      return 200 'ok';
    }

    # Public API surface
    location /api/ {
      proxy_pass http://users_api;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Request-Id $request_id;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Docs / GraphQL through the gateway too
    location /docs {
      proxy_pass http://users_api;
    }
    location /openapi.json {
      proxy_pass http://users_api;
    }
    location /graphql {
      proxy_pass http://users_api;
    }

    # Do NOT expose RabbitMQ or Postgres ports via the gateway.
  }
}
```

### D.2 Compose service

```yaml
  gateway:
    image: nginx:1.27-alpine
    container_name: users-api-gateway
    ports:
      - "8080:8080"
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - rabbitmq
```

Clients use **http://127.0.0.1:8080/api/v1/...** instead of hitting `:3000` directly.

> 🪟 **Windows / macOS Docker Desktop:** `host.docker.internal` usually works. On Linux, `extra_hosts` above is required.

---

## Part E: Try it

```bash
docker compose up -d
npm run db:migrate   # or prisma migrate deploy
npm run dev          # terminal 1 — users-api :3000
npm run worker       # terminal 2 — consumer
```

```bash
# Through the gateway
curl -s http://127.0.0.1:8080/healthz
curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"sita@example.com","password":"Secret123!"}' | jq

# Update a user → expect worker log line
curl -s -X PATCH http://127.0.0.1:8080/api/v1/users/$USER_ID \
  -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' \
  -d '{"firstName":"Sita"}'

# RabbitMQ UI: Queues → users.events.notifications → message rates
open http://127.0.0.1:15672
```

```bash
git add .
git commit -m "feat(messaging): RabbitMQ user events, notifications worker, Nginx gateway"
git push -u origin assignment-3.6
```

Merge after submitting.

---

## Part F: Tests

| Test | Expect |
|------|--------|
| Publisher with fake channel | `publish` called with `user.updated` |
| Worker handler | acks valid JSON; nacks garbage (or your chosen policy) |
| Gateway | `curl :8080/healthz` → `ok` (manual or integration) |
| Existing suite | Still green with Rabbit optional mock in unit tests |

For unit tests, inject a fake `UsersEventsPublisher` so CI does not need RabbitMQ. Add one optional integration test behind `RABBITMQ_URL`.

```bash
npm test
```

---

## 📤 What to submit

1. **Pull Request** (`assignment-3.6` → `main`).
2. **Screenshots:**
   - RabbitMQ management UI showing the exchange, queue, and a spike after PATCH
   - Worker terminal logging `UserUpdated` (or `user.updated`)
   - `curl` via **:8080** gateway succeeding
3. **Architecture diagram** (Mermaid or draw.io) in the PR: Client → Gateway → users-api → Postgres/Redis + RabbitMQ → Worker
4. **Short answers** (3–5 sentences each):
   1. When would you extract a real separate “notifications” **service with its own database**, instead of a worker in the same repo?
   2. Compare RabbitMQ and Kafka for “replay last week’s UserUpdated events.” Which fits better and why?
   3. What problems does an API gateway solve that putting every service on the public internet would cause?

## 🧮 Marking (10 marks)

| Criteria | Marks |
|----------|:-----:|
| RabbitMQ in Compose; topic exchange + queue binding | 2 |
| users-api publishes after successful commands | 3 |
| Separate worker consumes and acknowledges safely | 2 |
| Nginx gateway proxies `/api` (and docs/graphql) | 2 |
| Screenshots / diagram / short answers | 1 |

### ⭐ Bonus (+2, choose one)

- Run the worker as a Compose service with restart policy `unless-stopped`.  
- Add a **dead-letter queue** for failed messages.  
- Swap in a one-paragraph design for **Kafka** (topics, consumer group) without implementing it — show how routing keys map to topic names.

---

<div align="center">

⬅️ [Topic 3.5: API Architectures](../3.5%20API%20Architectures/README.md)  ·  **Topic 3.6**  ·  🎓 End of Unit 3 · Next: Unit 4 (Deployment & Next-Gen Web)

</div>
