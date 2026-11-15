<div align="center">

![Header](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80)

# 🧩 Topic 3.3 — ORMs & Query Builders

### Prisma · Schema design · Migrations · Type-safe queries · Replacing hand-written SQL

### Assignment 3.3: replace the `pg` UsersRepository with Prisma (keep Redis for tokens)

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_3-Topic_3.3-0ea5e9?style=for-the-badge)

![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_tokens-unchanged-DC382D?style=flat-square&logo=redis&logoColor=white)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | **Concepts:** ORM vs query builder vs raw SQL; Prisma mental model |
| [A](#part-a-install-prisma--schema) | **Schema:** `User` model matching your 3.1 table |
| [B](#part-b-migrations) | **Migrations:** Prisma Migrate replaces `sql/001_…` runner |
| [C](#part-c-prisma-users-repository) | **Code:** Prisma-backed `UsersRepository` |
| [D](#part-d-wire-up--cleanup) | **Wire-up:** client lifecycle; retire hand SQL for users |
| [E](#part-e-tests) | **Tests** |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** Assignments 3.1 and 3.2 are merged (Postgres users + Redis tokens). Then:
>
> ```bash
> cd users-api
> git checkout main && git pull
> git checkout -b assignment-3.3
> npm install @prisma/client
> npm install -D prisma
> npx prisma init
> ```

**Redis stays as in 3.2.** Only the **users** persistence layer moves from hand-written `pg` SQL to Prisma. Auth tokens still go through `src/redis.js`.

---

## 0. Concepts (read first)

### 0.1 Three ways to talk to SQL

| Approach | Example | You write | Trade-off |
|----------|---------|-----------|-----------|
| **Raw SQL** | `pg` + `pool.query` (Topic 3.1) | Every statement | Full control; more boilerplate; easy to drift from schema |
| **Query builder** | Knex, Kysely, Drizzle | JS chain → SQL | Composable, still close to SQL |
| **ORM** | **Prisma**, TypeORM, Sequelize | Models + high-level API | Productivity + types; must learn escape hatches for hard queries |

```mermaid
flowchart LR
    S["UsersService"] --> R["UsersRepository"]
    R -->|"3.1"| PG1["pg SQL strings"]
    R -->|"3.3"| PR["Prisma Client"]
    PR --> PG2[("PostgreSQL")]
    PG1 --> PG2
    style PR fill:#2D3748,color:#fff
```

### 0.2 What Prisma gives you

1. **`schema.prisma`** — single source of truth for models  
2. **`prisma migrate`** — versioned SQL migrations generated from schema diffs  
3. **`PrismaClient`** — type-safe `findUnique`, `create`, `update`, …  
4. **`prisma db pull` / Studio** — introspect and browse data  

### 0.3 Schema design checklist (Milestone 3)

| Question | For `User` |
|----------|------------|
| Primary key? | `uuid` (`@id @default(uuid())`) |
| Unique business keys? | `email`, optional `githubId` |
| Required vs optional? | names/email/role required; phone/DOB/address/github optional |
| Soft delete? | Not yet — hard `delete` |
| Indexes for list filters? | `role`, `createdAt` |

### 0.4 Other ORMs (awareness)

| Tool | Style | Notes |
|------|-------|-------|
| **Prisma** | Schema-first declarative | What we use |
| **TypeORM** | Decorators / Data Mapper | Common in NestJS shops |
| **Sequelize** | Mature, callback/Promise | Older Node codebases |
| **Drizzle** | SQL-like TS | Feels like a typed query builder |

---

## Part A: Install Prisma & schema

### A.1 After `npx prisma init`

You get:

```text
prisma/
  schema.prisma
.env          # may duplicate DATABASE_URL — keep one source of truth
```

Point Prisma at the **same** database as 3.1:

```env
DATABASE_URL=postgres://users:users@127.0.0.1:5432/users_api
```

### A.2 `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  customer
  admin
}

model User {
  id           String    @id @default(uuid()) @db.Uuid
  firstName    String    @map("first_name")
  lastName     String    @map("last_name")
  email        String
  phone        String?
  dateOfBirth  DateTime? @map("date_of_birth") @db.Date
  address      String?
  role         Role      @default(customer)
  passwordHash String?   @map("password_hash")
  githubId     String?   @map("github_id")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@unique([email])
  @@unique([githubId])
  @@index([role])
  @@index([createdAt(sort: Desc)])
  @@map("users")
}
```

> 🎯 **Key Concept:** `@map` / `@@map` keep **PostgreSQL snake_case** while your **JavaScript stays camelCase**. The repository mapping helpers from 3.1 can shrink or disappear.

**Email uniqueness:** Prisma `@@unique([email])` is case-sensitive by default. Keep writing `email.toLowerCase()` in the repository/service (as Unit 2 already does) so it matches the 3.1 `lower(email)` behaviour. Optionally add a raw SQL partial/expression index later as a bonus.

**Existing 3.1 table:** If `users` already exists, either:

1. **Baseline:** `npx prisma db pull` then `prisma migrate diff` / baseline migration, or  
2. **Dev reset (simplest for class):** wipe and re-migrate (see Part B).

---

## Part B: Migrations

### B.1 Dev workflow

```bash
docker compose up -d

# Create a migration from schema.prisma and apply it
npx prisma migrate dev --name init_users

# Generate PrismaClient (also runs after migrate dev)
npx prisma generate
```

This creates something like:

```text
prisma/migrations/20251115_init_users/migration.sql
```

### B.2 If you already applied `sql/001_create_users.sql`

**Option A — clean lab database (recommended for students):**

```bash
docker compose down -v
docker compose up -d
# remove or stop using npm run db:migrate (hand runner)
npx prisma migrate dev --name init_users
```

**Option B — baseline production-like DB:** mark the existing schema as already migrated (instructor demo). Prefer Option A in class.

### B.3 Scripts in `package.json`

```json
{
  "scripts": {
    "db:up": "docker compose up -d",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}
```

- **`migrate dev`** — local development (creates migrations)  
- **`migrate deploy`** — CI / production (applies existing migrations only)

Browse data:

```bash
npm run db:studio
```

---

## Part C: Prisma UsersRepository

### C.1 `src/db/prisma.js`

```js
import { PrismaClient } from '@prisma/client';

/** One PrismaClient per process (connection pooling is inside the engine). */
export function createPrisma() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}
```

### C.2 `src/repositories/users.repository.js` (replace `pg` version)

```js
import { Prisma } from '@prisma/client';
import { conflict } from '../utils/http-error.js';

function mapUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth
      ? user.dateOfBirth.toISOString().slice(0, 10)
      : null,
    address: user.address,
    role: user.role,
    passwordHash: user.passwordHash,
    githubId: user.githubId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export class UsersRepository {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(data) {
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone ?? null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          address: data.address ?? null,
          role: data.role,
          passwordHash: data.passwordHash ?? null,
          githubId: data.githubId ?? null,
        },
      });
      return mapUser(user);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw conflict('Email is already registered');
      }
      throw err;
    }
  }

  async findById(id) {
    return mapUser(await this.prisma.user.findUnique({ where: { id } }));
  }

  async findByEmail(email) {
    return mapUser(
      await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
    );
  }

  async findByGithubId(githubId) {
    return mapUser(
      await this.prisma.user.findFirst({ where: { githubId } }),
    );
  }

  async findAll() {
    const rows = await this.prisma.user.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    return rows.map(mapUser);
  }

  async update(id, changes) {
    try {
      const data = { ...changes };
      if (data.email) data.email = data.email.toLowerCase();
      if (data.dateOfBirth !== undefined) {
        data.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
      }
      const user = await this.prisma.user.update({ where: { id }, data });
      return mapUser(user);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw conflict('Email is already registered');
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return null;
      }
      throw err;
    }
  }

  async delete(id) {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return;
      }
      throw err;
    }
  }
}
```

Service code stays the same — still calls `create`, `findByEmail`, etc.

### C.3 Escape hatch: raw SQL when you need it

```js
const rows = await prisma.$queryRaw`
  SELECT role, COUNT(*)::int AS count
  FROM users
  GROUP BY role
`;
```

Use tagged templates (`$queryRaw\`…\``) so values stay parameterised.

