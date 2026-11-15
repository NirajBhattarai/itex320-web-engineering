<div align="center">

![Header](https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80)

# ⚛️ Topic 1.2 — UI Frameworks (React)

### Component architecture · Hooks · Context · Routing · Hydration · SSR / SSG

### Assignment 1.2: scaffold `frontend-lab`, a Vite + React 19 SPA with React Router, several pages, and theme/auth Context

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_1-Topic_1.2-f97316?style=for-the-badge)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | Components, hooks, context, routing, SSR/SSG/hydration |
| [A](#part-a-scaffold) | Vite + React 19 scaffold |
| [B](#part-b-routing--layout) | React Router, layout, pages |
| [C](#part-c-context-theme--auth-stub) | `ThemeContext` + `AuthContext` stub |
| [D](#part-d-hooks-practice) | Custom hook + effect cleanup |
| [📤](#-what-to-submit) | Submission and marking |

> This app is the **foundation for the rest of Unit 1**. Later it connects to the Unit 2 `users-api`.
>
> ```bash
> git checkout -b assignment-1.2
> ```

---

## 0. Concepts (read first)

### Component architecture
UI = a **tree of functions** that take `props` and return JSX. Keep components small, push state down, lift it up only when siblings need it.

```text
App
├── Layout (nav, <Outlet/>)
│   ├── HomePage
│   ├── UsersPage → UserCard × n
│   └── LoginPage
└── Providers (Theme, Auth)
```

### Hooks

| Hook | Use |
|------|-----|
| `useState` | Local state |
| `useEffect` | Sync with the outside world (fetch, subscriptions). **Always clean up** |
| `useMemo` / `useCallback` | Cache a value or function across renders (measure first) |
| `useRef` | Mutable value or DOM node that doesn't trigger render |
| `useContext` | Read shared values without prop drilling |
| React 19: `use`, `useActionState`, `useOptimistic` | Read promises/context, form actions, optimistic UI |

Rules: call hooks only at the top level of components or custom hooks.

### Context
Broadcast values (theme, current user) to a subtree. Good for **low-frequency** global data. Not a replacement for a data-fetching or state library (see 1.4).

### Routing
Client-side routing swaps components on URL change without a full page load (History API). React Router gives nested routes, `<Outlet/>`, `<Link>`, params, and loaders.

### Rendering strategies

| Strategy | HTML produced | Typical tools | Good for |
|----------|---------------|---------------|----------|
| **CSR** | empty shell, JS renders | Vite SPA | dashboards behind login |
| **SSR** | server renders each request | Next.js, React Router framework mode | personalised, SEO pages |
| **SSG** | built once at build time | Astro, Next export | docs, blogs, marketing |
| **Hydration** | JS attaches listeners to server HTML | `hydrateRoot` | makes SSR/SSG interactive |

A hydration mismatch (server HTML ≠ first client render, e.g. `Date.now()`) causes warnings and re-renders. This lab is **CSR only**; you will explain SSR/SSG in your short answers.

---

## Part A: Scaffold

```bash
npm create vite@latest frontend-lab -- --template react
cd frontend-lab
npm install
npm install react-router-dom
npm run dev          # http://localhost:5173
```

Confirm `package.json` lists `react` and `react-dom` at `^19`. Delete the demo counter and logos from `App.jsx`.

Suggested structure:

```text
src/
├── main.jsx
├── App.jsx
├── context/    ThemeContext.jsx, AuthContext.jsx
├── components/ Layout.jsx, UserCard.jsx
├── hooks/      useLocalStorage.js
└── pages/      Home.jsx, Users.jsx, UserDetail.jsx, Login.jsx, NotFound.jsx
```

---

## Part B: Routing & layout

`src/main.jsx`:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

`src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Users from './pages/Users.jsx';
import UserDetail from './pages/UserDetail.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```

`src/components/Layout.jsx`:

```jsx
import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  return (
    <>
      <header>
        <nav>
          <NavLink to="/">Home</NavLink> <NavLink to="/users">Users</NavLink>{' '}
          {user ? <button onClick={logout}>Logout ({user.name})</button> : <NavLink to="/login">Login</NavLink>}
          <button onClick={toggle} aria-label="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
        </nav>
      </header>
      <main><Outlet /></main>
    </>
  );
}
```

Build at least **five** pages/routes (Home, Users list, User detail with `useParams`, Login, 404). Use hard-coded user data for now.

---

## Part C: Context (theme + auth stub)

`src/context/ThemeContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
```

> React 19 lets you render `<ThemeContext value=…>` directly (no `.Provider`).

`src/context/AuthContext.jsx` (stub, no real backend yet):

```jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = async (email) => setUser({ id: 1, name: email.split('@')[0], email }); // TODO Unit 2: POST /auth/login
  const logout = () => setUser(null);
  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
```

Add a `ProtectedRoute` component that redirects to `/login` (`<Navigate to="/login" replace />`) when `user` is null, and wrap a `/profile` page with it.

---

## Part D: Hooks practice

`src/hooks/useLocalStorage.js`:

```js
import { useEffect, useState } from 'react';

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initial;
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue];
}
```

Use it on the Users page for a search box that persists. Add one `useEffect` with a **cleanup** (e.g. `window` resize listener showing viewport width) and explain what StrictMode's double-invoke taught you.

---

## 📤 What to submit

1. Repo/PR with `frontend-lab/` (`npm run dev` and `npm run build` both succeed)  
2. Screenshots: two routes, theme toggle (light + dark), protected route redirect  
3. Short answers: CSR vs SSR vs SSG (one use case each); what hydration is; when Context is the wrong tool  

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| Vite + React 19 scaffold, clean structure | 2 |
| Router: layout, nested/param routes, 404 | 3 |
| Theme + Auth Context (custom hooks, guarded) | 3 |
| Custom hook + effect cleanup | 1 |
| Short answers | 1 |

### ⭐ Bonus (+2)
Use React Router `loader`s (data router with `createBrowserRouter`) for the user detail page.

---

<div align="center">

⬅️ [Topic 1.1](../1.1%20Advanced%20JavaScript/README.md)  ·  **Topic 1.2**  ·  [Topic 1.3 ➡️](../1.3%20Styling%20Systems/README.md)

</div>
