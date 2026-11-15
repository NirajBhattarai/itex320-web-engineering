<div align="center">

![Header](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80)

# 🎭 Topic 11.4 — End-to-End Testing

### Playwright · Selectors · Fixtures · CI smoke suites

### Assignment 11.4: write a Playwright smoke suite (Bookstore or `frontend-lab` + API happy path) and document how to run it

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_11-Topic_11.4-0ea5e9?style=for-the-badge)

![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![CI](https://img.shields.io/badge/CI-smoke_suite-2088FF?style=flat-square&logo=githubactions&logoColor=white)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | E2E vs lower layers; Playwright vs Cypress |
| [A](#part-a-install-playwright) | Install + config in the Bookstore (or `frontend-lab`) |
| [B](#part-b-smoke-specs) | Happy-path specs: open UI, list data, create/edit flow |
| [C](#part-c-fixtures--stability) | Fixtures, `data-testid`, retries, headed vs headless |
| [D](#part-d-ci-notes) | Running in GitHub Actions |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** 11.3 done. Use the [Bookstore](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/bookstore>) (API + React) **or** your Unit 1 `frontend-lab` pointed at a running API.
>
> ```bash
> cd bookstore   # or frontend-lab repo root that can start UI + API
> git checkout -b assignment-11.4
> npm init playwright@latest   # or: cd frontend && npm i -D @playwright/test
> ```

---

## 0. Concepts (read first)

| Layer | Tool (this course) | Proves |
|-------|--------------------|--------|
| Unit | Vitest | Pure functions, validators |
| Integration / component | Supertest, RTL | HTTP contracts, UI pieces |
| **E2E** | **Playwright** | Real browser + real (or test) stack |

**Playwright vs Cypress (short):**

| | Playwright | Cypress |
|---|------------|---------|
| Browsers | Chromium, Firefox, WebKit | Chromium-family focus |
| Parallel / isolation | Strong (browser contexts) | Improving; historically single-tab |
| Language | JS/TS (also Python/etc.) | JS/TS |
| This course | **Preferred** | Fine to mention; not required |

E2E is **slow and flaky** if you over-use it. Keep a **smoke** suite (5–15 minutes max locally): login/list/create happy paths — not every edge case.

---

## Part A: Install Playwright

From the Bookstore `frontend/` (or a monorepo root):

```bash
cd frontend
npm i -D @playwright/test
npx playwright install chromium
```

`playwright.config.js`:

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Optional: auto-start Vite if you do not use a separate terminal
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://127.0.0.1:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});
```

Add scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

Start the **API** (Bookstore backend or `users-api`) on `:3000` and the **UI** on `:5173` before running specs (unless `webServer` is configured).

---

## Part B: Smoke specs

Prefer **accessible** selectors (`getByRole`, `getByLabel`). Add `data-testid` only when the UI has no stable role/name.

`e2e/smoke.spec.js` (Bookstore-shaped example):

```js
import { test, expect } from '@playwright/test';

test.describe('Bookstore smoke', () => {
  test('home loads and shows navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation').or(page.locator('nav'))).toBeVisible();
  });

  test('books page lists or shows empty state', async ({ page }) => {
    await page.goto('/books');
    // Adjust text to match your UI
    await expect(
      page.getByRole('heading', { name: /books/i }).or(page.getByText(/no books/i)),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('users page is reachable', async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: /users/i }).or(page.locator('main'))).toBeVisible();
  });
});
```

If you use **auth** (`users-api` + `frontend-lab`):

```js
test('register → login → see profile stub', async ({ page }) => {
  const email = `e2e_${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('Password1!');
  await page.getByRole('button', { name: /sign up|register/i }).click();
  await expect(page.getByText(/welcome|dashboard|logout/i)).toBeVisible({ timeout: 20_000 });
});
```

Document the exact routes your app uses in `e2e/README.md`.

---

## Part C: Fixtures & stability

### C.1 `data-testid` when needed

```jsx
<button type="submit" data-testid="save-book">Save</button>
```

```js
await page.getByTestId('save-book').click();
```

### C.2 Wait for network, not `sleep`

```js
await Promise.all([
  page.waitForResponse((r) => r.url().includes('/api/books') && r.ok()),
  page.getByRole('button', { name: /refresh|load/i }).click(),
]);
```

### C.3 Isolated storage

Playwright gives a fresh context per test by default — do not share cookies across specs unless you use a fixture intentionally.

```js
// fixtures.js — optional authenticated context
import { test as base } from '@playwright/test';

export const test = base.extend({
  // example placeholder — wire to your login helper
});
```

---

## Part D: CI notes

Minimal GitHub Actions job (concept — align with Assignment 4.2):

```yaml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '22' }
    - run: npm ci
      working-directory: frontend
    - run: npx playwright install chromium --with-deps
      working-directory: frontend
    # start API + UI (compose or background npm) then:
    - run: npm run test:e2e
      working-directory: frontend
      env:
        PLAYWRIGHT_BASE_URL: http://127.0.0.1:5173
        CI: true
```

In `docs/E2E.md` explain: how to start the stack locally, which browsers are installed, and what the smoke suite covers.

---

## 📤 What to submit

1. PR with `playwright.config.js`, `e2e/*.spec.js`, npm scripts, and `docs/E2E.md`
2. Terminal output (or CI log) showing the smoke suite **green**
3. Optional: one failure screenshot from a deliberate broken selector (shows you know the report)
4. Short answers: When is E2E the wrong tool? Why prefer `getByRole` over CSS selectors? One flaky-test mitigation you used

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| Playwright installed + config + scripts | 2 |
| ≥ 3 meaningful smoke tests against running UI | 4 |
| Stable selectors / waits (no arbitrary long sleeps) | 2 |
| `docs/E2E.md` runbook + short answers | 2 |

### ⭐ Bonus (+2)

Add a GitHub Actions workflow that runs the smoke suite on PR (API + UI bootstrapped in CI), or record a short Playwright trace zip for one failing run.

---

<div align="center">

⬅️ [Topic 11.3](../11.3%20API%20and%20Component%20Testing/README.md)  ·  **Topic 11.4**  ·  🎓 End of Unit 11

</div>