---

## Part D: Wire-up & cleanup

### D.1 `container.js`

```js
import { createPrisma } from './db/prisma.js';
import { createRedis } from './redis.js';
import { UsersRepository } from './repositories/users.repository.js';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository.js';

export function createContainer(overrides = {}) {
  const prisma = overrides.prisma ?? createPrisma();
  const redis = overrides.redis ?? createRedis();

  const usersRepository = overrides.usersRepository ?? new UsersRepository(prisma);
  const refreshTokensRepository =
    overrides.refreshTokensRepository ?? new RefreshTokensRepository(redis);

  // …services as before…

  return {
    prisma,
    redis,
    usersRepository,
    refreshTokensRepository,
    // …
  };
}
```

You can **remove** `createPool` from the production path. Keep `pg` only if something else still needs it; otherwise uninstall later.

### D.2 `server.js`

```js
const container = createContainer();
// Prisma Migrate is applied via CLI (`npm run db:migrate`), not on every boot.
// For local DX you may still call migrate deploy here — prefer CLI in production.

const server = app.listen(env.port, () => {
  console.log(`listening on :${env.port}`);
});

async function shutdown() {
  server.close();
  await container.prisma.$disconnect();
  await container.redis.quit();
  process.exit(0);
}
```

### D.3 Retire the hand migration runner

