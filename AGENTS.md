# Holiday Planner — Agent Instructions

## Project shape

- **Vite + React 18** SPA, Tailwind CSS v4 (`@tailwindcss/vite`), react-router v7 (`createBrowserRouter`)
- Single package (not a monorepo). Root is the app.
- TypeScript compiled by Vite's built-in transformer; no `tsconfig.json`. Server runs via `tsx`.

## Commands

```bash
npm run dev        # Start frontend dev server
npm run server     # Start backend dev server (nodemon + tsx, watches ./server)
npm run build      # Vite production build → dist/
npm test             # vitest --run (jsdom environment, setup at src/test/setup.ts)
```

**No lint or typecheck command exists.** Run `npx tsc` manually if needed, but note there is no `tsconfig.json`.

## Dev server

- Frontend: `http://localhost:5173` (Vite default). Behind Nginx on Docker at port 8080.
- Backend API: `http://localhost:3001` (Express + Socket.IO, data persisted to `server/data/state.json`).
- `.env.example` lists required variables; copy to `.env`.

## Auth0 integration

All routes are protected via `withAuthenticationRequired(Layout)` (`src/app/routes.ts:11`). The app uses the Auth0 React SDK for SPA auth flow. **Common gotchas:**

- Callback/logout/web origin URLs must be set in Auth0 Dashboard (see README).
- If stuck on loading screen, ensure IP/hostname is allowed per README SSL section.
- `onBeforeInternalNavigation` in routes.ts has a known callback-detection workaround — don't simplify it without understanding the redirect flow.

## Docker

```bash
docker compose up --build
```

Two services: `backend` (Node/Express on port 3001) and `frontend` (Nginx serving Vite build on port 80). Frontend is HTTP-only; SSL sits at an edge proxy. Self-signed certs are needed for internal HTTPS between Nginx and backend in development mode — see README for the OpenSSL command.

## Key files

| File | Purpose |
|---|---|
| `src/app/App.tsx` | Root component: wraps `HolidayProvider` + router |
| `src/app/routes.ts` | Route definitions, auth guard (`ProtectedLayout`) |
| `src/app/components/Layout.tsx` | Shell: header, sidebar, mobile drawer, ActivityPool |
| `src/app/context/HolidayContext.tsx` | Global state provider for activities/categories/date range |
| `src/app/types.ts` | Core types: `Activity`, `Category`, `TimeSlot`, `HolidayData` |
| `server/index.ts` | Backend entry (Express + Socket.IO) |

## Mobile sidebar gotcha

In `Layout.tsx`, the mobile hamburger drawer (`Sheet`) and desktop collapsed sidebar both render `SidebarContent`. The ActivityPool visibility inside the sidebar uses a compound condition — when adding new sections that appear in the sidebar, remember:

- On **desktop**: show when `!isCollapsed`
- On **mobile**: show only when `isDrawerOpen` (the sheet is open)
- The bottom-fixed mobile ActivityPool strip uses `hideActivityDrawer` to suppress on `/itinerary` and `/research`.

Pattern for sidebar sections: `{(!isCollapsed || isMobile) && (!isMobile || isDrawerOpen)}`.

## Testing

- Vitest config lives in `vite.config.ts:test`. Environment is jsdom.
- Setup file at `src/test/setup.ts` mocks `localStorage` and clears it per test. Tests should not rely on real storage.
- Test files coexist with source (`*.test.tsx`) next to their components/views.

## Constraints

- **pnpm overrides**: `vite` is pinned to `6.3.5` in pnpm config despite `^6.4.1` in dependencies. Don't remove the override without verifying compatibility.
- react-dnd uses `TouchBackend` on mobile, `HTML5Backend` on desktop (`Layout.tsx`). Do not change this logic — touch events are deliberately delayed (200ms) to avoid blocking scroll.
- Research content is stored as markdown in `HolidayData.researchContent`. Rendered via `react-markdown`.
