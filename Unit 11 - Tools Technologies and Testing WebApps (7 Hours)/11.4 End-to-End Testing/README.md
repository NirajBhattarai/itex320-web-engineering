<div align="center">

![Header](https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=80)

# 🎭 Topic 11.4 — End-to-End Testing

### Playwright (preferred) vs Cypress · Selectors · Fixtures · Traces · CI notes

### Assignment 11.4: write a Playwright smoke suite for the Bookstore stack (API + React UI) and document how to run it

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_11-Topic_11.4-0ea5e9?style=for-the-badge)

![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![Cypress](https://img.shields.io/badge/Cypress-compare-17202C?style=flat-square&logo=cypress&logoColor=white)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | What E2E is for; Playwright vs Cypress |
| [A](#part-a-install-and-configure) | `e2e/` project and `playwright.config.js` (starts both servers) |
| [B](#part-b-selectors-that-do-not-break) | Locator priority |
| [C](#part-c-fixtures-and-the-happy-path) | Custom fixtures, books + users smoke tests |
| [D](#part-d-debugging-and-traces) | UI mode, trace viewer, codegen |
| [E](#part-e-ci-notes) | GitHub Actions, flakiness rules |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** the [Bookstore reference](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/README.md>) runs (`backend/` on `:3000`, `frontend/` on `:5173`) and 11.2–11.3 are done. The Bookstore API shares the `users` routes you built in [Assignment 2.1](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.1 Backend Foundations/README.md>), so the user journeys below also describe `users-api`.
>
> ```bash
> cd "…/Reference Project - Bookstore/bookstore"
> git checkout -b assignment-11.4
> mkdir -p e2e/tests && cd e2e && npm init -y
> ```

---

## 0. Concepts (read first)

E2E tests drive a **real browser** against the **real running stack**. They are the top of the [test pyramid](<../11.2%20Unit%20Testing/README.md>): slow and few, so cover only **critical user journeys** (smoke tests): *can a user load the app, create something, and see it?* Edge cases belong in unit/API tests.

| | **Playwright** (preferred) | **Cypress** |
|---|---|---|
| Browsers | Chromium, Firefox, WebKit | Chromium family, Firefox (WebKit experimental) |
| Runs | Outside the browser (Node → CDP/protocol) | Inside the browser |
| Parallelism | Built in, free | Free locally; parallel *cloud* is paid |
| Multi-tab / multi-origin | Yes | Limited |
| API testing | `request` fixture built in | `cy.request` |
| Auto-wait | Yes, on every action and `expect` | Yes, via retry-ability |
| Debugging | Trace viewer, UI mode, codegen | Time-travel runner (great DX) |
| Why we pick it | Speed, cross-browser, one config for UI + API | Gentle learning curve; still very popular |

---

## Part A: Install and configure

```bash
cd e2e
npm pkg set type=module scripts.test="playwright test" scripts.test:ui="playwright test --ui"
npm i -D @playwright/test
npx playwright install chromium     # downloads the browser (once)
```

### A.1 `e2e/playwright.config.js`

`webServer` starts (or reuses) both servers, so `npm test` is one command. Paths are relative to this file.

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,          // fail CI if someone left test.only
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',    // UI; /api is proxied to :3000 by Vite
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm start',
      cwd: '../backend',
      url: 'http://127.0.0.1:3000/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      cwd: '../frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

Add `e2e/node_modules/`, `e2e/test-results/`, `e2e/playwright-report/` to `.gitignore`. Install `backend/` and `frontend/` dependencies first.

---

## Part B: Selectors that do not break

Prefer what users and assistive tech see. Use the **first** option that works:

| Priority | Locator | Example |
|:--:|---------|---------|
| 1 | Role + name | `page.getByRole('button', { name: 'Create book' })` |
| 2 | Label | `page.getByLabel('email', { exact: true })` |
| 3 | Placeholder / text | `page.getByPlaceholder(/search title/i)` |
| 4 | Test id (add `data-testid`) | `page.getByTestId('user-card')` |
| ✗ | CSS / XPath tied to layout | `div > table tr:nth-child(3) .btn` |

Always pass `{ exact: true }` to `getByLabel` when one label is a substring of another. Scope with **chaining**: `page.getByRole('row', { name: /sita@/ }).getByRole('button', { name: 'Delete' })`.

> ⚠️ Never `page.waitForTimeout(2000)`. Playwright auto-waits for elements to be visible and enabled; web-first assertions (`await expect(locator).toBeVisible()`) retry until they pass or time out.

---

## Part C: Fixtures and the happy path

### C.1 `e2e/tests/fixtures.js`: unique data per test

Parallel tests and repeated runs must not share data. A **fixture** is reusable, per-test setup:

```js
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  newUser: async ({}, use, testInfo) => {
    const id = `${testInfo.workerIndex}-${Date.now()}`;
    await use({
      firstName: 'Test',
      lastName: `Student${id}`,
      email: `e2e-${id}@example.com`,
      password: 'Secret123',
      street: 'Lakeside Road 5',
      city: 'Pokhara',
      country: 'Nepal',
    });
  },
});

export { expect };
```

### C.2 `e2e/tests/users.spec.js`: register through the UI

```js
import { expect, test } from './fixtures.js';

test('register a user through the UI and see the details card', async ({ page, newUser }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Users' }).click();

  for (const [label, value] of Object.entries(newUser)) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await page.getByRole('button', { name: 'Create user' }).click();

  // Search by the unique e-mail: the new user may not be on page 1 of the list.
  await page.getByPlaceholder(/search name or email/i).fill(newUser.email);
  const row = page.getByRole('row', { name: new RegExp(newUser.email) });
  await expect(row).toBeVisible();
  await expect(row.getByText('customer')).toBeVisible();

  await row.click();
  await expect(page.getByText('Lakeside Road 5, Pokhara')).toBeVisible();
});

test('invalid e-mail shows the API error message', async ({ page, newUser }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Users' }).click();

  await page.getByLabel('firstName', { exact: true }).fill(newUser.firstName);
  await page.getByLabel('lastName', { exact: true }).fill(newUser.lastName);
  await page.getByLabel('email', { exact: true }).fill('not-an-email');
  await page.getByLabel('password', { exact: true }).fill(newUser.password);
  await page.getByRole('button', { name: 'Create user' }).click();

  await expect(page.getByRole('alert')).toContainText('must be a valid email address');
});

// The `request` fixture talks HTTP only: no browser, ~50 ms. Use it for fast contract checks.
test('API contract: duplicate e-mail → 409', async ({ request, newUser }) => {
  const body = {
    firstName: newUser.firstName, lastName: newUser.lastName,
    email: newUser.email, password: newUser.password,
  };
  expect((await request.post('/api/v1/users', { data: body })).status()).toBe(201);
  expect((await request.post('/api/v1/users', { data: body })).status()).toBe(409);
});
```

### C.3 `e2e/tests/books.spec.js`: browse, search, create, delete

```js
import { expect, test } from './fixtures.js';

test.describe('Books page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('lists seeded books', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /bookstore/i })).toBeVisible();
    await expect(page.getByRole('cell', { name: /Designing Data-Intensive Applications/ })).toBeVisible();
    await expect(page.getByText('Out of stock')).toBeVisible(); // Learning React has stock 0
  });

  test('search narrows the table', async ({ page }) => {
    await page.getByPlaceholder(/search title or author/i).fill('kubernetes');

    const rows = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Delete' }) });
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Kubernetes: Up and Running');
  });

  test('bad ISBN shows the API message; a valid book can be created and deleted', async ({ page }) => {
    const fill = async (isbn) => {
      await page.getByLabel('title', { exact: true }).fill('E2E Testing Handbook');
      await page.getByLabel('author', { exact: true }).fill('Ada Tester');
      await page.getByLabel('isbn', { exact: true }).fill(isbn);
      await page.getByLabel('publishedYear', { exact: true }).fill('2024');
      await page.getByLabel('price', { exact: true }).fill('19.99');
      await page.getByLabel('stock', { exact: true }).fill('3');
      await page.getByRole('button', { name: 'Create book' }).click();
    };

    await fill('9780134757590'); // wrong checksum
    await expect(page.getByRole('alert')).toContainText('checksum');

    await page.getByLabel('isbn', { exact: true }).fill('9780134757599'); // valid
    await page.getByRole('button', { name: 'Create book' }).click();

    await page.getByPlaceholder(/search title or author/i).fill('E2E Testing');
    const row = page.getByRole('row', { name: /E2E Testing Handbook/ });
    await expect(row).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept()); // the UI uses window.confirm()
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(row).toHaveCount(0); // cleanup: the test leaves no data behind
  });
});
```

```bash
cd e2e && npm test                 # starts both servers if they are not already running
npx playwright show-report         # open the HTML report
```

**Your task:** the code above is the baseline. Type it in, get it green, then add one journey of your own (e.g. filter users by role, paginate books) and, if you finished [Assignment 2.3](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.3 Authentication & Authorization/README.md>), an API-level register → login → `GET /auth/me` test against your `users-api` using the `request` fixture.

---

## Part D: Debugging and traces

| Command | Use |
|---------|-----|
| `npx playwright test --ui` | Watch mode with timeline, DOM snapshots, locator picker |
| `npx playwright test --headed --debug` | Step through with the Inspector |
| `npx playwright codegen http://localhost:5173` | Click around; Playwright writes locators (then **rewrite them** to Part B style) |
| `npx playwright test --trace on` | Record everything |
| `npx playwright show-trace test-results/…/trace.zip` | Replay: network, console, DOM at every step |
| `npx playwright test -g "search"` | Run tests whose title matches |

---

## Part E: CI notes

`.github/workflows/e2e.yml` (extends [Topic 4.2](<../../Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)/4.2 CI-CD Pipelines/README.md>)):

```yaml
name: e2e
on: [pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: npm, cache-dependency-path: '**/package-lock.json' }
      - run: npm ci
        working-directory: backend
      - run: npm ci
        working-directory: frontend
      - run: npm ci
        working-directory: e2e
      - run: npx playwright install --with-deps chromium
        working-directory: e2e
      - run: npm test
        working-directory: e2e
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 7
```

**Flakiness rules:** independent tests (own data, no order dependence) · no fixed sleeps · stable locators · `retries: 2` only in CI, and *investigate* anything that needs a retry · keep the suite under a few minutes · run E2E on PRs, full browser matrix nightly.

---

## 📤 What to submit

1. PR with `e2e/` (`package.json`, `playwright.config.js`, `tests/*.spec.js`) and `.gitignore` updates
2. `e2e/README.md` (≤ 30 lines): prerequisites, install, run, UI mode, where reports go, how to run one test
3. Screenshots: terminal with all tests green **and** the HTML report (or a trace viewer image of one test)
4. Short answers: Why not cover every validation rule in E2E? Why `getByRole` over CSS selectors? What makes a test flaky, and how did you avoid it? Playwright vs Cypress: one deciding factor each

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| `playwright.config.js` with `webServer`, `baseURL`, trace/report settings; one-command run | 2 |
| ≥ 4 smoke tests covering a happy path (create/search/see result) and one error path | 3 |
| Resilient locators (role/label), no `waitForTimeout`, unique data via a fixture | 2 |
| Tests are independent and clean up after themselves (pass on 3 consecutive runs) | 1 |
| `e2e/README.md` + screenshots | 1 |
| Short answers | 1 |

### ⭐ Bonus (+2)
Add the CI workflow from Part E (green run screenshot), **or** add a second project (`firefox` or `webkit`) and show the suite passing on both.

---

<div align="center">

⬅️ [Topic 11.3](../11.3%20API%20and%20Component%20Testing/README.md)  ·  **Topic 11.4**  ·  [Unit 11 index ➡️](../README.md)

</div>
