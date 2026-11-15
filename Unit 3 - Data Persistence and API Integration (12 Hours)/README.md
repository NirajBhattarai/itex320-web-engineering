# Unit 3 — Data Persistence and API Integration (12 Hours)

Extends the same `users-api` from Unit 2 with durable storage and session state.

| Topic | Focus | Assignment |
|-------|--------|------------|
| [3.1 Relational Databases (SQL)](./3.1%20Relational%20Databases%20-%20SQL/README.md) | PostgreSQL + Docker Compose (Postgres **and** Redis containers), SQL, `pg` repository | Persist `users` in Postgres |
| [3.2 NoSQL Databases](./3.2%20NoSQL%20Databases/README.md) | Redis / MongoDB concepts, `src/redis.js` | Refresh tokens + logout denylist in Redis |
| [3.3 ORMs & Query Builders](./3.3%20ORMs%20and%20Query%20Builders/README.md) | Prisma schema & migrations | Replace hand SQL for users; keep Redis for tokens |
| 3.4–3.6 | Distributed data, GraphQL/gRPC/OpenAPI, microservices | *Coming next* |

```text
users-api (after 3.1–3.3)
├── docker-compose.yml          ← Postgres + Redis
├── prisma/                     ← User schema & migrations (3.3)
├── src/
│   ├── redis.js                ← Redis client (3.2)
│   ├── db/prisma.js            ← PrismaClient (3.3)
│   └── repositories/
│       ├── users.repository.js           ← Prisma
│       └── refresh-tokens.repository.js  ← Redis
```

**Stack split:** PostgreSQL = durable user data · Redis = auth tokens / logout.
