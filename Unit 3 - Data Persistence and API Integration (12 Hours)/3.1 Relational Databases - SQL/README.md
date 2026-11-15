<div align="center">

![Header](https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80)

# 🐘 Topic 3.1 — Relational Databases (SQL)

### PostgreSQL · Docker Compose · Joins · Indexes · Transactions · Parameterised queries

### Assignment 3.1: move `users-api` from an in-memory `Map` to PostgreSQL

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_3-Topic_3.1-0ea5e9?style=for-the-badge)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-PostgreSQL_%2B_Redis-2496ED?style=flat-square&logo=docker&logoColor=white)
![pg](https://img.shields.io/badge/node--postgres-pg-336791?style=flat-square)
![SQL](https://img.shields.io/badge/SQL-parameterised-brightgreen?style=flat-square)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | **Concepts:** tables, keys, joins, indexes, transactions, SQL vs the in-memory Map |
| [A](#part-a-docker-compose--postgresql--redis) | **Docker:** start PostgreSQL + Redis with one command |
| [B](#part-b-schema--migrations) | **Schema:** `users` table, indexes, SQL migration runner |
| [C](#part-c-postgres-users-repository) | **Code:** `pg` pool + PostgreSQL `UsersRepository` |
| [D](#part-d-wire-it-up--smoke-test) | **Wire-up:** env, container, curl checks |
| [E](#part-e-tests) | **Tests:** keep unit fakes; integration against real Postgres |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** Unit 2 is finished (`users-api` through Assignment 2.5, `npm test` green). Then:
>
> ```bash
> cd users-api
> git checkout main && git pull
> git checkout -b assignment-3.1
> npm install pg
> mkdir -p docker sql src/db
> ```
>
> You also need **Docker Desktop** (or OrbStack / Colima) running. Check with `docker version`.

The same `users-api` grows again: **Unit 2 (HTTP + auth + security) → 3.1 Postgres users → 3.2 Redis tokens → 3.3 Prisma.**

Refresh tokens stay in the in-memory repository for this assignment. Assignment **3.2** moves them to Redis. Redis is started now so one Compose file covers 3.1 and 3.2.

---

## 0. Concepts (read first)

### 0.1 Why leave the `Map`?

| | 🧠 In-memory `Map` (Unit 2) | 🐘 PostgreSQL (Unit 3) |
|---|---|---|
| Survives restart | ❌ gone | ✅ durable |
| Shared across API instances | ❌ each process has its own Map | ✅ one database |
| Query language | JavaScript `.filter` / `.find` | SQL (`WHERE`, `JOIN`, `ORDER BY`) |
| Concurrent writes | easy to get wrong | **transactions** + row locks |
| Good for | tests, prototypes | production user data |

```mermaid
flowchart LR
    R(["📥 HTTP"]) --> C["Controller"] --> S["Service"] --> P["UsersRepository"]
    P -->|"Unit 2"| M["Map in RAM"]
    P -->|"Unit 3.1"| PG[("PostgreSQL")]
    style M fill:#ca8a04,color:#fff
    style PG fill:#4169E1,color:#fff
```

### 0.2 Tables, rows, and keys

A **relational** database stores data in **tables** (relations). Each **row** is one record; each **column** has a type.

| Idea | In `users` | Why it matters |
|------|------------|----------------|
| **Primary key** | `id UUID PRIMARY KEY` | Uniquely identifies a row |
| **Unique constraint** | `email UNIQUE` | DB rejects duplicate emails even if two requests race |
| **NOT NULL** | `first_name`, `role`, … | Required fields enforced by the DB, not only by Zod |
| **Foreign key** (later) | e.g. `posts.user_id → users.id` | Keeps related tables consistent |

> 🎯 **Key Concept:** Application validation (Zod) and database constraints work together. Zod gives clear 400 errors; unique indexes stop race conditions that Zod cannot see.

### 0.3 Joins (preview)

When data lives in more than one table, you **join** on a shared key:

```sql
SELECT u.email, p.title
FROM users u
JOIN posts p ON p.user_id = u.id
WHERE u.role = 'admin';
```

| Join | Keeps rows when… |
|------|------------------|
| `INNER JOIN` | match exists on both sides |
| `LEFT JOIN` | left row always kept; right side may be `NULL` |

You will not need joins for the `users` table alone, but you must understand them for Milestone 3 (schema design).

### 0.4 Indexes

An **index** is a lookup structure (usually a B-tree) so the database does not scan every row.

```sql
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));
CREATE INDEX users_role_idx ON users (role);
```

| Query pattern | Index helps? |
|---------------|:------------:|
| `WHERE email = $1` | ✅ unique index |
| `WHERE role = 'admin'` | ✅ |
| `WHERE first_name LIKE '%am'` | ❌ leading wildcard; consider trigram / full-text later |

### 0.5 Transactions

A **transaction** groups statements so they all succeed or all fail (`COMMIT` / `ROLLBACK`).

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

PostgreSQL’s default isolation level is **Read Committed**. You will use transactions in 3.3 when an ORM wraps multi-step writes; for 3.1, know that a single `INSERT`/`UPDATE` is already atomic.

### 0.6 Parameterised queries (never string-concat SQL)

```js
// ❌ SQL injection
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ placeholders — values sent separately
await pool.query('SELECT * FROM users WHERE email = $1', [email]);
```

`pg` sends the SQL and the parameters apart. Even a malicious email cannot change the query shape.

---

## Part A: Docker Compose — PostgreSQL + Redis

### A.1 Why Docker for databases?

Installing Postgres and Redis on every laptop differs by OS. **Docker Compose** runs the same official images everywhere. Your Node app still runs on the host and connects to `localhost`.

### A.2 `docker-compose.yml` (project root)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: users-api-postgres
    environment:
      POSTGRES_USER: users
      POSTGRES_PASSWORD: users
      POSTGRES_DB: users_api
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U users -d users_api"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: users-api-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    # Assignment 3.2 uses Redis for refresh tokens / logout.
    # You do not connect to it from Node until Topic 3.2.

volumes:
  postgres_data:
  redis_data:
```

### A.3 Start and verify

```bash
docker compose up -d
docker compose ps
docker compose exec postgres psql -U users -d users_api -c 'SELECT version();'
docker compose exec redis redis-cli ping
```

Expected: Postgres prints a version string; Redis replies `PONG`.

```bash
# Stop (keeps data in volumes)
docker compose stop

# Start again
docker compose start

# Wipe containers AND volumes (fresh empty databases)
docker compose down -v
```

> 🪟 **Windows:** run these in **Git Bash**. Docker Desktop must be running.

---

## Part B: Schema & migrations

### B.1 `sql/001_create_users.sql`

```sql
-- UUID primary keys without an extension (Postgres 13+).
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  phone           TEXT,
  date_of_birth   DATE,
  address         TEXT,
  role            TEXT        NOT NULL DEFAULT 'customer'
                              CHECK (role IN ('customer', 'admin')),
  password_hash   TEXT,
  github_id       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive unique email (matches our toLowerCase() convention).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx
  ON users (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS users_github_id_uidx
  ON users (github_id)
  WHERE github_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at DESC);
```

| Column | Maps from Unit 2 field | Notes |
|--------|------------------------|-------|
| `first_name` | `firstName` | SQL uses snake_case; JS keeps camelCase |
| `password_hash` | `passwordHash` | Nullable for GitHub-only accounts |
| `github_id` | `githubId` | Partial unique index ignores `NULL` |

### B.2 `src/db/pool.js`

```js
import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

/** Shared connection pool — create once per process. */
export function createPool(connectionString = env.databaseUrl) {
  return new Pool({
    connectionString,
    // Fail fast in tests / bad config instead of hanging.
    connectionTimeoutMillis: 5_000,
  });
}
```

### B.3 `src/db/migrate.js`

```js
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../sql');

/**
 * Applies numbered .sql files in order. Safe to re-run (IF NOT EXISTS).
 * For production you will use Prisma Migrate in Assignment 3.3;
 * this runner teaches what a migration actually is.
 */
export async function migrate(pool = createPool()) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = ['001_create_users.sql'];

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE id = $1',
      [file],
    );
    if (rows.length) continue;

    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`applied ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

// `node src/db/migrate.js` from package scripts
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.js')) {
  const pool = createPool();
  migrate(pool)
    .then(() => pool.end())
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
```

> ⚠️ The `import.meta.url` CLI check can be awkward on some platforms. Prefer a dedicated npm script that always calls `migrate()` (below).

Simpler CLI entry — `src/db/run-migrate.js`:

```js
import { createPool } from './pool.js';
import { migrate } from './migrate.js';

const pool = createPool();
try {
  await migrate(pool);
} finally {
  await pool.end();
}
```

And trim `migrate.js` so it **only exports** `migrate` (remove the bottom `if (import.meta.url…)` block if you use `run-migrate.js`).

### B.4 Scripts and env

Add to `package.json`:

```json
{
  "scripts": {
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "db:migrate": "node --env-file-if-exists=.env src/db/run-migrate.js",
    "db:psql": "docker compose exec postgres psql -U users -d users_api"
  }
}
```

Extend `.env.example` / `.env`:

```env
# Existing Unit 2 vars…
DATABASE_URL=postgres://users:users@127.0.0.1:5432/users_api
REDIS_URL=redis://127.0.0.1:6379
```

Extend `src/config/env.js`:

```js
// …existing fields…
databaseUrl: required('DATABASE_URL'),
redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
```

`required` for `DATABASE_URL` so a missing DB config fails at boot. `REDIS_URL` is optional until 3.2.

```bash
docker compose up -d
npm run db:migrate
npm run db:psql -c '\dt'
```

You should see `users` and `schema_migrations`.

---

## Part C: Postgres UsersRepository

### C.1 Snake ↔ camel mapping

PostgreSQL columns are `snake_case`. The rest of `users-api` still uses `camelCase`. Keep the mapping in the repository so services never see SQL shapes.

```js
// src/db/mappers.js
export function toUserRow(user) {
  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email.toLowerCase(),
    phone: user.phone ?? null,
    date_of_birth: user.dateOfBirth ?? null,
    address: user.address ?? null,
    role: user.role,
    password_hash: user.passwordHash ?? null,
    github_id: user.githubId ?? null,
  };
}

export function fromUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth ? row.date_of_birth.toISOString?.().slice(0, 10) ?? String(row.date_of_birth).slice(0, 10) : null,
    address: row.address,
    role: row.role,
    passwordHash: row.password_hash,
    githubId: row.github_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
```

### C.2 `src/repositories/users.repository.js` (replace)

Keep the **same method names** the service already calls: `create`, `findById`, `findByEmail`, `findByGithubId`, `findAll`, `update`, `delete`.

```js
import { fromUserRow, toUserRow } from '../db/mappers.js';

export class UsersRepository {
  /** @param {import('pg').Pool} pool */
  constructor(pool) {
    this.pool = pool;
  }

  async create(data) {
    const row = toUserRow(data);
    const { rows } = await this.pool.query(
      `INSERT INTO users (
         first_name, last_name, email, phone, date_of_birth, address,
         role, password_hash, github_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        row.first_name,
        row.last_name,
        row.email,
        row.phone,
        row.date_of_birth,
        row.address,
        row.role,
        row.password_hash,
        row.github_id,
      ],
    );
    return fromUserRow(rows[0]);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return fromUserRow(rows[0]);
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE lower(email) = lower($1)',
      [email],
    );
    return fromUserRow(rows[0]);
  }

  async findByGithubId(githubId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE github_id = $1',
      [githubId],
    );
    return fromUserRow(rows[0]);
  }

  async findAll() {
    const { rows } = await this.pool.query(
      'SELECT * FROM users ORDER BY last_name ASC, first_name ASC',
    );
    return rows.map(fromUserRow);
  }

  async update(id, changes) {
    const current = await this.findById(id);
    if (!current) return null;

    const next = toUserRow({ ...current, ...changes, id });
    const { rows } = await this.pool.query(
      `UPDATE users SET
         first_name = $2,
         last_name = $3,
         email = $4,
         phone = $5,
         date_of_birth = $6,
         address = $7,
         role = $8,
         password_hash = $9,
         github_id = $10,
         updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        next.first_name,
        next.last_name,
        next.email,
        next.phone,
        next.date_of_birth,
        next.address,
        next.role,
        next.password_hash,
        next.github_id,
      ],
    );
    return fromUserRow(rows[0]);
  }

  async delete(id) {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}
```

> 🎯 **Key Concept:** The service layer did not change. That is the point of the repository pattern from Assignment 2.1 — swap storage without rewriting business rules.

### C.3 Unique violations → 409 Conflict

Two parallel registers with the same email can both pass the service’s `findByEmail` check. Postgres then rejects the second `INSERT`. Map that to your existing `conflict()` helper:

In `UsersService.create` / `#assertEmailAvailable` path, or wrap in the repository:

```js
import { conflict } from '../utils/http-error.js';

function rethrowUnique(err) {
  if (err?.code === '23505') {
    // unique_violation
    throw conflict('Email is already registered');
  }
  throw err;
}

// around create:
try {
  // INSERT …
} catch (err) {
  rethrowUnique(err);
}
```

---

## Part D: Wire it up & smoke test

### D.1 `src/container.js` (changed)

```js
import { createPool } from './db/pool.js';
import { UsersRepository } from './repositories/users.repository.js';
// …keep RefreshTokensRepository (in-memory) until 3.2…
import { env } from './config/env.js';

export function createContainer(overrides = {}) {
  const pool = overrides.pool ?? createPool();
  const usersRepository = overrides.usersRepository ?? new UsersRepository(pool);

  // …build usersService, tokenService, authService as in Unit 2,
  //    but pass usersRepository from above…

  return {
    pool,
    usersRepository,
    // …existing exports…
    ...overrides,
  };
}
```

### D.2 `src/server.js` (changed)

Migrate on boot (dev-friendly) and close the pool on shutdown:

```js
import { migrate } from './db/migrate.js';
// …

const container = createContainer();
await migrate(container.pool);

const server = app.listen(env.port, () => {
  console.log(`listening on :${env.port}`);
});

async function shutdown() {
  server.close();
  await container.pool.end();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

### D.3 Smoke test

```bash
docker compose up -d
npm run db:migrate
npm run dev
```

```bash
# Register (same as Unit 2)
curl -s -X POST http://127.0.0.1:3000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"firstName":"Sita","lastName":"Sharma","email":"sita@example.com","password":"Secret123!"}' | jq

# Restart the API — user must still exist
# Ctrl+C, then npm run dev again, then:
curl -s -X POST http://127.0.0.1:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"sita@example.com","password":"Secret123!"}' | jq
```

Confirm in SQL:

```bash
npm run db:psql -c 'SELECT id, email, role FROM users;'
```

---

## Part E: Tests

### E.1 Unit tests stay fast

Controller/service unit tests should keep injecting a **fake** users repository (or the old in-memory one). Do **not** require Docker for every unit test.

### E.2 Integration tests against Postgres

Create a second database once:

```bash
docker compose exec postgres psql -U users -d users_api -c "CREATE DATABASE users_api_test;"
```

In `tests/setup/postgres.js`:

```js
import { createPool } from '../../src/db/pool.js';
import { migrate } from '../../src/db/migrate.js';

export async function resetTestDb() {
  const url = process.env.TEST_DATABASE_URL
    ?? 'postgres://users:users@127.0.0.1:5432/users_api_test';
  const pool = createPool(url);
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrate(pool);
  return pool;
}
```

In integration tests, `createContainer({ pool })` with that pool, and `TRUNCATE users CASCADE` (or drop schema) between cases.

Add to `.env.example`:

```env
TEST_DATABASE_URL=postgres://users:users@127.0.0.1:5432/users_api_test
```

```bash
npm test
```

All previous Unit 2 tests should still pass once integration helpers use Postgres (or fakes where appropriate).

```bash
git add .
git commit -m "feat(db): persist users in PostgreSQL via Docker Compose"
git push -u origin assignment-3.1
```

Open a PR into `main`. **After submitting, merge it** so 3.2 starts from Postgres-backed users.

---

## 📤 What to submit

1. **Pull Request link** (`assignment-3.1` → `main`) in the same `users-api` repo.
2. **Screenshots:**
   - `docker compose ps` showing healthy `postgres` and `redis`
   - `npm run db:migrate` applying `001_create_users.sql`
   - Register → restart API → login still works
   - `SELECT email, role FROM users;` in `psql`
3. **Short answers** (3–5 sentences each):
   1. Why is a unique index on `lower(email)` better than only checking `findByEmail` in JavaScript?
   2. What is a SQL injection, and how do `$1` placeholders prevent it?
   3. Explain PRIMARY KEY vs UNIQUE INDEX using your `users` table.

## 🧮 Marking (10 marks)

| Criteria | Marks |
|----------|:-----:|
| `docker-compose.yml` runs Postgres + Redis; healthchecks work | 2 |
| SQL migration creates `users` with constraints + indexes | 2 |
| `UsersRepository` uses parameterised `pg` queries; services unchanged | 3 |
| Data survives API restart; tests pass | 2 |
| Short answers | 1 |

### ⭐ Bonus (+2)

Add `sql/002_create_audit_log.sql` with an `audit_events` table (`id`, `user_id` FK → `users`, `action`, `created_at`) and write a short join query that lists each user’s email with their last login action.

---

<div align="center">

⬅️ [Unit 2 Topic 2.5](../../Unit%202%20-%20Backend%20Engineering%20%26%20Secure%20API%20Design%20(14%20Hours)/2.5%20Web%20Security%20%26%20Hardening/README.md)  ·  **Topic 3.1**  ·  [Topic 3.2: NoSQL Databases ➡️](../3.2%20NoSQL%20Databases/README.md)

</div>