| Keep | Stop using for users |
|------|----------------------|
| `docker-compose.yml` | `sql/001_create_users.sql` as source of truth |
| `src/redis.js` + Redis refresh repo | `src/db/pool.js` + `src/db/migrate.js` (optional delete) |
| Prisma migrations | Custom `schema_migrations` table from 3.1 |

Document in your PR: “Users schema now owned by Prisma Migrate; tokens still in Redis.”

### D.4 Smoke test

```bash
docker compose up -d
npx prisma migrate deploy
npm run dev

curl -s -X POST http://127.0.0.1:3000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"firstName":"Ram","lastName":"Thapa","email":"ram@example.com","password":"Secret123!"}' | jq

npm run db:studio   # confirm row
docker compose exec redis redis-cli KEYS 'refresh:*'   # still empty until login
```

Login/logout from 3.2 must still work unchanged.

```bash
git add .
git commit -m "refactor(db): manage users with Prisma Migrate; keep Redis for auth tokens"
git push -u origin assignment-3.3
```

Merge after submitting.

---

## Part E: Tests

| Layer | Strategy |
|-------|----------|
| Unit | Fake `UsersRepository` (unchanged) |
| Integration | `TEST_DATABASE_URL` + `prisma migrate deploy` against `users_api_test` |
| Redis | Same as 3.2 |

```js
// tests/setup/prisma.js
import { execSync } from 'node:child_process';
import { createPrisma } from '../../src/db/prisma.js';

export async function resetTestDb() {
  const url = process.env.TEST_DATABASE_URL
    ?? 'postgres://users:users@127.0.0.1:5432/users_api_test';
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
  const prisma = createPrisma();
  // PrismaClient reads DATABASE_URL from env — set it before createPrisma, or use datasources override:
  // new PrismaClient({ datasources: { db: { url } } })
  await prisma.user.deleteMany();
  return prisma;
}
```

Prefer:

```js
const prisma = new PrismaClient({ datasources: { db: { url } } });
```

```bash
npm test
```

---

## 📤 What to submit

1. **Pull Request** (`assignment-3.3` → `main`).
2. **Screenshots:**
   - `prisma/schema.prisma` and a migration SQL file
   - `npx prisma migrate dev` / Studio showing a user
   - Login + logout still working (Redis keys)
3. **Short answers** (3–5 sentences each):
   1. What problem does an ORM solve compared with the 3.1 `pg` repository? What problem can it *create*?
   2. Why do we still use Redis for refresh tokens instead of a Prisma `RefreshToken` model?
   3. Difference between `prisma migrate dev` and `prisma migrate deploy`?

## 🧮 Marking (10 marks)

| Criteria | Marks |
|----------|:-----:|
| `schema.prisma` maps correctly to `users` (types, `@map`, role enum) | 3 |
| Migrate workflow works; hand SQL runner no longer required for users | 2 |
| Prisma `UsersRepository`; services unchanged; Redis tokens unchanged | 3 |
| Tests / smoke proof; short answers | 2 |

### ⭐ Bonus (+2, choose one)

- Add a `Session` model in Prisma **and** explain in comments why you would **not** use it for refresh tokens in this course (contrast with Redis TTLs).  
- Use `prisma.$transaction` to create a user and an `AuditLog` row atomically.  
- Introspect with `db pull` on a throwaway schema and compare generated models to your hand-written one.

---

<div align="center">

⬅️ [Topic 3.2: NoSQL Databases](../3.2%20NoSQL%20Databases/README.md)  ·  **Topic 3.3**  ·  Topics 3.4–3.6 coming next (Distributed Data · API Architectures · Microservices)

</div>
