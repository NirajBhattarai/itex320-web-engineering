# ITEX 320 — Web Engineering

Course material and reference projects for **ITEX 320 Web Engineering**.

## Contents

| Unit | Topic | Link |
|------|-------|------|
| 1 | Modern Frontend Engineering and Web Fundamentals | [Unit 1 folder](<Unit 1 - Modern Frontend Engineering and Web Fundamentals (8 Hours)>) |
| 1.1 | Advanced JavaScript (ES6+): ESM vs CJS, classes, closures, async/await, event loop, `js-fundamentals` lab | [Topic 1.1](<Unit 1 - Modern Frontend Engineering and Web Fundamentals (8 Hours)/1.1 Advanced JavaScript/README.md>) |
| 1.2 | UI Frameworks (React): components, hooks, Context, routing, SSR/SSG, Vite + React 19 `frontend-lab` | [Topic 1.2](<Unit 1 - Modern Frontend Engineering and Web Fundamentals (8 Hours)/1.2 UI Frameworks - React/README.md>) |
| 1.3 | Styling Systems: Grid, Flexbox, Tailwind v4, design tokens and design systems | [Topic 1.3](<Unit 1 - Modern Frontend Engineering and Web Fundamentals (8 Hours)/1.3 Styling Systems/README.md>) |
| 1.4 | State Management: TanStack Query, Redux Toolkit vs Zustand, server vs client state | [Topic 1.4](<Unit 1 - Modern Frontend Engineering and Web Fundamentals (8 Hours)/1.4 State Management/README.md>) |
| 1.5 | Build Tools: Vite, Webpack concepts, code splitting, bundle analysis | [Topic 1.5](<Unit 1 - Modern Frontend Engineering and Web Fundamentals (8 Hours)/1.5 Build Tools/README.md>) |
| 1.6 | Web Performance: critical render path, caching layers, Lighthouse before/after | [Topic 1.6](<Unit 1 - Modern Frontend Engineering and Web Fundamentals (8 Hours)/1.6 Web Performance/README.md>) |
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
| 3.6 | Microservices: RabbitMQ events, worker consumer, Kafka concepts, Nginx API gateway | [Topic 3.6](<Unit 3 - Data Persistence and API Integration (12 Hours)/3.6 Microservices/README.md>) |
| 4 | Professional Deployment and Next-Gen Web | [Unit 4 folder](<Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)>) |
| 4.1 | Infrastructure & Cloud: Docker multi-stage, Compose, Kubernetes fundamentals | [Topic 4.1](<Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)/4.1 Infrastructure and Cloud/README.md>) |
| 4.2 | CI/CD: GitHub Actions, image build/push, Terraform basics | [Topic 4.2](<Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)/4.2 CI-CD Pipelines/README.md>) |
| 4.3 | Monitoring & Observability: logs, Prometheus/Grafana, Sentry | [Topic 4.3](<Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)/4.3 Monitoring and Observability/README.md>) |
| 4.4 | Deployment Strategies: rolling, canary, blue/green, scaling | [Topic 4.4](<Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)/4.4 Deployment Strategies/README.md>) |
| 4.5 | PWA Fundamentals: manifest, service worker, offline | [Topic 4.5](<Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)/4.5 PWA Fundamentals/README.md>) |
| 4.6 | Modern Trends: Edge, WebAssembly, WebSockets | [Topic 4.6](<Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)/4.6 Modern Trends/README.md>) |
| 11 | Tools, Technologies, and Testing WebApps | [Unit 11 folder](<Unit 11 - Tools Technologies and Testing WebApps (7 Hours)>) |
| 11.1 | Developer Tooling: Git, ESLint/Prettier, npm scripts, browser DevTools | [Topic 11.1](<Unit 11 - Tools Technologies and Testing WebApps (7 Hours)/11.1 Developer Tooling/README.md>) |
| 11.2 | Unit Testing: Vitest, AAA, mocks, coverage gates | [Topic 11.2](<Unit 11 - Tools Technologies and Testing WebApps (7 Hours)/11.2 Unit Testing/README.md>) |
| 11.3 | API & Component Testing: Supertest, React Testing Library, MSW | [Topic 11.3](<Unit 11 - Tools Technologies and Testing WebApps (7 Hours)/11.3 API and Component Testing/README.md>) |
| 11.4 | End-to-End Testing: Playwright smoke suite, fixtures, CI notes | [Topic 11.4](<Unit 11 - Tools Technologies and Testing WebApps (7 Hours)/11.4 End-to-End Testing/README.md>) |

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
