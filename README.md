# ITEX 320 — Web Engineering

Course material and reference projects for **ITEX 320 Web Engineering**.

## Contents

| Unit | Topic | Link |
|------|-------|------|
| 2 | Backend Engineering & Secure API Design | [Unit 2 folder](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)>) |
| 2.1 | Backend Foundations: web servers, reverse proxies, the Node.js event loop, REST design | [Topic 2.1](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.1 Backend Foundations/README.md>) |
| 2.1 D | Bookstore project: Express 5 API (users + books), Vitest/Supertest tests, React frontend | [Step-by-step guide](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.1 Backend Foundations/PartD-Reference-Implementation.md>) · [Code](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.1 Backend Foundations/bookstore>) |
| 2.2 | Express Architecture: middleware & dependency injection (Assignment 2.2, extends `users-api`) | [Topic 2.2](<Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.2 Express Architecture & Middleware/README.md>) |

## Run the Bookstore

Requires Node.js 22.12 or newer.

```bash
cd "Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.1 Backend Foundations/bookstore"

# Terminal 1: API on http://127.0.0.1:3000
cd backend && npm install && cp .env.example .env && npm run dev

# Terminal 2: UI on http://localhost:5173
cd frontend && npm install && npm run dev

# Tests (from backend/)
npm test
```
