# Unit 11 — Tools, Technologies and Testing WebApps (7 Hours)

Ties the full-stack project together: tooling that keeps code consistent, and tests that prove it works. Everything targets `users-api` (Units 2–4), the React SPA, and the [Bookstore reference project](<../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/README.md>).

| Topic | Focus | Assignment |
|-------|--------|------------|
| [11.1 Developer Tooling](./11.1%20Developer%20Tooling/README.md) | Git workflow, npm scripts, ESLint/oxlint, Prettier, EditorConfig, VS Code, DevTools | Lint + format scripts, pre-commit checklist, DevTools profile |
| [11.2 Unit Testing](./11.2%20Unit%20Testing/README.md) | Test pyramid, Vitest, AAA, mocks/fakes, coverage | Unit tests for validators and hash helpers + coverage gate |
| [11.3 API and Component Testing](./11.3%20API%20and%20Component%20Testing/README.md) | Supertest, React Testing Library, MSW | API integration suite + 2 RTL component suites |
| [11.4 End-to-End Testing](./11.4%20End-to-End%20Testing/README.md) | Playwright vs Cypress, selectors, fixtures, CI | Playwright smoke suite against the local stack |

```text
Test pyramid used in this unit
        ╱ E2E ╲          11.4  Playwright (few, slow, real browser)
       ╱ API / ╲         11.3  Supertest + React Testing Library
      ╱component╲
     ╱───────────╲
    ╱    UNIT     ╲      11.2  Vitest (many, fast)
   ╱───────────────╲
   Tooling around it all: 11.1  lint · format · git · CI
```

```text
After Unit 11
├── eslint.config.js, .prettierrc.json, .editorconfig, docs/PRE-COMMIT.md
├── tests/unit/            (validators, password, query)
├── tests/integration/     (Supertest against createApp(container))
├── frontend/src/**/*.test.jsx   (React Testing Library)
└── e2e/                   (Playwright config + specs)
```

**Prerequisites:** `users-api` from [Assignment 2.2](<../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.2 Express Architecture & Middleware/README.md>) or later (needs `createApp(container)`), Node.js 22.12+. For CI integration see [Topic 4.2](<../Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)/4.2 CI-CD Pipelines/README.md>).
