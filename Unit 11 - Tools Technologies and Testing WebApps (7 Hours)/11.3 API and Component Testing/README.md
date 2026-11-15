<div align="center">

![Header](https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80)

# 🔌 Topic 11.3 — API and Component Testing

### Supertest for Express · React Testing Library for components · MSW (optional)

### Assignment 11.3: integration-test `users-api` with Vitest + Supertest and test two Bookstore React components with RTL

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_11-Topic_11.3-0ea5e9?style=for-the-badge)

![Supertest](https://img.shields.io/badge/Supertest-7.x-0f766e?style=flat-square)
![RTL](https://img.shields.io/badge/Testing_Library-React-E33332?style=flat-square&logo=testinglibrary&logoColor=white)
![MSW](https://img.shields.io/badge/MSW-optional-FF6A33?style=flat-square)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | Integration vs component tests; what to query and why |
| [A](#part-a-api-tests-with-supertest) | `users-api`: Supertest + `createApp(container)` |
| [B](#part-b-more-api-cases) | Pagination, errors, headers (and auth, if 2.3 is done) |
| [C](#part-c-react-testing-library-setup) | Vitest + jsdom + RTL in the Bookstore frontend |
| [D](#part-d-component-tests) | `ErrorMessage`, `Pagination`, `BooksPage` |
| [E](#part-e-msw-optional) | MSW: mock the network, not your code |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** 11.2 done; `users-api` has `createApp(container)` and `createContainer()` ([Assignment 2.2](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.2 Express Architecture & Middleware/README.md>)). Frontend = [Bookstore `frontend/`](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/bookstore/frontend>) (React 19 + Vite).
>
> ```bash
> cd users-api && git checkout -b assignment-11.3
> npm i -D supertest
> mkdir -p tests/integration
> ```

---

## 0. Concepts (read first)

| | **API integration test** | **Component test** |
|---|---|---|
| Real parts | Express app, middleware, validators, services, in-memory repo | React component, hooks, DOM (jsdom) |
| Faked parts | Slow hasher; (Unit 3: DB via test container) | The network (`api/client.js` or `fetch`) |
| Tool | Supertest — calls `app` directly, **no port opened** | React Testing Library + `user-event` |
| Asserts | Status, headers, JSON body | What the **user sees/does** |

**RTL principle:** *"The more your tests resemble the way your software is used, the more confidence they give you."* Query like a user, in this order: `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (last resort). Never assert on state or class names.

---

## Part A: API tests with Supertest

`createApp(container)` does not call `listen()`; Supertest passes the app to its own ephemeral server. A **fresh container per test** = a fresh empty store, so tests cannot affect each other.

### A.1 `tests/fixtures.js`

```js
export const validUser = (overrides = {}) => ({
  firstName: 'Sita',
  lastName: 'Gurung',
  email: 'sita@example.com',
  password: 'Secret123',
  address: { street: 'Lakeside Road 5', city: 'Pokhara', country: 'Nepal' },
  ...overrides,
});
```

### A.2 `tests/integration/users.api.test.js`

```js
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/container.js';
import { validUser } from '../fixtures.js';

const USERS = '/api/v1/users';

describe('POST /api/v1/users', () => {
  let app;

  beforeEach(() => {
    // fast fake hasher via DI; swap for the real one in a single "real scrypt" test
    app = createApp(createContainer({ hashPassword: async (p) => `fake:${p}` }));
  });

  it('201 + Location, and the password is never returned', async () => {
    const res = await request(app).post(USERS).send(validUser()).expect(201);

    expect(res.headers.location).toBe(`${USERS}/${res.body.data.id}`);
    expect(res.body.data).toMatchObject({ email: 'sita@example.com', role: 'customer' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('400 when a client tries to choose its own role', async () => {
    const res = await request(app).post(USERS).send(validUser({ role: 'admin' }));
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([{ field: 'role', message: 'is not allowed' }]);
  });

  it.each([
    ['email', { email: 'not-an-email' }, 'must be a valid email address'],
    ['password', { password: 'short' }, 'must be 8-72 characters long'],
    ['dateOfBirth', { dateOfBirth: '2999-01-01' }, 'must be in the past'],
  ])('400 for an invalid %s', async (field, override, message) => {
    const res = await request(app).post(USERS).send(validUser(override));
    expect(res.status).toBe(400);
    expect(res.body.errors).toContainEqual({ field, message });
  });

  it('409 for a duplicate email, case-insensitive', async () => {
    await request(app).post(USERS).send(validUser()).expect(201);
    await request(app).post(USERS).send(validUser({ email: 'SITA@Example.com' })).expect(409);
  });
});
```

```bash
npm run test:integration   # npm pkg set scripts.test:integration="vitest run tests/integration"
```

---

## Part B: More API cases

```js
describe('GET /api/v1/users', () => {
  it('paginates and reports meta', async () => {
    const app = createApp(createContainer({ hashPassword: async (p) => p }));
    for (const n of [1, 2, 3]) {
      await request(app).post(USERS).send(validUser({ email: `u${n}@example.com` }));
    }

    const res = await request(app).get(`${USERS}?limit=2&page=2`).expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('400 for a sort field that is not whitelisted', async () => {
    const app = createApp(createContainer());
    await request(app).get(`${USERS}?sort=passwordHash`).expect(400);
  });
});

describe('cross-cutting behaviour', () => {
  const app = createApp(createContainer());

  it('unknown id → 404 Problem Details with a requestId', async () => {
    const res = await request(app).get(`${USERS}/3f1c2a3e-8c0d-4d7e-9a43-5d6b7a1c9e10`);
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({ title: 'Not Found', status: 404 });
    expect(res.body.requestId).toEqual(expect.any(String));
  });

  it('echoes X-Request-Id and hides X-Powered-By', async () => {
    const res = await request(app).get('/health').set('X-Request-Id', 'abc-123');
    expect(res.headers['x-request-id']).toBe('abc-123');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('malformed JSON → 400, not 500', async () => {
    const res = await request(app).post(USERS).set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });
});
```

**If you finished [Assignment 2.3](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.3 Authentication & Authorization/README.md>)**, add a protected-route test. `request.agent(app)` keeps cookies (refresh token) between calls:

```js
it('GET /auth/me needs a Bearer token', async () => {
  await request(app).get('/api/v1/auth/me').expect(401);

  const reg = await request(app).post('/api/v1/auth/register').send(validUser()).expect(201);
  const token = reg.body.data.accessToken;

  const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
  expect(me.body.data.email).toBe('sita@example.com');
});
```

> 💡 Always test the **sad paths** (400, 401, 403, 404, 409). Happy paths are the ones you already manually tried.

---

## Part C: React Testing Library setup

```bash
cd bookstore/frontend   # (or your Unit 1 SPA)
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm pkg set scripts.test="vitest run" scripts.test:watch="vitest"
```

### C.1 `vite.config.js` — add a `test` block

```js
export default defineConfig({
  plugins: [react()],
  server: { /* ...unchanged proxy... */ },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
});
```

### C.2 `src/test/setup.js`

```js
import '@testing-library/jest-dom/vitest'; // adds toBeInTheDocument, toBeDisabled, ...
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest globals are off, so RTL cannot auto-register cleanup. Do it explicitly.
afterEach(cleanup);
```

---

## Part D: Component tests

### D.1 Pure props → `src/components/Pagination.test.jsx`

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Pagination from './Pagination.jsx';

const meta = (page) => ({ page, totalPages: 3, total: 11 });

describe('<Pagination />', () => {
  it('renders nothing without meta', () => {
    const { container } = render(<Pagination meta={null} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables Prev on the first page', () => {
    render(<Pagination meta={meta(1)} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
  });

  it('asks for the next page when Next is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination meta={meta(1)} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(2);
  });
});
```

### D.2 `ErrorMessage.test.jsx`

```jsx
it('lists every field-level validation error', () => {
  const error = { message: 'Validation failed', errors: [{ field: 'email', message: 'must be a valid email address' }] };
  render(<ErrorMessage error={error} />);

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('Validation failed');
  expect(within(alert).getByText('email')).toBeInTheDocument();
});
```

(`within` is imported from `@testing-library/react`.)

### D.3 A component that fetches → mock the API module

`BooksPage` calls `api.listBooks` and `api.createBook`. Replace the module; test what the user sees.

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client.js';
import BooksPage from './BooksPage.jsx';

vi.mock('../api/client.js', () => ({ api: { listBooks: vi.fn(), createBook: vi.fn() } }));

const book = { id: '1', title: 'Learning React', author: 'A. Banks', isbn: '9781492051725',
  publishedYear: 2020, genre: 'programming', price: 34, stock: 0 };

describe('<BooksPage />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listBooks.mockResolvedValue({ data: [book], meta: { page: 1, limit: 5, total: 1, totalPages: 1 } });
  });

  it('shows books from the API, including "Out of stock"', async () => {
    render(<BooksPage />);
    expect(await screen.findByText('Learning React')).toBeInTheDocument(); // findBy* waits
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByText('$34.00')).toBeInTheDocument();
  });

  it('re-queries the API when the user searches', async () => {
    render(<BooksPage />);
    await userEvent.type(screen.getByPlaceholderText(/search title or author/i), 'react');

    await waitFor(() =>
      expect(api.listBooks).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'react', page: 1 })),
    );
  });

  it('shows the API validation errors when creating fails', async () => {
    api.createBook.mockRejectedValue(Object.assign(new Error('Validation failed'),
      { errors: [{ field: 'isbn', message: 'has an invalid ISBN-13 checksum' }] }));
    render(<BooksPage />);

    await userEvent.type(screen.getByLabelText('title'), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Create book' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Validation failed');
  });
});
```

Delete uses `window.confirm`, which jsdom does not implement: `vi.spyOn(window, 'confirm').mockReturnValue(true)`.

---

## Part E: MSW (optional)

`vi.mock` skips your `client.js` entirely. **MSW** intercepts at the network layer, so `client.js` (headers, `ApiError`, `204`) is exercised too.

```bash
npm i -D msw
```

```js
// src/test/server.js
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer(
  http.get('http://localhost/api/v1/books', () =>
    HttpResponse.json({ data: [], meta: { page: 1, limit: 5, total: 0, totalPages: 1 } })),
);
```

```js
// add to src/test/setup.js
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { server } from './server.js';

// Node's fetch needs absolute URLs; client.js uses '/api/v1'. Prefix the origin in tests.
const realFetch = globalThis.fetch;
vi.stubGlobal('fetch', (url, init) => realFetch(new URL(url, 'http://localhost'), init));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Override per test: `server.use(http.get('http://localhost/api/v1/books', () => HttpResponse.json({ title: 'Boom', status: 500 }, { status: 500 })))`.

---

## 📤 What to submit

1. PR(s): `users-api` (`tests/integration/**`, `tests/fixtures.js`) and frontend (`vite.config.js`, `src/test/setup.js`, `*.test.jsx`)
2. Screenshots: `npm test` green in **both** projects
3. Minimum: **≥ 8** API tests (≥ 4 sad-path) and **≥ 2** components with **≥ 2** tests each
4. Short answers: Why does Supertest not need a port? Why `getByRole` over `getByTestId`? Mock the module vs MSW: one trade-off each?

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| Supertest suite: create, validation (table-driven), duplicate, 404 | 3 |
| Extra API cases: pagination/meta, headers, malformed JSON (or auth) | 2 |
| RTL setup works (`jsdom`, `jest-dom`, cleanup) | 1 |
| Two components tested via user-visible behaviour | 3 |
| Screenshots / short answers | 1 |

### ⭐ Bonus (+2)
Add the MSW setup (Part E) and rewrite one `BooksPage` test to use it instead of `vi.mock`.

---

<div align="center">

⬅️ [Topic 11.2](../11.2%20Unit%20Testing/README.md)  ·  **Topic 11.3**  ·  [Topic 11.4 ➡️](../11.4%20End-to-End%20Testing/README.md)

</div>
