# Unit 11 — Tools, Technologies, and Testing WebApps (7 Hours)

Quality and tooling for the full-stack project: lint/format, unit tests, API/component tests, and browser E2E. Builds on `users-api` (Units 2–4), the Unit 1 SPA, and the Bookstore reference.

| Topic | Focus | Assignment |
|-------|--------|------------|
| [11.1 Developer Tooling](./11.1%20Developer%20Tooling/README.md) | Git, ESLint/Prettier, npm scripts, DevTools | Lint + format + pre-commit checklist + DevTools profile |
| [11.2 Unit Testing](./11.2%20Unit%20Testing/README.md) | Test pyramid, Vitest, mocks, coverage | Unit tests for validators / helpers |
| [11.3 API and Component Testing](./11.3%20API%20and%20Component%20Testing/README.md) | Supertest, React Testing Library, MSW | API integration + RTL component tests |
| [11.4 End-to-End Testing](./11.4%20End-to-End%20Testing/README.md) | Playwright, fixtures, CI smoke | Browser smoke suite + runbook |

```text
After Unit 11
├── users-api/
│   ├── eslint + prettier + check scripts
│   ├── tests/unit + tests/integration (Vitest / Supertest)
│   └── coverage gate
├── frontend / Bookstore frontend/
│   ├── *.test.jsx (RTL)
│   └── e2e/ + playwright.config.js
└── docs/PRE-COMMIT.md · E2E.md · DevTools notes
```
