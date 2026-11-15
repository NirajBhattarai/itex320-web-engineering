# Unit 3 — Data Persistence and API Integration (12 Hours)

Extends the same `users-api` from Unit 2 with durable storage and session state.

| Topic | Focus | Assignment |
|-------|--------|------------|
| [3.1 Relational Databases (SQL)](./3.1%20Relational%20Databases%20-%20SQL/README.md) | PostgreSQL + Docker Compose (Postgres **and** Redis containers), SQL, `pg` repository | Persist `users` in Postgres |
| [3.2 NoSQL Databases](./3.2%20NoSQL%20Databases/README.md) | Redis / MongoDB concepts, `src/redis.js` | Refresh tokens + logout denylist in Redis |
| [3.3 ORMs & Query Builders](./3.3%20ORMs%20and%20Query%20Builders/README.md) | Prisma schema & migrations | Replace hand SQL for users; keep Redis for tokens |
| [3.4 Distributed Data](./3.4%20Distributed%20Data/README.md) | CAP, Redis cache-aside, CQRS-light, domain events | User cache + command/query split |
| [3.5 API Architectures](./3.5%20API%20Architectures/README.md) | OpenAPI/Swagger, GraphQL, gRPC sidecar | Document REST + add GraphQL/gRPC |
| [3.6 Microservices](./3.6%20Microservices/README.md) | RabbitMQ events, worker, Kafka concepts, Nginx gateway | Event-driven + API gateway |

```text
users-api (after 3.1–3.6) — end of Unit 3
├── docker-compose.yml          ← Postgres + Redis + RabbitMQ + Nginx gateway
├── gateway/nginx.conf
├── worker/notifications.worker.js
├── openapi/ + proto/
├── prisma/                     ← User + DomainEvent
└── src/
    ├── redis.js / cache / cqrs / graphql / grpc / docs
    └── messaging/              ← RabbitMQ publisher (3.6)
```

**Stack split:** PostgreSQL = durable data · Redis = tokens + cache · RabbitMQ = async events · Nginx = public gateway.
