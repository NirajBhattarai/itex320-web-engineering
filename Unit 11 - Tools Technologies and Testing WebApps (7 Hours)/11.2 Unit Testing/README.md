<div align="center">

![Header](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80)

# 🧪 Topic 11.2 — Unit Testing with Vitest

### Test pyramid · Vitest setup · Arrange-Act-Assert · Mocks & fakes · Coverage

### Assignment 11.2: write unit tests for `users-api` validators, hash helpers and query utils, with a coverage gate

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_11-Topic_11.2-0ea5e9?style=for-the-badge)

![Vitest](https://img.shields.io/badge/Vitest-4.x-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Coverage](https://img.shields.io/badge/Coverage-v8-3178C6?style=flat-square)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | Test pyramid, what makes a good unit test |
| [A](#part-a-vitest-setup) | Install, config, scripts |
| [B](#part-b-validators-table-driven-tests) | Pure functions: `rules.js` with `it.each` |
| [C](#part-c-hash-helpers) | `password.js`: properties, not exact values |
| [D](#part-d-mocks-fakes-and-fake-timers) | `vi.fn`, fakes, `vi.useFakeTimers` |
| [E](#part-e-coverage) | Coverage report and thresholds |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** `users-api` with the 2.2 layout (`createContainer`, `src/validators/rules.js`, `src/utils/password.js`). The finished version of these tests lives in the [Bookstore reference](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/bookstore/backend/tests/unit>). **Write yours first, compare after.**
>
> ```bash
> cd users-api
> git checkout -b assignment-11.2
> mkdir -p tests/unit/{validators,utils}
> ```

---

## 0. Concepts (read first)

```text
          ▲  few, slow, brittle      ┌────────────────────────────┐
         ╱E2E╲   Playwright (11.4)   │ Cost per test goes UP      │
        ╱─────╲                      │ Confidence per test goes UP│
       ╱  API  ╲  Supertest, RTL     │ Number of tests goes DOWN  │
      ╱ & comp. ╲ (11.3)             └────────────────────────────┘
     ╱───────────╲
    ╱    UNIT     ╲  Vitest — this topic: many, fast (ms), no I/O
   ╱───────────────╲
```

| Test double | What it is | Example in `users-api` |
|-------------|-----------|------------------------|
| **Stub** | Returns canned answers | `hash: async () => 'x'` |
| **Mock** | Stub that *records calls*, so you can assert on them | `vi.fn()` + `toHaveBeenCalledWith` |
| **Fake** | A working, simplified implementation | `UsersRepository` (in-memory) instead of PostgreSQL |
| **Spy** | Wraps the real thing and records calls | `vi.spyOn(console, 'error')` |

A good unit test is **F.I.R.S.T.**: Fast, Independent (no shared state), Repeatable (no clock/random/network surprises), Self-checking, Timely. Structure every test as **Arrange → Act → Assert** and test **behaviour**, not implementation details.

---

## Part A: Vitest setup

```bash
npm i -D vitest @vitest/coverage-v8
npm pkg set scripts.test="vitest run"
npm pkg set scripts.test:watch="vitest"
npm pkg set scripts.test:coverage="vitest run --coverage"
```

### A.1 `vitest.config.js`

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

### A.2 First test (`tests/unit/smoke.test.js`)

```js
import { describe, expect, it } from 'vitest';

describe('toolchain', () => {
  it('runs ESM tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

```bash
npm test            # one run (CI)
npm run test:watch  # re-runs affected tests on save (development)
```

Delete the smoke test once real tests exist.

---

## Part B: Validators (table-driven tests)

Validators in `rules.js` are **pure functions**: `check(value)` returns `null` (valid) or an error message. They are the best unit-test target: no setup, no mocks.

### B.1 `tests/unit/validators/rules.test.js`

```js
import { describe, expect, it } from 'vitest';
import { email, object, password, string } from '../../../src/validators/rules.js';

describe('string()', () => {
  const check = string({ min: 2, max: 5 }); // Arrange once, reuse

  it('accepts a string within the limits', () => {
    expect(check('abc')).toBeNull();
  });

  it.each([
    [123, 'must be a string'],
    ['a', 'must be at least 2 characters'],
    ['abcdef', 'must be at most 5 characters'],
    ['   a   ', 'must be at least 2 characters'], // trimmed before measuring
  ])('rejects %j → "%s"', (value, message) => {
    expect(check(value)).toBe(message);
  });
});

describe('email()', () => {
  it.each(['a@b.co', 'first.last@uni.edu.np'])('accepts %s', (value) => {
    expect(email()(value)).toBeNull();
  });

  it.each(['plainaddress', 'a@b', 'a b@c.com', '@c.com'])('rejects %s', (value) => {
    expect(email()(value)).toBe('must be a valid email address');
  });
});

describe('password()', () => {
  it('requires 8-72 characters with a letter and a digit', () => {
    expect(password()('Secret123')).toBeNull();
    expect(password()('short1')).toBe('must be 8-72 characters long');
    expect(password()('onlyletters')).toMatch(/letter and one digit/);
  });

  it('accepts the boundaries (8 and 72 chars) and rejects 73', () => {
    expect(password()('a1'.repeat(4))).toBeNull();
    expect(password()('a1'.repeat(36))).toBeNull();
    expect(password()(`${'a1'.repeat(36)}x`)).not.toBeNull();
  });
});
```

> 💡 **Boundary testing:** most bugs live at the edges — min, max, min−1, max+1, empty, `null`, wrong type. Write the edge cases first.

Add the same style of tests for `object()` and `pastDate()` (Part D), and `phone()` if your version has it. Assert `null` for valid input and a **specific** message for each invalid class.

---

## Part C: Hash helpers

You cannot assert the exact output of `hashPassword` (random salt). Test **properties**:

### C.1 `tests/unit/utils/password.test.js`

```js
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../../src/utils/password.js';

describe('password hashing', () => {
  it('never contains the plain password and has the scrypt format', async () => {
    const hash = await hashPassword('Secret123');
    expect(hash).not.toContain('Secret123');
    expect(hash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  });

  it('is salted: same input, different hashes', async () => {
    expect(await hashPassword('Secret123')).not.toBe(await hashPassword('Secret123'));
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('Secret123');
    expect(await verifyPassword('Secret123', hash)).toBe(true);
    expect(await verifyPassword('secret123', hash)).toBe(false);
  });

  it.each(['', 'plain', 'md5$aa$bb', 'scrypt$onlysalt'])('rejects malformed stored value %j', async (stored) => {
    expect(await verifyPassword('Secret123', stored)).toBe(false);
  });
});
```

scrypt is deliberately slow (tens of ms). A few real hashes in unit tests are fine; a *service* test that creates 50 users should inject a fake hasher (Part D).

---

## Part D: Mocks, fakes and fake timers

### D.1 Mock the hasher (dependency injection pays off)

```js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersRepository } from '../../../src/repositories/users.repository.js';
import { UsersService } from '../../../src/services/users.service.js';

describe('UsersService.create()', () => {
  let repository, fakeHash, service;

  beforeEach(() => {
    repository = new UsersRepository(); // a FAKE: real logic, in memory
    fakeHash = vi.fn(async (plain) => `hashed:${plain}`); // a MOCK: records calls
    service = new UsersService(repository, { hash: fakeHash });
  });

  it('hashes the password once and never returns the hash', async () => {
    // Arrange
    const input = { firstName: 'Sita', lastName: 'Gurung', email: 'sita@example.com', password: 'Secret123' };
    // Act
    const user = await service.create(input);
    // Assert
    expect(fakeHash).toHaveBeenCalledExactlyOnceWith('Secret123');
    expect(user).not.toHaveProperty('passwordHash');
    expect((await repository.findById(user.id)).passwordHash).toBe('hashed:Secret123');
  });
});
```

### D.2 Control time instead of depending on it

`pastDate()` compares against "now". Freeze the clock so the test never rots:

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pastDate } from '../../../src/validators/rules.js';

describe('pastDate()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('accepts yesterday, rejects tomorrow', () => {
    expect(pastDate()('2026-06-14')).toBeNull();
    expect(pastDate()('2026-06-16')).toBe('must be in the past');
  });

  it('rejects impossible dates', () => {
    expect(pastDate()('2001-02-29')).toBe('must be a real calendar date');
  });
});
```

**Do not** mock the thing you are testing, and do not mock what you do not own without a reason (e.g. mocking `crypto` hides real bugs). Prefer fakes for your own collaborators.

---

## Part E: Coverage

```js
// vitest.config.js — add inside `test: { ... }`
coverage: {
  provider: 'v8',
  include: ['src/**/*.js'],
  exclude: ['src/server.js'],            // process entry point, covered by E2E
  reporter: ['text', 'html'],
  thresholds: { lines: 80, statements: 80, functions: 80, branches: 75 }, // run FAILS below these
},
```

```bash
npm run test:coverage
open coverage/index.html     # red lines = code no test executed
```

Add `coverage/` to `.gitignore`. Read the **Uncovered Line #s** column: each is either a missing test or dead code.

> ⚠️ **Coverage measures what ran, not what was verified.** A test with no `expect` gives 100% coverage and 0% protection. Chase *meaningful* assertions on validators and hash helpers, not a number.

---

## 📤 What to submit

1. PR with `vitest.config.js`, `tests/unit/**`, updated `package.json`
2. Screenshot of `npm run test:coverage` showing `validators/` and `utils/password.js` ≥ 90% lines
3. Short answers: Unit vs integration test? Mock vs fake? Why test properties of `hashPassword` instead of exact output? What does 100% coverage *not* tell you?

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| Vitest configured; `npm test` green; scripts present | 1 |
| Validators: ≥ 5 rules tested with valid, invalid **and** boundary cases (`it.each`) | 3 |
| Hash helpers: format, salt, verify, malformed input | 2 |
| One mock/fake test (`vi.fn` hasher) and one fake-timer test | 2 |
| Coverage threshold configured and passing; screenshot | 1 |
| Short answers | 1 |

### ⭐ Bonus (+2)
Extract a small pure module (e.g. `src/utils/display-name.js` with `fullName(user)` and `initials(user)`), use it in the service, and ship it with tests written **before** the implementation (TDD red → green).

---

<div align="center">

⬅️ [Topic 11.1](../11.1%20Developer%20Tooling/README.md)  ·  **Topic 11.2**  ·  [Topic 11.3 ➡️](../11.3%20API%20and%20Component%20Testing/README.md)

</div>
