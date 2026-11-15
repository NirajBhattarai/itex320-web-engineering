# ITEX 320 — Web Engineering

Course material and reference projects for **ITEX 320 Web Engineering**.

## Contents

| Unit | Topic | Link |
|------|-------|------|
| 2 | Backend Engineering & Secure API Design | [Unit 2 folder](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)>) |
| 2.1 | Backend Foundations: **concepts** (web servers & reverse proxies, Node.js event loop, RESTful API design, self-quiz) | [Concepts](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.1 Backend Foundations - Concepts/README.md>) |
| 2.1 | Backend Foundations: **Assignment 2.1**, step-by-step scaffold of the `users-api` (layered Express 5 REST API) | [Assignment 2.1](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.1 Backend Foundations/README.md>) |
| 2.2 | Express Architecture: middleware & dependency injection (Assignment 2.2, extends `users-api`) | [Topic 2.2](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.2 Express Architecture & Middleware/README.md>) |
| 2.3 | Authentication & Authorization: JWT access/refresh tokens, sessions, OAuth 2.0 (GitHub + PKCE), identity providers, RBAC/ABAC (Assignment 2.3) | [Topic 2.3](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.3 Authentication & Authorization/README.md>) |
| 2.4 | File Handling & Media Pipelines: Multer uploads, presigned S3 URLs, Sharp image pipeline (Assignment 2.4) | [Topic 2.4](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.4 File Handling & Media Pipelines/README.md>) |
| 2.5 | Web Security & Hardening: OWASP Top 10, XSS, CSRF, injection, Helmet, CORS, rate limiting, Zod (Assignment 2.5) | [Topic 2.5](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.5 Web Security & Hardening/README.md>) |
| Ref | Reference project: Bookstore, Express 5 API (users + books), Vitest/Supertest tests, React frontend (optional) | [Guide](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/README.md>) · [Practice Lab](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/Practice-Lab.md>) · [Code](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/bookstore>) |
| 3 | Data Persistence and API Integration | [Unit 3 folder](<Unit 3 - Data Persistence and API Integration (12 Hours)>) |
| 3.1 | Relational Databases (SQL): PostgreSQL via Docker Compose, joins/indexes/transactions, `pg` UsersRepository | [Topic 3.1](<Unit 3 - Data Persistence and API Integration (12 Hours)/3.1 Relational Databases - SQL/README.md>) |
| 3.2 | NoSQL Databases: Redis vs MongoDB concepts, `redis.js`, refresh tokens + logout denylist in Redis | [Topic 3.2](<Unit 3 - Data Persistence and API Integration (12 Hours)/3.2 NoSQL Databases/README.md>) |
| 3.3 | ORMs & Query Builders: Prisma schema, migrations, Prisma UsersRepository (Redis tokens unchanged) | [Topic 3.3](<Unit 3 - Data Persistence and API Integration (12 Hours)/3.3 ORMs and Query Builders/README.md>) |
| 3.4 | Distributed Data: CAP theorem, Redis user cache, CQRS-light, domain events | [Topic 3.4](<Unit 3 - Data Persistence and API Integration (12 Hours)/3.4 Distributed Data/README.md>) |
| 3.5 | API Architectures: OpenAPI/Swagger, GraphQL, gRPC sidecar | [Topic 3.5](<Unit 3 - Data Persistence and API Integration (12 Hours)/3.5 API Architectures/README.md>) |

## Run the Bookstore reference project

Requires Node.js 22.12 or newer.

```bash
cd "Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/bookstore"

# Terminal 1: API on http://127.0.0.1:3000
cd backend && npm install && cp .env.example .env && npm run dev

# Terminal 2: UI on http://localhost:5173
cd frontend && npm install && npm run dev

# Tests (from backend/)
npm test
```
