# Unit 1 — Modern Frontend Engineering and Web Fundamentals (8 Hours)

Builds the client side of the course: modern JavaScript, a React SPA, a styling system, server-state management, an optimised build, and measured performance. The SPA (`frontend-lab`) later connects to the Unit 2 `users-api`.

| Topic | Focus | Assignment |
|-------|--------|------------|
| [1.1 Advanced JavaScript](./1.1%20Advanced%20JavaScript/README.md) | ESM vs CJS, classes, closures, async/await, event loop | `js-fundamentals` async utilities + event-loop lab |
| [1.2 UI Frameworks - React](./1.2%20UI%20Frameworks%20-%20React/README.md) | Components, hooks, Context, routing, SSR/SSG/hydration | Vite + React 19 SPA with Router + Context |
| [1.3 Styling Systems](./1.3%20Styling%20Systems/README.md) | Grid, Flexbox, Tailwind, design systems | Tailwind v4 + design tokens + responsive layout |
| [1.4 State Management](./1.4%20State%20Management/README.md) | TanStack Query/SWR, Redux Toolkit, Zustand | Server state with React Query (+ optional Zustand) |
| [1.5 Build Tools](./1.5%20Build%20Tools/README.md) | Vite, Webpack concepts, bundling, code splitting | Lazy routes + bundle analysis + `BUILD.md` |
| [1.6 Web Performance](./1.6%20Web%20Performance/README.md) | Critical render path, caching layers, Lighthouse | Optimise SPA + before/after Lighthouse |

```text
After Unit 1
├── js-fundamentals/   (ESM, async utils, event-loop demos)
└── frontend-lab/
    ├── src/ (pages, context, api, hooks, store, components/ui)
    ├── index.css (Tailwind v4 + design tokens)
    ├── vite.config.js (lazy chunks, visualizer)
    ├── BUILD.md · PERFORMANCE.md · lighthouse/
    └── → connects to Unit 2 users-api via VITE_API_URL
```
