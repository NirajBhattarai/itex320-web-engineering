<div align="center">

![Header](https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=1200&q=80)

# 🎨 Topic 1.3 — Styling Systems

### CSS Grid · Flexbox · Utility-first CSS (Tailwind) · Design systems & tokens

### Assignment 1.3: style `frontend-lab` with Tailwind CSS v4, a responsive layout, and CSS-variable design tokens (light/dark)

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_1-Topic_1.3-f97316?style=for-the-badge)

![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-Grid_%2B_Flexbox-1572B6?style=flat-square&logo=css3&logoColor=white)
![Tokens](https://img.shields.io/badge/Design-Tokens-a855f7?style=flat-square)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | Flexbox vs Grid, utility-first, design systems |
| [A](#part-a-install-tailwind-v4) | Tailwind v4 with the Vite plugin |
| [B](#part-b-design-tokens) | Tokens via CSS variables + `@theme` |
| [C](#part-c-responsive-layout-grid--flexbox) | Responsive layout: nav (flex) + card grid |
| [D](#part-d-reusable-ui-primitives) | `Button` and `Card` primitives, dark mode |
| [📤](#-what-to-submit) | Submission and marking |

> Continue in `frontend-lab` from 1.2.
>
> ```bash
> git checkout -b assignment-1.3
> ```

---

## 0. Concepts (read first)

### Flexbox vs Grid

| | Flexbox | Grid |
|---|---------|------|
| Dimension | **One** axis (row or column) | **Two** axes |
| Best for | Navbars, toolbars, centering, button rows | Page layouts, card galleries, dashboards |
| Key props | `display:flex; gap; justify-content; align-items; flex-wrap` | `display:grid; grid-template-columns; gap; grid-area` |
| Responsive trick | `flex-wrap` | `repeat(auto-fill, minmax(16rem, 1fr))` |

Rule of thumb: **content decides size → flex; layout decides size → grid.** They compose.

### Utility-first CSS (Tailwind)
Style by composing small single-purpose classes in markup (`flex items-center gap-4 p-4 md:p-8`). Wins: no naming, no dead CSS, consistent scale, tiny output (only used classes are generated). Costs: noisy markup, so **extract components**, not CSS classes.

| Approach | Example | Trade-off |
|----------|---------|-----------|
| Plain/BEM CSS | `.card__title` | Naming and cascade management |
| CSS Modules | `styles.card` | Scoped, but more files |
| **Utility (Tailwind)** | `p-4 rounded-lg` | Fast, consistent; learn the vocabulary |
| CSS-in-JS | styled-components | Runtime cost; less common in new projects |

### Design systems
A shared language of **tokens** (colour, spacing, type, radius), **primitives** (Button, Input, Card) and **patterns** (forms, nav), plus documentation. Tokens are the contract: change `--color-primary` once and the whole UI updates, including dark mode.

```text
Tokens (CSS variables)  →  Primitives (Button, Card)  →  Patterns (UserList)  →  Pages
```

### Responsive and accessible basics
Mobile-first breakpoints (`sm 40rem`, `md 48rem`, `lg 64rem`), relative units (`rem`), `prefers-color-scheme`, visible focus rings, and contrast ≥ 4.5:1 for body text.

---

## Part A: Install Tailwind v4

```bash
npm install tailwindcss @tailwindcss/vite
```

`vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({ plugins: [react(), tailwindcss()] });
```

Replace `src/index.css` entirely with:

```css
@import "tailwindcss";
```

Make sure `main.jsx` imports `./index.css`. Smoke test: `<h1 className="text-3xl font-bold underline">Hello</h1>`.

> **Using Tailwind v3 instead?** Install `tailwindcss@3 postcss autoprefixer`, run `npx tailwindcss init -p`, set `content: ['./index.html','./src/**/*.{js,jsx}']`, and use `@tailwind base; @tailwind components; @tailwind utilities;`. Note this in your submission.

---

## Part B: Design tokens

`src/index.css`:

```css
@import "tailwindcss";

/* 1. Raw tokens, switched by the data-theme attribute set in ThemeContext */
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --primary: #0ea5e9;
  --primary-contrast: #ffffff;
  --border: #e2e8f0;
  --radius: 0.75rem;
}
[data-theme="dark"] {
  --bg: #0b1220;
  --surface: #131c2e;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --primary: #38bdf8;
  --primary-contrast: #06202e;
  --border: #243049;
}

/* 2. Expose tokens as Tailwind utilities: bg-surface, text-muted, rounded-card ... */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-fg: var(--text);
  --color-muted: var(--muted);
  --color-primary: var(--primary);
  --color-primary-contrast: var(--primary-contrast);
  --color-line: var(--border);
  --radius-card: var(--radius);
  --font-sans: "Inter", system-ui, sans-serif;
}

body { @apply bg-bg text-fg font-sans antialiased; }
```

Your `ThemeContext` from 1.2 already sets `data-theme`, so the toggle now recolours everything. Document every token in a `docs/tokens.md` table (name, light value, dark value, usage).

---

## Part C: Responsive layout (Grid + Flexbox)

Navbar (**Flexbox**) in `Layout.jsx`:

```jsx
<header className="border-b border-line bg-surface">
  <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 p-4">
    <span className="mr-auto text-lg font-semibold">frontend-lab</span>
    <NavLink to="/users" className="text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-primary">Users</NavLink>
    {/* login/logout + theme toggle */}
  </nav>
</header>
<main className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></main>
```

Users list (**Grid**):

```jsx
<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {users.map((u) => (
    <li key={u.id}><UserCard user={u} /></li>
  ))}
</ul>
```

Home page: a hero section using flex (stacked on mobile, side-by-side on `md:`) and a 3-feature grid using `grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]`.

Test at 360px, 768px and 1280px using DevTools device mode.

---

## Part D: Reusable UI primitives

`src/components/ui/Button.jsx`:

```jsx
const variants = {
  primary: 'bg-primary text-primary-contrast hover:opacity-90',
  ghost: 'border border-line text-fg hover:bg-surface',
};

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-card px-4 py-2 font-medium transition
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
        disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
```

`src/components/ui/Card.jsx`:

```jsx
export function Card({ className = '', ...props }) {
  return <div className={`rounded-card border border-line bg-surface p-4 shadow-sm ${className}`} {...props} />;
}
```

Refactor every page to use `Button` and `Card` (no raw colour hex values in JSX). Add `prefers-color-scheme` as the initial theme default in `ThemeContext`.

---

## 📤 What to submit

1. Repo/PR with the styled `frontend-lab` and `docs/tokens.md`  
2. Screenshots: mobile (360px) + desktop, light + dark  
3. Short answers: when Grid vs Flexbox; two pros and two cons of utility-first CSS; why tokens beat hard-coded colours  

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| Tailwind installed and working (v4 or v3 noted) | 1 |
| Design tokens in CSS variables + dark mode | 3 |
| Responsive layout using both Grid and Flexbox | 3 |
| `Button` / `Card` primitives used consistently | 2 |
| Short answers | 1 |

### ⭐ Bonus (+2)
Add accessible focus styles and verify with the Lighthouse accessibility audit scoring ≥ 95.

---

<div align="center">

⬅️ [Topic 1.2](../1.2%20UI%20Frameworks%20-%20React/README.md)  ·  **Topic 1.3**  ·  [Topic 1.4 ➡️](../1.4%20State%20Management/README.md)

</div>
