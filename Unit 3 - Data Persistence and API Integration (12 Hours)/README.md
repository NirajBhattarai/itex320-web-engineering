# Unit 3 — Data Persistence and API Integration (12 Hours)

Extends the same `users-api` from Unit 2 with durable storage and session state.

| Topic | Focus | Assignment |
|-------|--------|------------|
| [3.1 Relational Databases (SQL)](./3.1%20Relational%20Databases%20-%20SQL/README.md) | PostgreSQL + Docker Compose (Postgres **and** Redis containers), SQL, `pg` repository | Persist `users` in Postgres |
| [3.2 NoSQL Databases](./3.2%20NoSQL%20Databases/README.md) | Redis / MongoDB concepts, `src/redis.js` | Refresh tokens + logout denylist in Redis |
| [3.3 ORMs & Query Builders](./3.3%20ORMs%20and%20Query%20Builders/README.md) | Prisma schema & migrations | Replace hand SQL for users; keep Redis for tokens |
| [3.4 Distributed Data](./3.4%20Distributed%20Data/README.md) | CAP, Redis cache-aside, CQRS-light, domain events | User cache + command/query split |
| [3.5 API Architectures](./3.5%20API%20Architectures/README.md) | OpenAPI/Swagger, GraphQL, gRPC sidecar | Document REST + add GraphQL/gRPC |
| 3.6 | Microservices (Kafka/RabbitMQ, API gateways) | *Coming next* |

```text
users-api (after 3.1–3.5)
├── docker-compose.yml          ← Postgres + Redis
├── openapi/openapi.yaml        ← REST contract (3.5)
├── proto/users.proto           ← gRPC contract (3.5)
├── prisma/                     ← User + DomainEvent
├── src/
│   ├── redis.js                ← tokens (3.2) + cache:user:* (3.4)
│   ├── cache/user-cache.js
│   ├── cqrs/                   ← query + command services
│   ├── graphql/                ← /graphql
│   ├── grpc/                   ← sidecar :50051
│   └── docs/                   ← /docs Swagger UI
```

**Stack split:** PostgreSQL = durable data · Redis = tokens + read cache · REST/GraphQL/gRPC = same services.
