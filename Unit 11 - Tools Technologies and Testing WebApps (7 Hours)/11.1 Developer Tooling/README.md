<div align="center">

![Header](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80)

# 🧰 Topic 11.1 — Developer Tooling

### Git workflows · npm scripts · ESLint / oxlint · Prettier · EditorConfig · VS Code & DevTools

### Assignment 11.1: add lint + format scripts and a pre-commit checklist to `users-api`, then profile the Bookstore UI in DevTools

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_11-Topic_11.1-0ea5e9?style=for-the-badge)

![ESLint](https://img.shields.io/badge/ESLint-flat_config-4B32C3?style=flat-square&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-format-F7B93E?style=flat-square&logo=prettier&logoColor=black)
![Git](https://img.shields.io/badge/Git-feature_branches-F05032?style=flat-square&logo=git&logoColor=white)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | What each tool is for; the "fast feedback" ladder |
| [A](#part-a-git-feature-branch-workflow) | Feature branches, small commits, pull requests |
| [B](#part-b-eslint-prettier-editorconfig) | ESLint (flat config), Prettier, EditorConfig for `users-api` |
| [C](#part-c-npm-scripts-and-the-pre-commit-checklist) | npm scripts + `docs/PRE-COMMIT.md` |
| [D](#part-d-oxlint-for-the-react-spa) | oxlint on the React frontend |
| [E](#part-e-vs-code-and-devtools) | VS Code settings, DevTools Network + Performance |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** `users-api` from [Assignment 2.2](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/2.2 Express Architecture & Middleware/README.md>) or later (it needs `src/` and a working `npm test`). The React UI is the [Bookstore reference frontend](<../../Unit 2 - Backend Engineering & Secure API Design (14 Hours)/Reference Project - Bookstore/README.md>).
>
> ```bash
> cd users-api
> git checkout -b assignment-11.1
> mkdir -p docs/devtools
> ```

---

## 0. Concepts (read first)

| Tool | Question it answers | Runs |
|------|---------------------|------|
| **EditorConfig** | Tabs or spaces? Line endings? | In your editor, always |
| **Prettier** | How should this code *look*? (formatter, no opinions to argue about) | On save / `npm run format` |
| **ESLint / oxlint** | Is this code *probably wrong*? (unused vars, `==`, missing `await`) | On save / `npm run lint` |
| **Tests** | Does it *behave* correctly? (Topics 11.2–11.4) | `npm test` |
| **CI** | Did *everyone's* change pass all of the above? ([Topic 4.2](<../../Unit 4 - Professional Deployment and Next-Gen Web (11 Hours)/4.2 CI-CD Pipelines/README.md>)) | On every PR |

```text
fast ──────────────────────────────────────────────────────► slow
editor squiggles → format on save → lint → unit tests → pre-push → CI → code review
```

Rule of thumb: the **earlier** a mistake is caught, the **cheaper** it is. Formatters end style debates; linters catch bugs; neither replaces tests.

---

## Part A: Git feature-branch workflow

```bash
git switch main && git pull                  # start from the latest main
git switch -c feat/users-lint-format         # one branch = one purpose
# ...edit, then commit in small logical steps:
git add eslint.config.js package.json
git commit -m "chore: add ESLint flat config"
git push -u origin feat/users-lint-format
gh pr create --fill                          # or open the PR in the GitHub UI
```

| Habit | Why |
|-------|-----|
| Never commit directly to `main` | `main` stays deployable; protect it with required checks |
| Branch names `feat/…`, `fix/…`, `chore/…`, `docs/…` | Readable history and PR lists |
| Commit messages: `type: imperative summary` (Conventional Commits) | Easy changelogs, easy `git log --oneline` |
| Small PRs (< ~300 changed lines) | Reviewable in 15 minutes |
| Keep **formatting-only** changes in their own commit | Reviewers can skip it; `git blame` stays useful |

**PR description template** (save as `.github/pull_request_template.md`):

```md
## What & why
<!-- one or two sentences -->

## How to test
- [ ] `npm run check` passes locally
- [ ] Manual steps (if UI/API behaviour changed):

## Screenshots / notes
```

---

## Part B: ESLint, Prettier, EditorConfig

```bash
npm i -D eslint @eslint/js globals prettier eslint-config-prettier
```

### B.1 `eslint.config.js` (flat config, ESLint 9+)

```js
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier'; // turns OFF rules that fight Prettier

export default [
  { ignores: ['node_modules/', 'coverage/', 'dist/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: {
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': [
        'error',
        // `_name` = intentionally unused; rest-siblings allow `({ passwordHash, ...user }) => user`
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    // server.js is the process entry point: logging startup is fine there
    files: ['src/server.js'],
    rules: { 'no-console': 'off' },
  },
  prettier, // keep LAST
];
```

> 💡 Express error handlers need all four parameters `(err, req, res, next)` even when `next` is unused. Keep the `// eslint-disable-next-line no-unused-vars` comment above them. Always disable **one rule on one line**, with a reason.

### B.2 `.prettierrc.json` and `.prettierignore`

```json
{ "singleQuote": true, "trailingComma": "all", "printWidth": 100, "semi": true }
```

```text
node_modules
coverage
package-lock.json
```

### B.3 `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

> ⚠️ The first `prettier --write .` will touch many files (column-aligned schemas will be reflowed). That is expected. Commit it **alone**: `git commit -am "style: apply Prettier"`.

---

## Part C: npm scripts and the pre-commit checklist

### C.1 Scripts

```bash
npm pkg set scripts.lint="eslint ."
npm pkg set scripts.lint:fix="eslint . --fix"
npm pkg set scripts.format="prettier --write ."
npm pkg set scripts.format:check="prettier --check ."
npm pkg set scripts.check="npm run lint && npm run format:check && npm test"
```

| Script | Used by |
|--------|---------|
| `lint`, `format:check` | CI (read-only, fails the build) |
| `lint:fix`, `format` | You (rewrites files) |
| `check` | You, before every push — **the same thing CI will run** |

npm runs a script named `pre<name>` automatically before `<name>`; use sparingly. Prefer explicit `check`.

### C.2 `docs/PRE-COMMIT.md`

```md
# Pre-commit checklist

Run before every `git commit` (or `git push`):

- [ ] `npm run format` — no formatting diffs left
- [ ] `npm run lint` — 0 errors, 0 new warnings
- [ ] `npm test` — all green
- [ ] No `.env`, tokens, or `console.log` debugging left in the diff (`git diff --staged`)
- [ ] New behaviour has a test (or a note explaining why not)
- [ ] Commit message follows `type: summary`
- [ ] Branch is not `main`
```

---

## Part D: oxlint for the React SPA

The Bookstore frontend already uses [oxlint](https://oxc.rs/docs/guide/usage/linter) (a Rust linter, 50–100× faster than ESLint, no config needed to start).

```bash
cd bookstore/frontend
npm run lint            # oxlint, reads .oxlintrc.json
npm i -D prettier && npm pkg set scripts.format="prettier --write src" scripts.format:check="prettier --check src"
```

| ESLint | oxlint |
|--------|--------|
| Huge plugin ecosystem, custom rules | Fast, batteries-included, fewer plugins |
| Best when you need type-aware or niche rules | Best as a quick first gate; can run **alongside** ESLint |

---

## Part E: VS Code and DevTools

`.vscode/settings.json` (committed, so the whole team shares it):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "files.eol": "\n"
}
```

Recommended extensions: **ESLint**, **Prettier**, **EditorConfig**, **Vitest** (11.2), **Playwright Test** (11.4). Learn: `Cmd/Ctrl+P` (open file), `Cmd/Ctrl+Shift+P` (commands), `F12` (go to definition), `F2` (rename symbol), JS Debug Terminal.

### E.1 Network tab (Bookstore UI at `http://localhost:5173`)

1. Open DevTools → **Network** → filter **Fetch/XHR** → tick **Disable cache** → reload.
2. Click the `books?…` request: check **Status**, **Response**, and **Headers** (`X-Request-Id` comes from the Unit 2 `requestId` middleware).
3. Type in the search box: count requests. Does every keystroke send one? (It does — a *debounce* would fix it.)
4. Throttle to **Slow 4G** and note the load time.
5. Trigger a validation error (create a user with a bad email) and read the `application/problem+json` body.

### E.2 Performance tab

1. **Performance** → click **Record and reload** → stop after the table appears.
2. Find **LCP**, the **Main** thread flame chart, and any **Long task** (red corner).
3. Optional: run **Lighthouse** and note the Performance score.

---

## 📤 What to submit

1. PR containing `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, updated `package.json`, `docs/PRE-COMMIT.md`
2. Terminal screenshot: `npm run check` passing
3. In `docs/devtools/`: `network.png` (books request with headers visible, throttling shown) and `performance.png` (recording with LCP visible) + a 3–5 line `docs/devtools/NOTES.md` describing one finding each
4. Short answers: Formatter vs linter? Why commit formatting separately? Why must CI run the same command as `npm run check`?

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| ESLint + Prettier + EditorConfig configured; `lint` and `format:check` pass | 3 |
| npm scripts (`lint`, `format`, `check`) | 2 |
| `docs/PRE-COMMIT.md` checklist | 1 |
| Feature branch + clean commit history (≥ 3 meaningful commits) | 1 |
| DevTools screenshots + findings | 2 |
| Short answers | 1 |

### ⭐ Bonus (+2)
Add `simple-git-hooks` + `lint-staged` so `git commit` automatically formats and lints only staged files.

---

<div align="center">

⬅️ [Unit 11 index](../README.md)  ·  **Topic 11.1**  ·  [Topic 11.2 ➡️](../11.2%20Unit%20Testing/README.md)

</div>
